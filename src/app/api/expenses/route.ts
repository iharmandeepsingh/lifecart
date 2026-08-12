import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { 
  getMemoryExpenses, 
  addMemoryExpense, 
  setMemoryExpenses,
  syncPullFromCloud 
} from '@/lib/cloudStore';

const FALLBACK_5_MEMBERS = [
  { userId: 'user-harman', user: { id: 'user-harman', name: 'Harman', email: 'harman@lifecart.com' } },
  { userId: 'user-raj', user: { id: 'user-raj', name: 'Raj', email: 'raj@lifecart.com' } },
  { userId: 'user-simar', user: { id: 'user-simar', name: 'Simar', email: 'simar@lifecart.com' } },
  { userId: 'user-asis', user: { id: 'user-asis', name: 'Asis', email: 'asis@lifecart.com' } },
  { userId: 'user-arman', user: { id: 'user-arman', name: 'Arman', email: 'arman@lifecart.com' } },
];

const EMAIL_MAP: Record<string, string> = {
  'user-harman': 'harman@lifecart.com',
  'user-raj': 'raj@lifecart.com',
  'user-simar': 'simar@lifecart.com',
  'user-asis': 'asis@lifecart.com',
  'user-arman': 'arman@lifecart.com',
};

async function resolveDbUserId(inputUserId: string, fallbackEmail = 'harman@lifecart.com'): Promise<string> {
  try {
    const byId = await prisma.user.findUnique({ where: { id: inputUserId } });
    if (byId) return byId.id;

    const targetEmail = EMAIL_MAP[inputUserId] || fallbackEmail;
    const byEmail = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (byEmail) return byEmail.id;

    const firstUser = await prisma.user.findFirst();
    if (firstUser) return firstUser.id;
  } catch (e) {
    console.warn('resolveDbUserId warning:', e);
  }
  return inputUserId;
}

export async function GET() {
  const user = await getCurrentUser();
  const householdId = user?.householdId || 'demo-household-id-1';

  // Sync latest cloud expenses across devices
  const { expenses: cloudExpenses } = await syncPullFromCloud();

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
    
    // Merge real-time cloud expenses
    if (cloudExpenses.length > 0) {
      const existingIds = new Set(expenses.map((e) => e.id));
      cloudExpenses.forEach((cloudExp) => {
        if (!existingIds.has(cloudExp.id)) {
          expenses.unshift(cloudExp);
        }
      });
    }

    const balances: Record<string, number> = {};
    activeMembers.forEach((m) => {
      balances[m.userId] = 0;
    });

    expenses.forEach((expense) => {
      expense.splits.forEach((split: any) => {
        if (!split.isSettled && split.userId !== expense.paidById) {
          balances[split.userId] = (balances[split.userId] || 0) - split.amount;
          balances[expense.paidById] = (balances[expense.paidById] || 0) + split.amount;
        }
      });
    });

    return NextResponse.json({ expenses, balances, members: activeMembers, isFallback: false });
  } catch (err) {
    console.warn('Database query failed in GET /api/expenses, returning cloud store expenses:', err);

    const activeExps = cloudExpenses.length > 0 ? cloudExpenses : getMemoryExpenses();
    const balances: Record<string, number> = {};
    FALLBACK_5_MEMBERS.forEach((m) => (balances[m.userId] = 0));

    activeExps.forEach((expense) => {
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
      expenses: activeExps,
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
    const requestedPaidById = paidById || user?.id || 'user-harman';
    const payerMember = FALLBACK_5_MEMBERS.find((m) => m.userId === requestedPaidById) || FALLBACK_5_MEMBERS[0];

    const newExpenseObj = {
      id: `exp-${Date.now()}`,
      title: cleanTitle,
      amount: cleanAmount,
      category: category || 'GROCERY',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      paidBy: { id: requestedPaidById, name: payerMember.user.name, email: payerMember.user.email },
      splits: (splits || []).map((s: any) => ({
        userId: s.userId,
        amount: Number(s.amount),
        isSettled: s.userId === requestedPaidById,
      })),
    };

    addMemoryExpense(newExpenseObj);

    try {
      const realPaidById = await resolveDbUserId(requestedPaidById, payerMember.user.email);

      const resolvedSplits = await Promise.all(
        (splits || []).map(async (split: { userId: string; amount: number }) => {
          const matchedEmail = EMAIL_MAP[split.userId] || 'harman@lifecart.com';
          const realUserId = await resolveDbUserId(split.userId, matchedEmail);
          return {
            userId: realUserId,
            amount: Number(split.amount),
            isSettled: realUserId === realPaidById,
            settledAt: realUserId === realPaidById ? new Date() : null,
          };
        })
      );

      const expense = await prisma.expense.create({
        data: {
          householdId,
          paidById: realPaidById,
          title: cleanTitle,
          amount: cleanAmount,
          category: category || 'GROCERY',
          date: date ? new Date(date) : new Date(),
          splits: {
            create: resolvedSplits,
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

    const currentMemory = getMemoryExpenses();
    setMemoryExpenses(currentMemory.filter((e) => e.id !== expenseId));

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
