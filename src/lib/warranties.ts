import { prisma } from './db';

export interface WarrantyStatusItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: Date;
  purchasePrice: number;
  warrantyExpiryDate: Date | null;
  daysRemaining: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export async function getHouseholdWarrantyStatuses(householdId: string): Promise<WarrantyStatusItem[]> {
  const owned = await prisma.ownedProduct.findMany({
    where: { householdId },
    orderBy: { warrantyExpiryDate: 'asc' },
  });

  const now = new Date();

  return owned.map((item) => {
    let daysRemaining = 365;
    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';

    if (item.warrantyExpiryDate) {
      const diffMs = new Date(item.warrantyExpiryDate).getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        status = 'EXPIRED';
      } else if (daysRemaining <= 30) {
        status = 'EXPIRING_SOON';
      } else {
        status = 'ACTIVE';
      }
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      purchaseDate: item.purchaseDate,
      purchasePrice: item.purchasePrice,
      warrantyExpiryDate: item.warrantyExpiryDate,
      daysRemaining,
      status,
    };
  });
}
