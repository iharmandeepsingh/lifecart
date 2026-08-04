import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { categorizeItem } from '@/lib/ocr';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  // Find or create default list for household
  let list = await prisma.groceryList.findFirst({
    where: { householdId: user.householdId, isDefault: true },
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
        householdId: user.householdId,
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
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { name, category, quantity, unit, estimatedPrice, assignedToId, notes } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
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

    const itemCategory = category && category !== 'AUTO' ? category : categorizeItem(name.trim());

    const item = await prisma.groceryItem.create({
      data: {
        listId: defaultList.id,
        name: name.trim(),
        category: itemCategory,
        quantity: Number(quantity) || 1,
        unit: unit?.trim() || 'pcs',
        estimatedPrice: Number(estimatedPrice) || 0,
        addedById: user.id,
        assignedToId: assignedToId || null,
        notes: notes?.trim() || null,
      },
      include: {
        addedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Create grocery item error:', error);
    return NextResponse.json({ error: 'Failed to create grocery item' }, { status: 500 });
  }
}
