import { NextResponse } from 'next/server';
import { requireSystemAdmin } from '@/lib/security';
import { prisma } from '@/lib/db';

export async function GET() {
  const { authorized } = await requireSystemAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden: System Admin Authorization Required' }, { status: 403 });
  }

  const ocrEvaluations = await prisma.ocrEvaluationRecord.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  const predictionEvaluations = await prisma.predictionEvaluationRecord.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  const researchMetrics = await prisma.researchMetric.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
  });

  const totalReceipts = await prisma.receipt.count();
  const totalHouseholds = await prisma.household.count();
  const totalPurchases = await prisma.purchaseRecord.count();

  return NextResponse.json({
    authorized: true,
    summary: {
      totalReceipts,
      totalHouseholds,
      totalPurchases,
      ocrEvaluationsCount: ocrEvaluations.length,
      predictionEvaluationsCount: predictionEvaluations.length,
    },
    ocrEvaluations,
    predictionEvaluations,
    researchMetrics,
  });
}
