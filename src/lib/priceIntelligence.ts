import { prisma } from './db';

export interface PriceComparisonItem {
  productId: string;
  productName: string;
  category: string;
  stores: {
    storeId: string;
    storeName: string;
    logoUrl?: string | null;
    currentPrice: number;
    unitPrice: number;
    unit: string;
    isCheapest: boolean;
  }[];
  lowestRecordedPrice: number;
  averageRecordedPrice: number;
  highestRecordedPrice: number;
  dealBadge?: string | null; // GREAT_DEAL, HISTORIC_LOW, FAIR_PRICE
  dealSavingsPercentage?: number;
}

export async function getPriceComparisonForProduct(productId: string): Promise<PriceComparisonItem | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      storeProducts: {
        include: {
          store: true,
          priceHistory: { orderBy: { recordedAt: 'desc' } },
        },
      },
    },
  });

  if (!product || product.storeProducts.length === 0) return null;

  let lowest = Infinity;
  let highest = 0;
  let totalPriceSum = 0;
  let count = 0;

  const stores = product.storeProducts.map((sp) => {
    if (sp.currentPrice < lowest) lowest = sp.currentPrice;
    if (sp.currentPrice > highest) highest = sp.currentPrice;

    sp.priceHistory.forEach((ph) => {
      totalPriceSum += ph.price;
      count++;
    });

    return {
      storeId: sp.store.id,
      storeName: sp.store.name,
      logoUrl: sp.store.logoUrl,
      currentPrice: sp.currentPrice,
      unitPrice: sp.unitPrice,
      unit: sp.unit,
      isCheapest: false,
    };
  });

  // Mark cheapest store
  stores.forEach((s) => {
    if (s.currentPrice === lowest) s.isCheapest = true;
  });

  const avgPrice = count > 0 ? totalPriceSum / count : lowest;
  let dealBadge: string | null = null;
  let dealSavingsPercentage = 0;

  if (lowest < avgPrice * 0.85) {
    dealBadge = '🔥 Great Deal!';
    dealSavingsPercentage = Math.round(((avgPrice - lowest) / avgPrice) * 100);
  } else if (lowest < avgPrice * 0.70) {
    dealBadge = '⚡ Historic Low!';
    dealSavingsPercentage = Math.round(((avgPrice - lowest) / avgPrice) * 100);
  }

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    stores,
    lowestRecordedPrice: lowest === Infinity ? 0 : lowest,
    averageRecordedPrice: parseFloat(avgPrice.toFixed(2)),
    highestRecordedPrice: highest,
    dealBadge,
    dealSavingsPercentage,
  };
}
