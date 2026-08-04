import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const owned = await prisma.ownedProduct.findMany({
    where: { householdId: user.householdId },
    orderBy: { purchaseDate: 'desc' },
  });

  const alerts = await prisma.priceAlert.findMany({
    where: { householdId: user.householdId },
    include: { product: true },
  });

  const saved = await prisma.savedProduct.findMany({
    where: { householdId: user.householdId },
    include: { product: true },
  });

  return NextResponse.json({ owned, alerts, saved });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { name, category, purchasePrice, storeName, serialNumber, warrantyExpiryDate } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name required' }, { status: 400 });
    }

    const ownedItem = await prisma.ownedProduct.create({
      data: {
        userId: user.id,
        householdId: user.householdId,
        name: name.trim(),
        category: category || 'ELECTRONICS',
        purchasePrice: Number(purchasePrice) || 0,
        storeName: storeName?.trim() || 'Retailer',
        serialNumber: serialNumber?.trim() || null,
        warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : null,
      },
    });

    return NextResponse.json({ success: true, item: ownedItem });
  } catch (error) {
    console.error('Create owned product error:', error);
    return NextResponse.json({ error: 'Failed to add owned product' }, { status: 500 });
  }
}
