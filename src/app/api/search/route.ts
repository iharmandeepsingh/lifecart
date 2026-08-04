import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { performGlobalSearch } from '@/lib/search';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  const results = await performGlobalSearch(user.householdId, query);
  return NextResponse.json({ results });
}
