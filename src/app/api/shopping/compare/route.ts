import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPriceComparisonForProduct } from '@/lib/priceIntelligence';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (productId) {
    const comparison = await getPriceComparisonForProduct(productId);
    return NextResponse.json({ comparison });
  }

  // Return all products with prices
  const products = await prisma.product.findMany({
    include: {
      storeProducts: {
        include: { store: true },
      },
    },
    take: 20,
  });

  return NextResponse.json({ products });
}
