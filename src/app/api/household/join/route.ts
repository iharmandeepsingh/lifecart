import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await req.json();
    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const household = await prisma.household.findUnique({
      where: { inviteCode: cleanCode },
    });

    if (!household) {
      return NextResponse.json({ error: 'Invalid household invite code.' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId: household.id,
        },
      },
    });

    if (!existingMembership) {
      await prisma.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'MEMBER',
        },
      });
    }

    // Update user active householdId
    await prisma.user.update({
      where: { id: user.id },
      data: { householdId: household.id },
    });

    return NextResponse.json({ message: 'Successfully joined household!', household });
  } catch (error) {
    console.error('Join household error:', error);
    return NextResponse.json({ error: 'Failed to join household' }, { status: 500 });
  }
}
