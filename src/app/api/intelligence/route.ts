import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateSpendingIntelligence } from '@/lib/intelligence';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const insights = await generateSpendingIntelligence(user.householdId);
  return NextResponse.json({ insights });
}
