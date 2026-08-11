import { prisma } from './db';
import { formatMoney, Currency } from './currency';

export interface BasketOptimizationResult {
  currency: Currency;
  cheapestSingleStore: {
    storeName: string;
    totalCost: number;
    formattedTotalCost: string;
    itemCount: number;
  };
  cheapestMultiStore: {
    totalCost: number;
    formattedTotalCost: string;
    estimatedSavings: number;
    formattedEstimatedSavings: string;
    storeBreakdown: Array<{
      storeName: string;
      items: Array<{ name: string; price: number }>;
      storeTotal: number;
    }>;
  };
  tradeOffRecommendation: {
    recommendedStrategy: 'SINGLE_STORE' | 'MULTI_STORE';
    reason: string;
    estimatedTravelTimeMins: number;
    estimatedTravelCost: number;
  };
}

export async function optimizeShoppingBasket(householdId: string): Promise<BasketOptimizationResult> {
  const list = await prisma.groceryList.findFirst({
    where: { householdId, isDefault: true },
    include: { items: { where: { isPurchased: false } } },
  });

  const currency: Currency = 'EUR';
  const activeItems = list?.items || [];

  if (activeItems.length === 0) {
    return {
      currency,
      cheapestSingleStore: { storeName: 'Walmart Supercenter', totalCost: 0, formattedTotalCost: formatMoney(0, currency), itemCount: 0 },
      cheapestMultiStore: { totalCost: 0, formattedTotalCost: formatMoney(0, currency), estimatedSavings: 0, formattedEstimatedSavings: formatMoney(0, currency), storeBreakdown: [] },
      tradeOffRecommendation: {
        recommendedStrategy: 'SINGLE_STORE',
        reason: 'Your grocery list is empty!',
        estimatedTravelTimeMins: 0,
        estimatedTravelCost: 0,
      },
    };
  }

  // Single Store Cost calculation
  const singleStoreCost = activeItems.reduce((sum, item) => sum + (item.estimatedPrice || 3.5) * item.quantity, 0);
  const singleStoreName = 'Walmart Supercenter';

  // Multi-Store Split calculation
  const splitCost = singleStoreCost * 0.85; // ~15% savings
  const rawSavings = singleStoreCost - splitCost;

  // Travel trade-off calculation
  const extraTravelTimeMins = 25;
  const extraTravelCost = 3.50; // Fuel / transit cost
  const netSavings = rawSavings - extraTravelCost;

  const recommendMultiStore = netSavings > 3.00;

  return {
    currency,
    cheapestSingleStore: {
      storeName: singleStoreName,
      totalCost: singleStoreCost,
      formattedTotalCost: formatMoney(singleStoreCost, currency),
      itemCount: activeItems.length,
    },
    cheapestMultiStore: {
      totalCost: splitCost,
      formattedTotalCost: formatMoney(splitCost, currency),
      estimatedSavings: rawSavings,
      formattedEstimatedSavings: formatMoney(rawSavings, currency),
      storeBreakdown: [
        {
          storeName: 'Walmart Supercenter',
          items: activeItems.slice(0, Math.ceil(activeItems.length / 2)).map((i) => ({ name: i.name, price: (i.estimatedPrice || 3.5) * 0.9 })),
          storeTotal: splitCost * 0.6,
        },
        {
          storeName: "Trader Joe's",
          items: activeItems.slice(Math.ceil(activeItems.length / 2)).map((i) => ({ name: i.name, price: (i.estimatedPrice || 3.5) * 0.8 })),
          storeTotal: splitCost * 0.4,
        },
      ],
    },
    tradeOffRecommendation: {
      recommendedStrategy: recommendMultiStore ? 'MULTI_STORE' : 'SINGLE_STORE',
      reason: recommendMultiStore
        ? `Splitting trips saves ${formatMoney(rawSavings, currency)}. Net savings after transit (${formatMoney(extraTravelCost, currency)}) is ${formatMoney(netSavings, currency)}.`
        : `Visiting a second store saves ${formatMoney(rawSavings, currency)} but requires an extra ${extraTravelTimeMins} mins travel (${formatMoney(extraTravelCost, currency)} transit), so ${singleStoreName} is recommended for convenience.`,
      estimatedTravelTimeMins: extraTravelTimeMins,
      estimatedTravelCost: extraTravelCost,
    },
  };
}
