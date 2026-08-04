import { prisma } from './db';

export interface SearchResultItem {
  id: string;
  type: 'GROCERY' | 'INVENTORY' | 'RECEIPT' | 'EXPENSE' | 'PURCHASE';
  title: string;
  subtitle: string;
  badge: string;
  link: string;
}

export async function performGlobalSearch(householdId: string, query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  try {
    // 1. Search Grocery List Items
    const groceryList = await prisma.groceryList.findFirst({
      where: { householdId, isDefault: true },
      include: {
        items: {
          where: { name: { contains: cleanQuery } },
        },
      },
    });

    if (groceryList?.items) {
      groceryList.items.forEach((item) => {
        results.push({
          id: `grocery-${item.id}`,
          type: 'GROCERY',
          title: item.name,
          subtitle: `Quantity: ${item.quantity} ${item.unit} • ${item.isPurchased ? 'Purchased' : 'Pending'}`,
          badge: 'Shopping List',
          link: '/grocery',
        });
      });
    }

    // 2. Search Pantry Inventory
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        householdId,
        name: { contains: cleanQuery },
      },
    });

    inventoryItems.forEach((item) => {
      results.push({
        id: `inventory-${item.id}`,
        type: 'INVENTORY',
        title: item.name,
        subtitle: `Stock: ${item.quantity} ${item.unit} (${item.location})`,
        badge: 'Pantry Inventory',
        link: '/inventory',
      });
    });

    // 3. Search Receipts
    const receipts = await prisma.receipt.findMany({
      where: {
        householdId,
        OR: [
          { storeName: { contains: cleanQuery } },
          { items: { some: { name: { contains: cleanQuery } } } },
        ],
      },
      include: { items: true },
    });

    receipts.forEach((receipt) => {
      results.push({
        id: `receipt-${receipt.id}`,
        type: 'RECEIPT',
        title: `${receipt.storeName} Receipt`,
        subtitle: `Total: $${receipt.totalAmount.toFixed(2)} • ${new Date(receipt.receiptDate).toLocaleDateString()}`,
        badge: 'Receipt',
        link: '/receipt',
      });
    });

    // 4. Search Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        householdId,
        title: { contains: cleanQuery },
      },
    });

    expenses.forEach((expense) => {
      results.push({
        id: `expense-${expense.id}`,
        type: 'EXPENSE',
        title: expense.title,
        subtitle: `Amount: $${expense.amount.toFixed(2)} • ${expense.category}`,
        badge: 'Expense',
        link: '/expenses',
      });
    });

    // 5. Search Purchase History
    const purchases = await prisma.purchaseRecord.findMany({
      where: {
        householdId,
        productName: { contains: cleanQuery },
      },
    });

    purchases.forEach((purchase) => {
      results.push({
        id: `purchase-${purchase.id}`,
        type: 'PURCHASE',
        title: purchase.productName,
        subtitle: `Store: ${purchase.storeName} • $${purchase.totalPrice.toFixed(2)}`,
        badge: 'Purchase History',
        link: '/history',
      });
    });

    return results;
  } catch (error) {
    console.error('Error performing global search:', error);
    return [];
  }
}
