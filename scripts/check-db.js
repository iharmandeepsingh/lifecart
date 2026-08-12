import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('====================================================');
  console.log('🔍 LifeCart Database Content Inspector');
  console.log('====================================================');

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
    console.log(`\n👥 USERS IN DATABASE (${users.length}):`);
    console.table(users);

    const members = await prisma.householdMember.findMany({
      include: { user: { select: { name: true, email: true } } },
    });
    console.log(`\n🏡 HOUSEHOLD MEMBERS (${members.length}):`);
    members.forEach((m) => console.log(` - ${m.user.name} (${m.user.email}) | Role: ${m.role}`));

    const groceryItems = await prisma.groceryItem.findMany({
      include: { addedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`\n🛒 GROCERY ITEMS IN DATABASE (${groceryItems.length}):`);
    if (groceryItems.length === 0) {
      console.log(' (No grocery items in DB currently)');
    } else {
      groceryItems.forEach((item) =>
        console.log(` - [${item.category}] ${item.name} x${item.quantity} ${item.unit} ($${item.estimatedPrice}) | Added by ${item.addedBy?.name || 'User'}`)
      );
    }

    const expenses = await prisma.expense.findMany({
      include: { paidBy: { select: { name: true } }, splits: true },
      orderBy: { date: 'desc' },
    });
    console.log(`\n💰 EXPENSES IN DATABASE (${expenses.length}):`);
    if (expenses.length === 0) {
      console.log(' (No expenses in DB currently)');
    } else {
      expenses.forEach((exp) =>
        console.log(` - ${exp.title}: $${exp.amount.toFixed(2)} | Category: ${exp.category} | Paid by ${exp.paidBy?.name} | Splits: ${exp.splits.length} members`)
      );
    }

    const inventory = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    console.log(`\n📦 INVENTORY ITEMS IN DATABASE (${inventory.length}):`);
    if (inventory.length === 0) {
      console.log(' (No inventory items in DB currently)');
    } else {
      inventory.forEach((inv) =>
        console.log(` - ${inv.name} (${inv.quantity} ${inv.unit}) | Status: ${inv.status} | Location: ${inv.location}`)
      );
    }

    console.log('\n====================================================');
  } catch (err) {
    console.error('Error inspecting database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
