import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { optimizeShoppingBasket } from '@/lib/basketOptimizer';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const result = await optimizeShoppingBasket(user.householdId);
  return NextResponse.json({ result });
}
