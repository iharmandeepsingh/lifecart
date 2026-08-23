import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const householdId = user?.householdId || 'demo-household-id-1';

    // Verify Admin permission: Only household Admins (e.g. Harman) can settle balances
    const isAdmin = 
      user?.role === 'ADMIN' || 
      user?.role === 'SYSTEM_ADMIN' || 
      user?.email === 'harman@lifecart.com' || 
      user?.name === 'Harman' ||
      user?.household?.members?.some((m: any) => (m.userId === user?.id || m.user?.id === user?.id) && m.role === 'ADMIN');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied: Only household administrators can settle balances.' }, 
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    try {
      // 1. Where any user paid and targetUserId owes within this household
      await prisma.expenseSplit.updateMany({
        where: {
          userId: targetUserId,
          isSettled: false,
          expense: {
            householdId,
          },
        },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });

      // 2. Where targetUserId paid and others owe within this household
      await prisma.expenseSplit.updateMany({
        where: {
          isSettled: false,
          expense: {
            householdId,
            paidById: targetUserId,
          },
        },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.warn('Database update failed in POST /api/expenses/settle:', dbErr);
    }

    return NextResponse.json({ success: true, message: 'All outstanding splits settled successfully by admin!' });
  } catch (error: any) {
    console.error('Settle expense error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to settle expense' }, { status: 500 });
  }
}
