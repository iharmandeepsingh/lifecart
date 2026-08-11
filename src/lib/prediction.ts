import { prisma } from './db';

export interface DualPredictionSuggestion {
  productName: string;
  category: string;
  baseline: {
    predictedDate: Date;
    daysUntilRestock: number;
    confidence: number;
    reason: string;
  };
  improved: {
    predictedDate: Date;
    daysUntilRestock: number;
    confidence: number;
    reason: string;
    historicalDataPointsUsed: number;
  };
}

export async function generateDualPurchasePredictions(householdId: string): Promise<DualPredictionSuggestion[]> {
  const purchases = await prisma.purchaseRecord.findMany({
    where: { householdId },
    orderBy: { purchaseDate: 'asc' },
  });

  const grouped: Record<string, typeof purchases> = {};
  for (const p of purchases) {
    const key = p.productName.toLowerCase().trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  const suggestions: DualPredictionSuggestion[] = [];
  const now = new Date();

  for (const [key, records] of Object.entries(grouped)) {
    if (records.length < 2) continue;

    // 1. Baseline Model: Mean Purchase Interval
    let totalIntervalDays = 0;
    for (let i = 1; i < records.length; i++) {
      const diffMs = new Date(records[i].purchaseDate).getTime() - new Date(records[i - 1].purchaseDate).getTime();
      totalIntervalDays += diffMs / (1000 * 60 * 60 * 24);
    }
    const baselineMeanInterval = totalIntervalDays / (records.length - 1);
    const lastPurchaseDate = new Date(records[records.length - 1].purchaseDate);
    const baselineNextDate = new Date(lastPurchaseDate.getTime() + baselineMeanInterval * 86400000);
    const baselineDays = Math.ceil((baselineNextDate.getTime() - now.getTime()) / 86400000);

    // 2. Improved Model: Exponentially Weighted Recent Intervals + Quantity Decay
    let weightedIntervalSum = 0;
    let weightSum = 0;
    for (let i = 1; i < records.length; i++) {
      const weight = Math.pow(1.5, i); // Give higher weight to recent purchases
      const diffDays = (new Date(records[i].purchaseDate).getTime() - new Date(records[i - 1].purchaseDate).getTime()) / 86400000;
      weightedIntervalSum += diffDays * weight;
      weightSum += weight;
    }
    const weightedInterval = weightSum > 0 ? weightedIntervalSum / weightSum : baselineMeanInterval;
    const lastQty = records[records.length - 1].quantity || 1;
    const adjustedInterval = weightedInterval * Math.min(2.0, Math.max(0.5, lastQty));

    const improvedNextDate = new Date(lastPurchaseDate.getTime() + adjustedInterval * 86400000);
    const improvedDays = Math.max(1, Math.ceil((improvedNextDate.getTime() - now.getTime()) / 86400000));
    const confidence = Math.min(95, Math.max(50, Math.round(50 + records.length * 8)));

    suggestions.push({
      productName: records[0].productName,
      category: records[0].category,
      baseline: {
        predictedDate: baselineNextDate,
        daysUntilRestock: baselineDays,
        confidence: Math.round(50 + records.length * 5),
        reason: `Baseline: Mean interval of ${Math.round(baselineMeanInterval)} days across ${records.length} purchases.`,
      },
      improved: {
        predictedDate: improvedNextDate,
        daysUntilRestock: improvedDays,
        confidence,
        reason: `${records[0].productName} likely needed in ~${improvedDays} day(s) — ${confidence}% confidence based on ${records.length} recent weighted purchases & quantity decay.`,
        historicalDataPointsUsed: records.length,
      },
    });
  }

  return suggestions;
}

export async function generatePurchasePredictions(householdId: string) {
  const dual = await generateDualPurchasePredictions(householdId);
  return dual.map((d) => ({
    productName: d.productName,
    category: d.category,
    confidence: d.improved.confidence,
    reason: d.improved.reason,
    daysUntilRestock: d.improved.daysUntilRestock,
  }));
}
