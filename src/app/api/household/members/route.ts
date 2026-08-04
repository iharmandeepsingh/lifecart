import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId: user.householdId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json({ members });
}
