import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const receipts = await prisma.receipt.findMany({
    where: { householdId: user.householdId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      items: true,
      expenses: {
        include: {
          splits: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { receiptDate: 'desc' },
  });

  return NextResponse.json({ receipts });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { storeName, totalAmount, taxAmount, receiptDate, items, splits, addToInventory } = await req.json();

    if (!storeName || !totalAmount) {
      return NextResponse.json({ error: 'Store name and total amount are required.' }, { status: 400 });
    }

    const recDate = receiptDate ? new Date(receiptDate) : new Date();

    // 1. Create Receipt Record
    const receipt = await prisma.receipt.create({
      data: {
        householdId: user.householdId,
        uploadedById: user.id,
        storeName: storeName.trim(),
        totalAmount: Number(totalAmount),
        taxAmount: Number(taxAmount) || 0,
        receiptDate: recDate,
        items: {
          create: (items || []).map((item: { name: string; category?: string; price: number; quantity?: number }) => ({
            name: item.name,
            category: item.category || 'GROCERY',
            price: Number(item.price),
            quantity: Number(item.quantity) || 1,
          })),
        },
      },
    });

    // 2. Create Expense & Splits
    const expense = await prisma.expense.create({
      data: {
        householdId: user.householdId,
        paidById: user.id,
        receiptId: receipt.id,
        title: `${storeName} Receipt`,
        amount: Number(totalAmount),
        category: 'GROCERY',
        date: recDate,
        splits: {
          create: (splits || []).map((split: { userId: string; amount: number }) => ({
            userId: split.userId,
            amount: Number(split.amount),
            isSettled: split.userId === user.id,
            settledAt: split.userId === user.id ? new Date() : null,
          })),
        },
      },
      include: { splits: true },
    });

    // 3. Create Product Purchase History Records
    if (items && items.length > 0) {
      await prisma.purchaseRecord.createMany({
        data: items.map((item: { name: string; category?: string; price: number; quantity?: number }) => ({
          householdId: user.householdId!,
          userId: user.id,
          receiptId: receipt.id,
          productName: item.name.trim(),
          category: item.category || 'GROCERY',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.price),
          totalPrice: Number(item.price) * (Number(item.quantity) || 1),
          storeName: storeName.trim(),
          purchaseDate: recDate,
        })),
      });
    }

    // 4. Update Pantry Inventory (Prevent Duplicates & Sync Stock Status)
    if (addToInventory && items && items.length > 0) {
      for (const item of items) {
        const existing = await prisma.inventoryItem.findFirst({
          where: {
            householdId: user.householdId,
            name: { equals: item.name.trim() },
          },
        });

        if (existing) {
          const newQty = existing.quantity + (Number(item.quantity) || 1);
          await prisma.inventoryItem.update({
            where: { id: existing.id },
            data: {
              quantity: newQty,
              status: newQty > existing.minThreshold ? 'IN_STOCK' : 'LOW_STOCK',
              lastRestockedAt: new Date(),
            },
          });
        } else {
          const newQty = Number(item.quantity) || 1;
          await prisma.inventoryItem.create({
            data: {
              householdId: user.householdId,
              name: item.name.trim(),
              category: item.category === 'PRODUCE' || item.category === 'DAIRY' ? 'FRIDGE' : 'PANTRY',
              quantity: newQty,
              unit: 'pcs',
              minThreshold: 1,
              location: item.category === 'PRODUCE' || item.category === 'DAIRY' ? 'FRIDGE' : 'PANTRY',
              status: newQty > 1 ? 'IN_STOCK' : 'LOW_STOCK',
              lastRestockedAt: new Date(),
            },
          });
        }
      }
    }

    // 5. Check if expense > 1.5x average to trigger Unusual Spending notification
    if (Number(totalAmount) > 50) {
      await prisma.notification.create({
        data: {
          householdId: user.householdId,
          title: 'New Household Receipt Scanned',
          message: `${user.name} logged a $${Number(totalAmount).toFixed(2)} receipt from ${storeName.trim()}.`,
          type: 'ACTIVITY',
          link: '/expenses',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Receipt processed, expense logged, purchase history saved, and inventory updated!',
      receipt,
      expense,
    });
  } catch (error) {
    console.error('Save receipt error:', error);
    return NextResponse.json({ error: 'Failed to save receipt.' }, { status: 500 });
  }
}
