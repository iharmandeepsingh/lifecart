import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const defaultList = await prisma.groceryList.findFirst({
      where: { householdId: user.householdId, isDefault: true },
      include: {
        items: {
          where: { isPurchased: true },
        },
      },
    });

    if (!defaultList || defaultList.items.length === 0) {
      return NextResponse.json({ message: 'No purchased items to move.', movedCount: 0 });
    }

    let movedCount = 0;

    for (const item of defaultList.items) {
      // Check if item already exists in household inventory
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          householdId: user.householdId,
          name: { equals: item.name },
        },
      });

      if (existing) {
        await prisma.inventoryItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + item.quantity,
            lastRestockedAt: new Date(),
          },
        });
      } else {
        await prisma.inventoryItem.create({
          data: {
            householdId: user.householdId,
            name: item.name,
            category: item.category === 'PRODUCE' || item.category === 'DAIRY' ? 'FRIDGE' : 'PANTRY',
            quantity: item.quantity,
            unit: item.unit,
            minThreshold: 1,
            location: item.category === 'PRODUCE' || item.category === 'DAIRY' ? 'FRIDGE' : 'PANTRY',
            lastRestockedAt: new Date(),
          },
        });
      }

      // Remove from grocery list after transferring to inventory
      await prisma.groceryItem.delete({ where: { id: item.id } });
      movedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${movedCount} item(s) to Household Inventory!`,
      movedCount,
    });
  } catch (error) {
    console.error('Transfer purchased items error:', error);
    return NextResponse.json({ error: 'Failed to transfer items to inventory' }, { status: 500 });
  }
}
