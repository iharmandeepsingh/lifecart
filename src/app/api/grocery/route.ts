import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { categorizeItem } from '@/lib/ocr';
import { 
  getMemoryGroceryItems, 
  addMemoryGroceryItem, 
  syncPullFromCloud 
} from '@/lib/cloudStore';

const EMAIL_MAP: Record<string, string> = {
  'user-harman': 'harman@lifecart.com',
  'user-raj': 'raj@lifecart.com',
  'user-simar': 'simar@lifecart.com',
  'user-asis': 'asis@lifecart.com',
  'user-arman': 'arman@lifecart.com',
};

async function resolveDbUserId(inputUserId: string, fallbackEmail = 'harman@lifecart.com'): Promise<string> {
  try {
    const byId = await prisma.user.findUnique({ where: { id: inputUserId } });
    if (byId) return byId.id;

    const targetEmail = EMAIL_MAP[inputUserId] || fallbackEmail;
    const byEmail = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (byEmail) return byEmail.id;

    const firstUser = await prisma.user.findFirst();
    if (firstUser) return firstUser.id;
  } catch (e) {
    console.warn('resolveDbUserId warning in grocery API:', e);
  }
  return inputUserId;
}

export async function GET() {
  const user = await getCurrentUser();
  const householdId = user?.householdId || 'demo-household-id-1';

  // Sync latest cloud items across devices
  const { groceryItems: cloudGroceryItems } = await syncPullFromCloud();

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

    // Merge real-time cloud items
    if (cloudGroceryItems.length > 0) {
      const existingIds = new Set(list.items.map((i) => i.id));
      cloudGroceryItems.forEach((cloudItem) => {
        if (!existingIds.has(cloudItem.id)) {
          list!.items.unshift(cloudItem);
        }
      });
    }

    return NextResponse.json({ list, isFallback: false });
  } catch (err) {
    console.warn('Database query failed in GET /api/grocery, returning cloud store list:', err);
    return NextResponse.json({
      isFallback: true,
      list: {
        id: 'demo-list-1',
        title: 'Main Grocery List',
        items: cloudGroceryItems.length > 0 ? cloudGroceryItems : getMemoryGroceryItems(),
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const householdId = user?.householdId || 'demo-household-id-1';
    const rawUserId = user?.id || 'user-harman';

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
      addedBy: { id: rawUserId, name: user?.name || 'Harman', email: user?.email || 'harman@lifecart.com' },
    };

    addMemoryGroceryItem(newItem);

    try {
      const realAddedById = await resolveDbUserId(rawUserId, 'harman@lifecart.com');
      const realAssignedToId = assignedToId ? await resolveDbUserId(assignedToId, EMAIL_MAP[assignedToId] || 'harman@lifecart.com') : null;

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
          addedById: realAddedById,
          assignedToId: realAssignedToId,
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
      return NextResponse.json({ item: newItem, isFallback: true });
    }
  } catch (error: any) {
    console.error('Create grocery item error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create grocery item' }, { status: 500 });
  }
}
