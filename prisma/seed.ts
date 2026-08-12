import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clean LifeCart environment with 5 Household Members (Harman, Raj, Simar, Asis, Arman)...');

  // 1. Clean transactional data
  await prisma.notification.deleteMany();
  await prisma.purchaseRecord.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.groceryItem.deleteMany();
  await prisma.groceryList.deleteMany();
  await prisma.inventoryItem.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create or find Admin User (Harman)
  const harman = await prisma.user.upsert({
    where: { email: 'harman@lifecart.com' },
    update: { name: 'Harman', role: 'SYSTEM_ADMIN' },
    create: {
      name: 'Harman',
      email: 'harman@lifecart.com',
      passwordHash,
      role: 'SYSTEM_ADMIN',
    },
  });

  // 3. Create or find Household
  let household = await prisma.household.findFirst({
    where: { inviteCode: 'CART-892X' },
  });

  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'LifeCart Shared House',
        inviteCode: 'CART-892X',
        currency: 'EUR',
        createdById: harman.id,
      },
    });
  }

  await prisma.user.update({
    where: { id: harman.id },
    data: { householdId: household.id },
  });

  await prisma.householdMember.upsert({
    where: { userId_householdId: { userId: harman.id, householdId: household.id } },
    update: { role: 'ADMIN' },
    create: {
      userId: harman.id,
      householdId: household.id,
      role: 'ADMIN',
    },
  });

  // 4. Create remaining 4 members (Raj, Simar, Asis, Arman)
  const remainingMembers = [
    { name: 'Raj', email: 'raj@lifecart.com' },
    { name: 'Simar', email: 'simar@lifecart.com' },
    { name: 'Asis', email: 'asis@lifecart.com' },
    { name: 'Arman', email: 'arman@lifecart.com' },
  ];

  for (const m of remainingMembers) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, householdId: household.id },
      create: {
        name: m.name,
        email: m.email,
        passwordHash,
        role: 'USER',
        householdId: household.id,
      },
    });

    await prisma.householdMember.upsert({
      where: { userId_householdId: { userId: u.id, householdId: household.id } },
      update: { role: 'MEMBER' },
      create: {
        userId: u.id,
        householdId: household.id,
        role: 'MEMBER',
      },
    });
  }

  // 5. Create empty default Grocery List
  const existingList = await prisma.groceryList.findFirst({
    where: { householdId: household.id, isDefault: true },
  });

  if (!existingList) {
    await prisma.groceryList.create({
      data: {
        householdId: household.id,
        title: 'Main Grocery List',
        isDefault: true,
      },
    });
  }

  console.log('Clean database seeded successfully with 5 members: Harman, Raj, Simar, Asis, Arman!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
