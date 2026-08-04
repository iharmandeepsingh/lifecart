import { prisma } from './db';
import { normalizeProductName } from './normalization';

export interface BasketOptimizationResult {
  totalItemsCount: number;
  cheapestSingleStore: {
    storeName: string;
    totalCost: number;
    missingItemsCount: number;
  };
  cheapestMultiStore: {
    totalCost: number;
    estimatedSavings: number;
    storeBreakdown: {
      storeName: string;
      itemCount: number;
      subtotal: number;
      items: { name: string; price: number }[];
    }[];
  };
}

export async function optimizeShoppingBasket(householdId: string): Promise<BasketOptimizationResult> {
  const defaultList = await prisma.groceryList.findFirst({
    where: { householdId, isDefault: true },
    include: {
      items: { where: { isPurchased: false } },
    },
  });

  if (!defaultList || defaultList.items.length === 0) {
    return {
      totalItemsCount: 0,
      cheapestSingleStore: { storeName: 'None', totalCost: 0, missingItemsCount: 0 },
      cheapestMultiStore: { totalCost: 0, estimatedSavings: 0, storeBreakdown: [] },
    };
  }

  const listItems = defaultList.items;
  const allStores = await prisma.store.findMany({
    include: {
      storeProducts: {
        include: { product: true },
      },
    },
  });

  // Calculate single store totals
  const singleStoreTotals: Record<string, { storeName: string; totalCost: number; missing: number }> = {};

  allStores.forEach((store) => {
    let cost = 0;
    let missing = 0;

    listItems.forEach((item) => {
      const normItem = normalizeProductName(item.name);
      const match = store.storeProducts.find((sp) =>
        sp.product.normalizedName.includes(normItem) || normItem.includes(sp.product.normalizedName)
      );

      if (match) {
        cost += match.currentPrice * item.quantity;
      } else {
        cost += (item.estimatedPrice || 3.5) * item.quantity;
        missing++;
      }
    });

    singleStoreTotals[store.id] = {
      storeName: store.name,
      totalCost: parseFloat(cost.toFixed(2)),
      missing,
    };
  });

  // Find cheapest single store
  let cheapestSingle = { storeName: 'Walmart Supercenter', totalCost: 9999, missingItemsCount: 0 };
  Object.values(singleStoreTotals).forEach((s) => {
    if (s.totalCost < cheapestSingle.totalCost) {
      cheapestSingle = { storeName: s.storeName, totalCost: s.totalCost, missingItemsCount: s.missing };
    }
  });

  // Calculate Multi-Store Optimization
  const multiStoreMap: Record<string, { storeName: string; items: { name: string; price: number }[]; subtotal: number }> = {};
  let multiStoreTotalCost = 0;

  listItems.forEach((item) => {
    const normItem = normalizeProductName(item.name);
    let bestStoreName = 'Walmart Supercenter';
    let bestPrice = item.estimatedPrice || 3.5;

    allStores.forEach((store) => {
      const match = store.storeProducts.find((sp) =>
        sp.product.normalizedName.includes(normItem) || normItem.includes(sp.product.normalizedName)
      );
      if (match && match.currentPrice < bestPrice) {
        bestPrice = match.currentPrice;
        bestStoreName = store.name;
      }
    });

    if (!multiStoreMap[bestStoreName]) {
      multiStoreMap[bestStoreName] = { storeName: bestStoreName, items: [], subtotal: 0 };
    }

    const itemCost = parseFloat((bestPrice * item.quantity).toFixed(2));
    multiStoreMap[bestStoreName].items.push({ name: item.name, price: itemCost });
    multiStoreMap[bestStoreName].subtotal += itemCost;
    multiStoreTotalCost += itemCost;
  });

  const storeBreakdown = Object.values(multiStoreMap).map((sb) => ({
    storeName: sb.storeName,
    itemCount: sb.items.length,
    subtotal: parseFloat(sb.subtotal.toFixed(2)),
    items: sb.items,
  }));

  const estimatedSavings = Math.max(0, parseFloat((cheapestSingle.totalCost - multiStoreTotalCost).toFixed(2)));

  return {
    totalItemsCount: listItems.length,
    cheapestSingleStore: cheapestSingle,
    cheapestMultiStore: {
      totalCost: parseFloat(multiStoreTotalCost.toFixed(2)),
      estimatedSavings,
      storeBreakdown,
    },
  };
}
