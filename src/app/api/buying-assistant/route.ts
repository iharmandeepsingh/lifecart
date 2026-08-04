import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { calculateBuyingRecommendations } from '@/lib/buyingAssistant';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, budget, usage, priority } = await req.json();

    const recommendations = calculateBuyingRecommendations({
      category: category || 'Laptop',
      budget: Number(budget) || 1000,
      usage: usage || 'Everyday',
      priority: priority || 'Performance',
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Buying assistant error:', error);
    return NextResponse.json({ error: 'Failed to calculate recommendations' }, { status: 500 });
  }
}
