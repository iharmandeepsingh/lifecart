import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const expenses = await prisma.expense.findMany({
    where: { householdId: user.householdId },
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

  // Calculate settlement balance matrix
  const members = await prisma.householdMember.findMany({
    where: { householdId: user.householdId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const balances: Record<string, number> = {};
  members.forEach(m => {
    balances[m.userId] = 0;
  });

  expenses.forEach(expense => {
    expense.splits.forEach(split => {
      if (!split.isSettled && split.userId !== expense.paidById) {
        // The split user owes the paidBy user
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
        balances[expense.paidById] = (balances[expense.paidById] || 0) + split.amount;
      }
    });
  });

  return NextResponse.json({ expenses, balances, members });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { title, amount, category, date, splits } = await req.json();

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        householdId: user.householdId,
        paidById: user.id,
        title: title.trim(),
        amount: Number(amount),
        category: category || 'GROCERY',
        date: date ? new Date(date) : new Date(),
        splits: {
          create: (splits || []).map((split: { userId: string; amount: number }) => ({
            userId: split.userId,
            amount: Number(split.amount),
            isSettled: split.userId === user.id,
            settledAt: split.userId === user.id ? new Date() : null,
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
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
