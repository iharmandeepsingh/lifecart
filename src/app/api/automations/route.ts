import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { runHouseholdAutomations } from '@/lib/automations';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  let config = await prisma.automationConfig.findUnique({
    where: { householdId: user.householdId },
  });

  if (!config) {
    config = await prisma.automationConfig.create({
      data: { householdId: user.householdId },
    });
  }

  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'TRIGGER_NOW') {
      const res = await runHouseholdAutomations(user.householdId);
      return NextResponse.json(res);
    }

    const { lowStockAutoSuggest, priceDropAlerts, warrantyAlerts, recurringPurchases, unusualSpending, upcomingPayments } = await req.json();

    const updated = await prisma.automationConfig.upsert({
      where: { householdId: user.householdId },
      update: {
        ...(lowStockAutoSuggest !== undefined ? { lowStockAutoSuggest } : {}),
        ...(priceDropAlerts !== undefined ? { priceDropAlerts } : {}),
        ...(warrantyAlerts !== undefined ? { warrantyAlerts } : {}),
        ...(recurringPurchases !== undefined ? { recurringPurchases } : {}),
        ...(unusualSpending !== undefined ? { unusualSpending } : {}),
        ...(upcomingPayments !== undefined ? { upcomingPayments } : {}),
      },
      create: {
        householdId: user.householdId,
        lowStockAutoSuggest: lowStockAutoSuggest ?? true,
        priceDropAlerts: priceDropAlerts ?? true,
        warrantyAlerts: warrantyAlerts ?? true,
        recurringPurchases: recurringPurchases ?? true,
        unusualSpending: unusualSpending ?? true,
        upcomingPayments: upcomingPayments ?? true,
      },
    });

    return NextResponse.json({ config: updated });
  } catch (error) {
    console.error('Update automation error:', error);
    return NextResponse.json({ error: 'Failed to update automations' }, { status: 500 });
  }
}
