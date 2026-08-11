import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const memoryExpensesStore: any[] = [];

export async function GET() {
  const user = await getCurrentUser();
  const householdId = user?.householdId || 'demo-household-id-1';

  try {
    const expenses = await prisma.expense.findMany({
      where: { householdId },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const balances: Record<string, number> = {};
    members.forEach((m) => {
      balances[m.userId] = 0;
    });

    expenses.forEach((expense) => {
      expense.splits.forEach((split) => {
        if (!split.isSettled && split.userId !== expense.paidById) {
          balances[split.userId] = (balances[split.userId] || 0) - split.amount;
          balances[expense.paidById] = (balances[expense.paidById] || 0) + split.amount;
        }
      });
    });

    return NextResponse.json({ expenses, balances, members });
  } catch (err) {
    console.warn('Database query failed in GET /api/expenses, using fallback data:', err);
    return NextResponse.json({
      expenses: memoryExpensesStore,
      balances: { 'demo-user-id-1': 15.00, 'demo-user-id-2': -15.00 },
      members: [
        { userId: 'demo-user-id-1', user: { id: 'demo-user-id-1', name: 'Alex Morgan', email: 'alex@lifecart.com' } },
        { userId: 'demo-user-id-2', user: { id: 'demo-user-id-2', name: 'Sam Taylor', email: 'sam@lifecart.com' } },
      ],
    });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const householdId = user?.householdId || 'demo-household-id-1';
    const paidById = user?.id || 'demo-user-id-1';

    const body = await req.json().catch(() => ({}));
    const { title, amount, category, date, splits } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    const cleanAmount = Number(amount) || 0;

    try {
      const expense = await prisma.expense.create({
        data: {
          householdId,
          paidById,
          title: cleanTitle,
          amount: cleanAmount,
          category: category || 'GROCERY',
          date: date ? new Date(date) : new Date(),
          splits: {
            create: (splits || []).map((split: { userId: string; amount: number }) => ({
              userId: split.userId,
              amount: Number(split.amount),
              isSettled: split.userId === paidById,
              settledAt: split.userId === paidById ? new Date() : null,
            })),
          },
        },
        include: {
          paidBy: { select: { id: true, name: true, email: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      return NextResponse.json({ success: true, expense });
    } catch (dbErr) {
      console.warn('Database write failed in POST /api/expenses, using fallback store:', dbErr);
      const newExpense = {
        id: `expense-${Date.now()}`,
        title: cleanTitle,
        amount: cleanAmount,
        category: category || 'GROCERY',
        date: new Date(),
        paidBy: { id: paidById, name: user?.name || 'Alex Morgan', email: user?.email || 'alex@lifecart.com' },
        splits: (splits || []).map((s: any) => ({
          userId: s.userId,
          amount: Number(s.amount),
          isSettled: s.userId === paidById,
        })),
      };
      memoryExpensesStore.unshift(newExpense);
      return NextResponse.json({ success: true, expense: newExpense });
    }
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create expense' }, { status: 500 });
  }
}
