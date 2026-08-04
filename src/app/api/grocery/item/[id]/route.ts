import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.groceryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const updated = await prisma.groceryItem.update({
      where: { id },
      data: {
        ...(body.isPurchased !== undefined ? { 
          isPurchased: Boolean(body.isPurchased),
          purchasedAt: body.isPurchased ? new Date() : null,
        } : {}),
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.category ? { category: body.category } : {}),
        ...(body.quantity !== undefined ? { quantity: Number(body.quantity) } : {}),
        ...(body.unit ? { unit: body.unit } : {}),
        ...(body.estimatedPrice !== undefined ? { estimatedPrice: Number(body.estimatedPrice) } : {}),
        ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
      include: {
        addedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Update grocery item error:', error);
    return NextResponse.json({ error: 'Failed to update grocery item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await prisma.groceryItem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete grocery item error:', error);
    return NextResponse.json({ error: 'Failed to delete grocery item' }, { status: 500 });
  }
}
