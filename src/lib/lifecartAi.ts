import { prisma } from './db';
import { generatePurchasePredictions } from './prediction';
import { generateSpendingIntelligence } from './intelligence';
import { optimizeShoppingBasket } from './basketOptimizer';
import { searchDocumentsAI } from './documents';
import { getHouseholdWarrantyStatuses } from './warranties';

export interface AiQueryResult {
  query: string;
  intent: string;
  answer: string;
  groundedData: any;
  suggestedAction?: {
    label: string;
    actionType: 'ADD_TO_LIST' | 'VIEW_DOCUMENTS' | 'VIEW_OPTIMIZER' | 'VIEW_WARRANTY';
    payload?: any;
  } | null;
}

export async function processLifeCartAiQuery(householdId: string, query: string): Promise<AiQueryResult> {
  const q = query.toLowerCase().trim();

  // Intent 1: Low stock / What is running low
  if (q.includes('low') || q.includes('run out') || q.includes('pantry stock')) {
    const lowItems = await prisma.inventoryItem.findMany({
      where: { householdId, status: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
    });

    const count = lowItems.length;
    const names = lowItems.map((i) => `${i.name} (${i.quantity} ${i.unit} left)`).join(', ');

    return {
      query,
      intent: 'LOW_INVENTORY_CHECK',
      answer: count > 0
        ? `You have ${count} item(s) running low or out of stock: ${names}. Would you like me to add them to your shared grocery list?`
        : 'All pantry inventory items are currently in stock!',
      groundedData: lowItems,
      suggestedAction: count > 0 ? {
        label: `Add ${count} Low Item(s) to Grocery List`,
        actionType: 'ADD_TO_LIST',
        payload: lowItems,
      } : null,
    };
  }

  // Intent 2: What should I buy / Predictions
  if (q.includes('buy') || q.includes('predict') || q.includes('need')) {
    const predictions = await generatePurchasePredictions(householdId);
    const names = predictions.slice(0, 3).map((p) => p.productName).join(', ');

    return {
      query,
      intent: 'PURCHASE_PREDICTION',
      answer: predictions.length > 0
        ? `Based on your household purchase history, you will likely need: ${names} soon.`
        : 'Your inventory levels are optimal! No urgent restocks predicted for this week.',
      groundedData: predictions,
      suggestedAction: predictions.length > 0 ? {
        label: 'Add Predicted Items to Grocery List',
        actionType: 'ADD_TO_LIST',
        payload: predictions,
      } : null,
    };
  }

  // Intent 3: Document search / Receipts / Invoices
  if (q.includes('receipt') || q.includes('invoice') || q.includes('paid for') || q.includes('document')) {
    const docs = await searchDocumentsAI({ householdId, query });
    const receipts = await prisma.receipt.findMany({
      where: { householdId },
      orderBy: { receiptDate: 'desc' },
      take: 3,
    });

    return {
      query,
      intent: 'DOCUMENT_SEARCH',
      answer: docs.length > 0
        ? `Found ${docs.length} matching document(s) in your Document Vault. Recent uploaded document: "${docs[0].title}".`
        : `Found ${receipts.length} stored receipt(s). Latest receipt: $${receipts[0]?.totalAmount || 0} from ${receipts[0]?.storeName || 'Store'}.`,
      groundedData: docs.length > 0 ? docs : receipts,
      suggestedAction: {
        label: 'Open Document Vault',
        actionType: 'VIEW_DOCUMENTS',
      },
    };
  }

  // Intent 4: Warranty expiry
  if (q.includes('warranty') || q.includes('expire')) {
    const warranties = await getHouseholdWarrantyStatuses(householdId);
    const expiring = warranties.filter((w) => w.status === 'EXPIRING_SOON' || w.status === 'ACTIVE');

    return {
      query,
      intent: 'WARRANTY_CHECK',
      answer: expiring.length > 0
        ? `Your active product warranties: ${expiring.map((w) => `${w.name} (${w.daysRemaining} days remaining)`).join(', ')}.`
        : 'No products currently registered with expiring warranties.',
      groundedData: warranties,
      suggestedAction: {
        label: 'Open Warranty Wallet',
        actionType: 'VIEW_WARRANTY',
      },
    };
  }

  // Intent 5: Basket optimizer / Cheapest plan / Savings
  if (q.includes('cheapest') || q.includes('saving') || q.includes('plan') || q.includes('optimize')) {
    const opt = await optimizeShoppingBasket(householdId);
    const savings = opt.cheapestMultiStore.estimatedSavings;

    return {
      query,
      intent: 'BASKET_OPTIMIZER',
      answer: savings > 0
        ? `By using LifeCart Multi-Store Basket Optimizer, your household can save $${savings.toFixed(2)} on your active grocery list by splitting purchases between ${opt.cheapestMultiStore.storeBreakdown.length} stores.`
        : `Cheapest single store for your list is ${opt.cheapestSingleStore.storeName} at $${opt.cheapestSingleStore.totalCost.toFixed(2)}.`,
      groundedData: opt,
      suggestedAction: {
        label: 'View Optimized Shopping Plan',
        actionType: 'VIEW_OPTIMIZER',
      },
    };
  }

  // Intent 6: Spending analysis
  if (q.includes('spend') || q.includes('expensive') || q.includes('money')) {
    const insights = await generateSpendingIntelligence(householdId);
    return {
      query,
      intent: 'SPENDING_INTELLIGENCE',
      answer: insights.length > 0
        ? insights[0].description
        : 'Your household spending is balanced across categories this month.',
      groundedData: insights,
    };
  }

  // General Fallback
  return {
    query,
    intent: 'GENERAL_ASSISTANT',
    answer: `LifeCart AI Assistant: I can help analyze your household groceries, find receipt documents, check warranty expiration dates, optimize your shopping list, and track spending trends! Try asking: "What products are running low?" or "Find my laptop receipt".`,
    groundedData: null,
  };
}
