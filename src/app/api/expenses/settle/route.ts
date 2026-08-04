import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Settle all pending splits between user and targetUserId
    // 1. Where user paid and targetUserId owes
    await prisma.expenseSplit.updateMany({
      where: {
        userId: targetUserId,
        isSettled: false,
        expense: {
          householdId: user.householdId,
          paidById: user.id,
        },
      },
      data: {
        isSettled: true,
        settledAt: new Date(),
      },
    });

    // 2. Where targetUserId paid and user owes
    await prisma.expenseSplit.updateMany({
      where: {
        userId: user.id,
        isSettled: false,
        expense: {
          householdId: user.householdId,
          paidById: targetUserId,
        },
      },
      data: {
        isSettled: true,
        settledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'All outstanding splits settled successfully!' });
  } catch (error) {
    console.error('Settle expense error:', error);
    return NextResponse.json({ error: 'Failed to settle expenses' }, { status: 500 });
  }
}
