import { prisma } from './db';
import { getHouseholdWarrantyStatuses } from './warranties';

export async function runHouseholdAutomations(householdId: string) {
  let config = await prisma.automationConfig.findUnique({
    where: { householdId },
  });

  if (!config) {
    config = await prisma.automationConfig.create({
      data: { householdId },
    });
  }

  const generatedAlerts: string[] = [];

  // 1. Warranty Expiring Automations (within 30 days)
  if (config.warrantyAlerts) {
    const warranties = await getHouseholdWarrantyStatuses(householdId);
    const expiringSoon = warranties.filter((w) => w.status === 'EXPIRING_SOON');

    for (const item of expiringSoon) {
      const existing = await prisma.notification.findFirst({
        where: { householdId, title: 'Warranty Expiring Soon', message: { contains: item.name } },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            householdId,
            title: 'Warranty Expiring Soon',
            message: `Your ${item.name} warranty expires in ${item.daysRemaining} days.`,
            type: 'REMINDER',
            link: '/mystuff',
          },
        });
        generatedAlerts.push(`Warranty alert created for ${item.name}`);
      }
    }
  }

  // 2. Low Inventory Auto-Suggest Automations
  if (config.lowStockAutoSuggest) {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: { householdId, status: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
    });

    const defaultList = await prisma.groceryList.findFirst({
      where: { householdId, isDefault: true },
    });

    if (defaultList && lowStockItems.length > 0) {
      for (const invItem of lowStockItems) {
        const existsInList = await prisma.groceryItem.findFirst({
          where: { listId: defaultList.id, name: { equals: invItem.name }, isPurchased: false },
        });

        if (!existsInList) {
          const user = await prisma.user.findFirst({ where: { householdId } });
          if (user) {
            await prisma.groceryItem.create({
              data: {
                listId: defaultList.id,
                name: invItem.name,
                category: invItem.category === 'FRIDGE' ? 'DAIRY' : 'GROCERY',
                quantity: invItem.minThreshold,
                unit: invItem.unit,
                addedById: user.id,
                notes: 'Auto-added by Smart Automation (Low Pantry Stock)',
              },
            });
            generatedAlerts.push(`Auto-added ${invItem.name} to Grocery List`);
          }
        }
      }
    }
  }

  return { success: true, alertsCount: generatedAlerts.length, generatedAlerts };
}
