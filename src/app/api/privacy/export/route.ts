import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const household = await prisma.household.findUnique({
    where: { id: user.householdId },
    include: {
      users: { select: { id: true, name: true, email: true, createdAt: true } },
      expenses: true,
      receipts: true,
      inventory: true,
      purchases: true,
      ownedProducts: true,
      documents: true,
    },
  });

  return NextResponse.json(
    {
      exportDate: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      householdData: household,
    },
    {
      headers: {
        'Content-Disposition': `attachment; filename="lifecart-export-${user.name.toLowerCase().replace(/\s+/g, '-')}.json"`,
        'Content-Type': 'application/json',
      },
    }
  );
}
