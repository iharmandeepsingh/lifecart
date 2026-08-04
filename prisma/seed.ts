import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LifeCart Phase 3 & 4 Unified Data...');

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

  // 2. Create Users & Household
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Morgan',
      email: 'alex@lifecart.com',
      passwordHash,
    },
  });

  const sam = await prisma.user.create({
    data: {
      name: 'Sam Miller',
      email: 'sam@lifecart.com',
      passwordHash,
    },
  });

  const household = await prisma.household.create({
    data: {
      name: 'Maple Street House',
      inviteCode: 'CART-892X',
      createdById: alex.id,
    },
  });

  await prisma.user.update({ where: { id: alex.id }, data: { householdId: household.id } });
  await prisma.user.update({ where: { id: sam.id }, data: { householdId: household.id } });

  await prisma.householdMember.create({ data: { userId: alex.id, householdId: household.id, role: 'ADMIN' } });
  await prisma.householdMember.create({ data: { userId: sam.id, householdId: household.id, role: 'MEMBER' } });

  // 3. Create Stores & Master Normalized Products
  const walmart = await prisma.store.create({ data: { name: 'Walmart Supercenter', rating: 4.6 } });
  const traderJoes = await prisma.store.create({ data: { name: "Trader Joe's", rating: 4.8 } });
  const costco = await prisma.store.create({ data: { name: 'Costco Wholesale', rating: 4.7 } });
  const target = await prisma.store.create({ data: { name: 'Target', rating: 4.5 } });

  const milkProduct = await prisma.product.create({
    data: {
      name: 'Organic Whole Milk',
      normalizedName: 'organic whole milk 1.5l',
      brand: 'Horizon Organic',
      category: 'DAIRY',
    },
  });

  const pizzaProduct = await prisma.product.create({
    data: {
      name: 'Frozen Margherita Pizza',
      normalizedName: 'frozen margherita pizza',
      brand: 'DiGiorno',
      category: 'FREEZER',
    },
  });

  // Create Store Listings
  const sp1 = await prisma.storeProduct.create({
    data: {
      productId: milkProduct.id,
      storeId: walmart.id,
      currentPrice: 4.29,
      unitPrice: 4.29,
      unit: 'gallon',
    },
  });

  const sp2 = await prisma.storeProduct.create({
    data: {
      productId: milkProduct.id,
      storeId: traderJoes.id,
      currentPrice: 4.69,
      unitPrice: 4.69,
      unit: 'gallon',
    },
  });

  await prisma.priceHistory.createMany({
    data: [
      { storeProductId: sp1.id, price: 4.29, recordedAt: new Date() },
      { storeProductId: sp1.id, price: 4.59, recordedAt: new Date(Date.now() - 7 * 86400000) },
      { storeProductId: sp2.id, price: 4.69, recordedAt: new Date() },
    ],
  });

  // 4. Create Grocery List & Items
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
        name: 'Organic Whole Milk',
        category: 'DAIRY',
        quantity: 2,
        unit: 'carton',
        estimatedPrice: 4.29,
        addedById: alex.id,
      },
      {
        listId: groceryList.id,
        name: 'Frozen Margherita Pizza',
        category: 'FREEZER',
        quantity: 1,
        unit: 'box',
        estimatedPrice: 5.49,
        addedById: sam.id,
      },
    ],
  });

  // 5. Create Inventory & Owned Products
  await prisma.inventoryItem.createMany({
    data: [
      {
        householdId: household.id,
        name: 'Extra Virgin Olive Oil',
        category: 'PANTRY',
        quantity: 2,
        unit: 'bottle',
        minThreshold: 1,
        location: 'PANTRY',
        status: 'IN_STOCK',
      },
      {
        householdId: household.id,
        name: 'Greek Yogurt Vanilla',
        category: 'FRIDGE',
        quantity: 1,
        unit: 'tub',
        minThreshold: 2,
        location: 'FRIDGE',
        status: 'LOW_STOCK',
      },
    ],
  });

  await prisma.ownedProduct.create({
    data: {
      userId: alex.id,
      householdId: household.id,
      name: 'MacBook Air M3 (15-inch, 16GB RAM)',
      category: 'ELECTRONICS',
      purchasePrice: 1199,
      storeName: 'Apple Store',
      purchaseDate: new Date(),
    },
  });

  console.log('Phase 3 & 4 seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
