import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processLifeCartAiQuery } from '@/lib/lifecartAi';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const { query } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await processLifeCartAiQuery(user.householdId, query);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('LifeCart AI error:', error);
    return NextResponse.json({ error: 'Failed to process AI query' }, { status: 500 });
  }
}
