import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { categorizeItem } from '@/lib/ocr';

const memoryItemsStore: any[] = [
  { id: 'item-1', name: 'Organic Whole Milk', category: 'DAIRY', quantity: 1, unit: 'gal', estimatedPrice: 4.29, isPurchased: false, createdAt: new Date() },
  { id: 'item-2', name: 'Avocados (Bag of 5)', category: 'PRODUCE', quantity: 1, unit: 'bag', estimatedPrice: 3.99, isPurchased: false, createdAt: new Date() },
  { id: 'item-3', name: 'Chicken Breast Family Pack', category: 'MEAT', quantity: 1, unit: 'pack', estimatedPrice: 11.49, isPurchased: true, createdAt: new Date() },
];

export async function GET() {
  const user = await getCurrentUser();
  const householdId = user?.householdId || 'demo-household-id-1';

  try {
    let list = await prisma.groceryList.findFirst({
      where: { householdId, isDefault: true },
      include: {
        items: {
          include: {
            addedBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!list) {
      list = await prisma.groceryList.create({
        data: {
          householdId,
          title: 'Main Grocery List',
          isDefault: true,
        },
        include: {
          items: {
            include: {
              addedBy: { select: { id: true, name: true, email: true } },
              assignedTo: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    return NextResponse.json({ list });
  } catch (err) {
    console.warn('Database query failed in GET /api/grocery, returning fallback memory list:', err);
    return NextResponse.json({
      list: {
        id: 'demo-list-1',
        title: 'Main Grocery List',
        items: memoryItemsStore,
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const householdId = user?.householdId || 'demo-household-id-1';
    const userId = user?.id || 'demo-user-id-1';

    const body = await req.json().catch(() => ({}));
    const { name, category, quantity, unit, estimatedPrice, assignedToId, notes } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const cleanName = String(name).trim();
    const itemCategory = category && category !== 'AUTO' ? category : categorizeItem(cleanName);
    const itemQty = Number(quantity) || 1;
    const itemPrice = Number(estimatedPrice) || 0;
    const itemUnit = unit ? String(unit).trim() : 'pcs';

    try {
      let defaultList = await prisma.groceryList.findFirst({
        where: { householdId, isDefault: true },
      });

      if (!defaultList) {
        defaultList = await prisma.groceryList.create({
          data: {
            householdId,
            title: 'Main Grocery List',
            isDefault: true,
          },
        });
      }

      const item = await prisma.groceryItem.create({
        data: {
          listId: defaultList.id,
          name: cleanName,
          category: itemCategory,
          quantity: itemQty,
          unit: itemUnit,
          estimatedPrice: itemPrice,
          addedById: userId,
          assignedToId: assignedToId || null,
          notes: notes ? String(notes).trim() : null,
        },
        include: {
          addedBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ item });
    } catch (dbErr) {
      console.warn('Database write failed in POST /api/grocery, using memory fallback item:', dbErr);
      const newItem = {
        id: `item-${Date.now()}`,
        name: cleanName,
        category: itemCategory,
        quantity: itemQty,
        unit: itemUnit,
        estimatedPrice: itemPrice,
        isPurchased: false,
        notes: notes ? String(notes).trim() : null,
        createdAt: new Date(),
        addedBy: { id: userId, name: user?.name || 'Alex Morgan', email: user?.email || 'alex@lifecart.com' },
      };
      memoryItemsStore.unshift(newItem);
      return NextResponse.json({ item: newItem });
    }
  } catch (error: any) {
    console.error('Create grocery item error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create grocery item' }, { status: 500 });
  }
}
