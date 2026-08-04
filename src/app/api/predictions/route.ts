import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generatePurchasePredictions } from '@/lib/prediction';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const predictions = await generatePurchasePredictions(user.householdId);
  return NextResponse.json({ predictions });
}
