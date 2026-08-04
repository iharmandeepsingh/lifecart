import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const items = await prisma.inventoryItem.findMany({
    where: { householdId: user.householdId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { name, category, quantity, unit, minThreshold, location, expiryDate } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const qty = Number(quantity) || 1;
    const thresh = Number(minThreshold) || 1;
    const status = qty <= 0 ? 'OUT_OF_STOCK' : qty <= thresh ? 'LOW_STOCK' : 'IN_STOCK';

    const item = await prisma.inventoryItem.create({
      data: {
        householdId: user.householdId,
        name: name.trim(),
        category: category || 'PANTRY',
        quantity: qty,
        unit: unit?.trim() || 'pcs',
        minThreshold: thresh,
        location: location || 'PANTRY',
        status,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lastRestockedAt: new Date(),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Create inventory item error:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, quantity, minThreshold, category, location, consumeOne } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    let newQty = quantity !== undefined ? Number(quantity) : existing.quantity;
    if (consumeOne) {
      newQty = Math.max(0, existing.quantity - 1);
    }

    const thresh = minThreshold !== undefined ? Number(minThreshold) : existing.minThreshold;
    const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= thresh ? 'LOW_STOCK' : 'IN_STOCK';

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQty,
        minThreshold: thresh,
        status: newStatus,
        ...(category ? { category } : {}),
        ...(location ? { location } : {}),
        ...(consumeOne ? { lastConsumedAt: new Date() } : {}),
        lastRestockedAt: newQty > existing.quantity ? new Date() : undefined,
      },
    });

    // Create Notification if item reached low stock or out of stock
    if (newStatus !== existing.status && (newStatus === 'LOW_STOCK' || newStatus === 'OUT_OF_STOCK')) {
      await prisma.notification.create({
        data: {
          householdId: user.householdId,
          title: newStatus === 'OUT_OF_STOCK' ? 'Item Out of Stock' : 'Low Stock Alert',
          message: `${updated.name} is now ${newStatus === 'OUT_OF_STOCK' ? 'out of stock' : 'low on stock'} (${updated.quantity} ${updated.unit} left).`,
          type: 'LOW_STOCK',
          link: '/inventory',
        },
      });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Update inventory item error:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
