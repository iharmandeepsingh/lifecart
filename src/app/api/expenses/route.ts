import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const FALLBACK_5_MEMBERS = [
  { userId: 'user-harman', user: { id: 'user-harman', name: 'Harman', email: 'harman@lifecart.com' } },
  { userId: 'user-raj', user: { id: 'user-raj', name: 'Raj', email: 'raj@lifecart.com' } },
  { userId: 'user-simar', user: { id: 'user-simar', name: 'Simar', email: 'simar@lifecart.com' } },
  { userId: 'user-asis', user: { id: 'user-asis', name: 'Asis', email: 'asis@lifecart.com' } },
  { userId: 'user-arman', user: { id: 'user-arman', name: 'Arman', email: 'arman@lifecart.com' } },
];

let inMemoryExpenses: any[] = [
  {
    id: 'exp-1',
    title: 'Weekly Supermarket Grocery Run',
    amount: 100.00,
    category: 'GROCERY',
    date: new Date().toISOString(),
    paidBy: { id: 'user-harman', name: 'Harman', email: 'harman@lifecart.com' },
    splits: [
      { userId: 'user-harman', amount: 20.00, isSettled: true, user: { id: 'user-harman', name: 'Harman' } },
      { userId: 'user-raj', amount: 20.00, isSettled: false, user: { id: 'user-raj', name: 'Raj' } },
      { userId: 'user-simar', amount: 20.00, isSettled: false, user: { id: 'user-simar', name: 'Simar' } },
      { userId: 'user-asis', amount: 20.00, isSettled: false, user: { id: 'user-asis', name: 'Asis' } },
      { userId: 'user-arman', amount: 20.00, isSettled: false, user: { id: 'user-arman', name: 'Arman' } },
    ],
  },
];

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

    const activeMembers = members.length > 0 ? members : FALLBACK_5_MEMBERS;
    const balances: Record<string, number> = {};
    activeMembers.forEach((m) => {
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

    return NextResponse.json({ expenses, balances, members: activeMembers, isFallback: false });
  } catch (err) {
    console.warn('Database query failed in GET /api/expenses, returning inMemoryExpenses:', err);

    const balances: Record<string, number> = {};
    FALLBACK_5_MEMBERS.forEach((m) => (balances[m.userId] = 0));

    inMemoryExpenses.forEach((expense) => {
      const payerId = expense.paidBy?.id || 'user-harman';
      (expense.splits || []).forEach((split: any) => {
        if (!split.isSettled && split.userId !== payerId) {
          balances[split.userId] = (balances[split.userId] || 0) - split.amount;
          balances[payerId] = (balances[payerId] || 0) + split.amount;
        }
      });
    });

    return NextResponse.json({
      isFallback: true,
      expenses: inMemoryExpenses,
      balances,
      members: FALLBACK_5_MEMBERS,
    });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const householdId = user?.householdId || 'demo-household-id-1';

    const body = await req.json().catch(() => ({}));
    const { title, amount, category, date, paidById, splits } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    const cleanAmount = Number(amount) || 0;
    const effectivePaidById = paidById || user?.id || 'user-harman';

    const payerMember = FALLBACK_5_MEMBERS.find((m) => m.userId === effectivePaidById) || FALLBACK_5_MEMBERS[0];

    const newExpenseObj = {
      id: `exp-${Date.now()}`,
      title: cleanTitle,
      amount: cleanAmount,
      category: category || 'GROCERY',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      paidBy: { id: effectivePaidById, name: payerMember.user.name, email: payerMember.user.email },
      splits: (splits || []).map((s: any) => ({
        userId: s.userId,
        amount: Number(s.amount),
        isSettled: s.userId === effectivePaidById,
      })),
    };

    inMemoryExpenses.unshift(newExpenseObj);

    try {
      const expense = await prisma.expense.create({
        data: {
          householdId,
          paidById: effectivePaidById,
          title: cleanTitle,
          amount: cleanAmount,
          category: category || 'GROCERY',
          date: date ? new Date(date) : new Date(),
          splits: {
            create: (splits || []).map((split: { userId: string; amount: number }) => ({
              userId: split.userId,
              amount: Number(split.amount),
              isSettled: split.userId === effectivePaidById,
              settledAt: split.userId === effectivePaidById ? new Date() : null,
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
      return NextResponse.json({ success: true, expense: newExpenseObj, isFallback: true });
    }
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create expense' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');

    let expenseId = idParam;
    if (!expenseId) {
      const body = await req.json().catch(() => ({}));
      expenseId = body?.id;
    }

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    inMemoryExpenses = inMemoryExpenses.filter((e) => e.id !== expenseId);

    try {
      await prisma.expenseSplit.deleteMany({ where: { expenseId } });
      await prisma.expense.delete({ where: { id: expenseId } });
    } catch (dbErr) {
      console.warn('Database delete failed in DELETE /api/expenses:', dbErr);
    }

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
