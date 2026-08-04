import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const store = searchParams.get('store');
  const category = searchParams.get('category');

  const purchases = await prisma.purchaseRecord.findMany({
    where: {
      householdId: user.householdId,
      ...(store ? { storeName: { contains: store } } : {}),
      ...(category && category !== 'ALL' ? { category } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  return NextResponse.json({ purchases });
}
