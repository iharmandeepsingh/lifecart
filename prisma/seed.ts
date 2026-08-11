import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LifeCart 5 Household Members (Harman, Raj, Simar, Asis, Arman)...');

  // 1. Clean existing data
  await prisma.ownedProduct.deleteMany();
  await prisma.savedProduct.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.storeProduct.deleteMany();
  await prisma.store.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.purchaseRecord.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.groceryItem.deleteMany();
  await prisma.groceryList.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Admin User (Harman)
  const harman = await prisma.user.create({
    data: {
      name: 'Harman',
      email: 'harman@lifecart.com',
      passwordHash,
      role: 'SYSTEM_ADMIN',
    },
  });

  // 3. Create Household
  const household = await prisma.household.create({
    data: {
      name: 'LifeCart Shared House',
      inviteCode: 'CART-892X',
      currency: 'EUR',
      createdById: harman.id,
    },
  });

  await prisma.user.update({
    where: { id: harman.id },
    data: { householdId: household.id },
  });

  await prisma.householdMember.create({
    data: {
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

  const allUsers = [harman];
  for (const m of remainingMembers) {
    const u = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        passwordHash,
        role: 'USER',
        householdId: household.id,
      },
    });

    await prisma.householdMember.create({
      data: {
        userId: u.id,
        householdId: household.id,
        role: 'MEMBER',
      },
    });

    allUsers.push(u);
  }

  // 5. Create Grocery List & Items
  const groceryList = await prisma.groceryList.create({
    data: {
      householdId: household.id,
      title: 'Main Grocery List',
      isDefault: true,
    },
  });

  await prisma.groceryItem.createMany({
    data: [
      {
        listId: groceryList.id,
        name: 'Organic Whole Milk 1.5L',
        category: 'DAIRY',
        quantity: 2,
        unit: 'carton',
        estimatedPrice: 4.29,
        addedById: harman.id,
        assignedToId: allUsers[1].id, // Raj
      },
      {
        listId: groceryList.id,
        name: 'Fresh Avocados (Bag of 5)',
        category: 'PRODUCE',
        quantity: 1,
        unit: 'bag',
        estimatedPrice: 3.99,
        addedById: allUsers[2].id, // Simar
        assignedToId: allUsers[3].id, // Asis
      },
      {
        listId: groceryList.id,
        name: 'Chicken Breast Family Pack (3 lbs)',
        category: 'MEAT',
        quantity: 1,
        unit: 'pack',
        estimatedPrice: 11.49,
        isPurchased: true,
        addedById: allUsers[4].id, // Arman
        assignedToId: harman.id,
      },
    ],
  });

  // 6. Create Sample Expenses & Splits for Harman, Raj, Simar, Asis, Arman
  const groceryExpense = await prisma.expense.create({
    data: {
      householdId: household.id,
      paidById: harman.id, // Harman paid
      title: 'Weekly Supermarket Grocery Run',
      amount: 100.00,
      category: 'GROCERY',
      date: new Date(),
    },
  });

  // Harman paid $100 -> each of 5 members owes $20. Harman is settled, remaining 4 owe $20
  for (const user of allUsers) {
    await prisma.expenseSplit.create({
      data: {
        expenseId: groceryExpense.id,
        userId: user.id,
        amount: 20.00,
        isSettled: user.id === harman.id,
        settledAt: user.id === harman.id ? new Date() : null,
      },
    });
  }

  console.log('Successfully seeded 5 members: Harman, Raj, Simar, Asis, Arman!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
