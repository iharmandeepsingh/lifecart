import { prisma } from './db';

export interface PredictionSuggestion {
  productName: string;
  category: string;
  averageIntervalDays: number;
  daysSinceLastPurchase: number;
  daysRemaining: number;
  confidenceScore: number;
  suggestedAction: string;
}

export async function generatePurchasePredictions(householdId: string): Promise<PredictionSuggestion[]> {
  try {
    const purchases = await prisma.purchaseRecord.findMany({
      where: { householdId },
      orderBy: { purchaseDate: 'asc' },
    });

    if (purchases.length === 0) return [];

    // Group purchases by normalized product name
    const grouped: Record<string, { name: string; category: string; dates: Date[] }> = {};

    purchases.forEach((p) => {
      const key = p.productName.toLowerCase().trim();
      if (!grouped[key]) {
        grouped[key] = { name: p.productName, category: p.category, dates: [] };
      }
      grouped[key].dates.push(new Date(p.purchaseDate));
    });

    const suggestions: PredictionSuggestion[] = [];
    const now = new Date();

    Object.values(grouped).forEach((item) => {
      const dates = item.dates.sort((a, b) => a.getTime() - b.getTime());
      const lastDate = dates[dates.length - 1];
      const daysSinceLastPurchase = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      let avgInterval = 7; // Default 7-day interval fallback

      if (dates.length >= 2) {
        let totalInterval = 0;
        for (let i = 1; i < dates.length; i++) {
          const diffDays = Math.max(1, Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)));
          totalInterval += diffDays;
        }
        avgInterval = Math.round(totalInterval / (dates.length - 1));
      }

      const daysRemaining = avgInterval - daysSinceLastPurchase;

      // Suggest if purchase is due soon (daysRemaining <= 1 or past due)
      if (daysRemaining <= 2) {
        const confidenceScore = Math.min(0.95, 0.5 + dates.length * 0.15);
        suggestions.push({
          productName: item.name,
          category: item.category,
          averageIntervalDays: avgInterval,
          daysSinceLastPurchase,
          daysRemaining,
          confidenceScore,
          suggestedAction: `${item.name} is usually purchased every ${avgInterval} days (last bought ${daysSinceLastPurchase} days ago).`,
        });
      }
    });

    return suggestions.sort((a, b) => a.daysRemaining - b.daysRemaining);
  } catch (error) {
    console.error('Error generating purchase predictions:', error);
    return [];
  }
}
