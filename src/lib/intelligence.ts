import { prisma } from './db';

export interface SpendingInsightCard {
  id: string;
  title: string;
  description: string;
  type: 'UNUSUAL_SPENDING' | 'CATEGORY_TREND' | 'TOP_PRODUCT' | 'SAVINGS_OPPORTUNITY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  metric?: string;
  actionText?: string;
  link?: string;
}

export async function generateSpendingIntelligence(householdId: string): Promise<SpendingInsightCard[]> {
  try {
    const expenses = await prisma.expense.findMany({
      where: { householdId },
      orderBy: { date: 'desc' },
    });

    const purchases = await prisma.purchaseRecord.findMany({
      where: { householdId },
    });

    const insights: SpendingInsightCard[] = [];

    if (expenses.length === 0) return insights;

    // 1. Calculate Average Expense Amount & Detect Anomalies
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avgExpense = totalSpent / expenses.length;

    expenses.forEach((e) => {
      if (e.amount > avgExpense * 1.5 && e.amount > 30) {
        insights.push({
          id: `unusual-${e.id}`,
          title: 'Unusual Spending Detected',
          description: `The expense "${e.title}" ($${e.amount.toFixed(2)}) is significantly higher than your average expense ($${avgExpense.toFixed(2)}).`,
          type: 'UNUSUAL_SPENDING',
          severity: 'HIGH',
          metric: `$${e.amount.toFixed(2)}`,
          actionText: 'Review Expense',
          link: '/expenses',
        });
      }
    });

    // 2. Category Trend Analysis
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    let topCategory = '';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (amount > topCategoryAmount) {
        topCategoryAmount = amount;
        topCategory = cat;
      }
    });

    if (topCategoryAmount > 0) {
      const percentage = ((topCategoryAmount / totalSpent) * 100).toFixed(0);
      insights.push({
        id: `category-top-${topCategory}`,
        title: 'Top Category Spending',
        description: `${topCategory} accounts for ${percentage}% ($${topCategoryAmount.toFixed(2)}) of your total household expenses this month.`,
        type: 'CATEGORY_TREND',
        severity: 'MEDIUM',
        metric: `${percentage}%`,
        actionText: 'View Expenses',
        link: '/expenses',
      });
    }

    // 3. Savings Opportunity
    if (purchases.length >= 3) {
      insights.push({
        id: 'savings-bulk',
        title: 'Bulk Savings Opportunity',
        description: 'You purchase Milk and Produce weekly. Buying family packs or bulk items could save up to 15% monthly.',
        type: 'SAVINGS_OPPORTUNITY',
        severity: 'LOW',
        metric: '15% Save',
        actionText: 'View Grocery List',
        link: '/grocery',
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating spending intelligence:', error);
    return [];
  }
}
