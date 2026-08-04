import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CART-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household found' }, { status: 404 });
  }

  const household = await prisma.household.findUnique({
    where: { id: user.householdId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      lists: true,
    },
  });

  return NextResponse.json({ household });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 });
    }

    const inviteCode = generateInviteCode();

    // Create household, default grocery list, and add user as ADMIN member
    const household = await prisma.household.create({
      data: {
        name: name.trim(),
        inviteCode,
        createdById: user.id,
        users: {
          connect: { id: user.id },
        },
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
        lists: {
          create: {
            title: `${name.trim()}'s Grocery List`,
            isDefault: true,
          },
        },
      },
      include: {
        members: true,
        lists: true,
      },
    });

    // Update user's primary householdId
    await prisma.user.update({
      where: { id: user.id },
      data: { householdId: household.id },
    });

    return NextResponse.json({ message: 'Household created successfully', household });
  } catch (error) {
    console.error('Create household error:', error);
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  }
}
