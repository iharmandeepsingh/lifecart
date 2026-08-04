import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { categorizeItem } from '@/lib/ocr';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    // Find inventory items where quantity <= minThreshold
    const allItems = await prisma.inventoryItem.findMany({
      where: { householdId: user.householdId },
    });

    const lowStockItems = allItems.filter(item => item.quantity <= item.minThreshold);

    if (lowStockItems.length === 0) {
      return NextResponse.json({ message: 'No low stock items found.', addedCount: 0 });
    }

    let defaultList = await prisma.groceryList.findFirst({
      where: { householdId: user.householdId, isDefault: true },
    });

    if (!defaultList) {
      defaultList = await prisma.groceryList.create({
        data: {
          householdId: user.householdId,
          title: 'Main Grocery List',
          isDefault: true,
        },
      });
    }

    let addedCount = 0;

    for (const item of lowStockItems) {
      // Check if already in active grocery list
      const existingInList = await prisma.groceryItem.findFirst({
        where: {
          listId: defaultList.id,
          name: { equals: item.name },
          isPurchased: false,
        },
      });

      if (!existingInList) {
        await prisma.groceryItem.create({
          data: {
            listId: defaultList.id,
            name: item.name,
            category: categorizeItem(item.name),
            quantity: Math.max(1, item.minThreshold - item.quantity + 1),
            unit: item.unit,
            addedById: user.id,
            notes: 'Auto-restocked from low inventory alert',
          },
        });
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added ${addedCount} low-stock item(s) to your Grocery List!`,
      addedCount,
    });
  } catch (error) {
    console.error('Restock low stock error:', error);
    return NextResponse.json({ error: 'Failed to restock items' }, { status: 500 });
  }
}
