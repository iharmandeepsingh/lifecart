import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const FALLBACK_5_MEMBERS = [
  { id: 'm-1', userId: 'user-harman', role: 'ADMIN', user: { id: 'user-harman', name: 'Harman', email: 'harman@lifecart.com' } },
  { id: 'm-2', userId: 'user-raj', role: 'MEMBER', user: { id: 'user-raj', name: 'Raj', email: 'raj@lifecart.com' } },
  { id: 'm-3', userId: 'user-simar', role: 'MEMBER', user: { id: 'user-simar', name: 'Simar', email: 'simar@lifecart.com' } },
  { id: 'm-4', userId: 'user-asis', role: 'MEMBER', user: { id: 'user-asis', name: 'Asis', email: 'asis@lifecart.com' } },
  { id: 'm-5', userId: 'user-arman', role: 'MEMBER', user: { id: 'user-arman', name: 'Arman', email: 'arman@lifecart.com' } },
];

export async function GET() {
  const user = await getCurrentUser();
  const householdId = user?.householdId || 'demo-household-id-1';

  try {
    const members = await prisma.householdMember.findMany({
      where: { householdId },
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

    if (members && members.length > 0) {
      return NextResponse.json({ members });
    }
    return NextResponse.json({ members: FALLBACK_5_MEMBERS });
  } catch (err) {
    console.warn('Database query failed in GET /api/household/members, returning 5 members fallback:', err);
    return NextResponse.json({ members: FALLBACK_5_MEMBERS });
  }
}
