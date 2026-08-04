import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getHouseholdWarrantyStatuses } from '@/lib/warranties';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const warranties = await getHouseholdWarrantyStatuses(user.householdId);
  return NextResponse.json({ warranties });
}
