import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No active household' }, { status: 400 });
    }

    const hId = user.householdId;

    // Seed Demo Documents
    await prisma.document.createMany({
      data: [
        {
          householdId: hId,
          uploadedById: user.id,
          title: 'MacBook Air M3 Purchase Receipt & Tax Invoice',
          docType: 'INVOICE',
          vendorName: 'Apple Store Fifth Ave',
          amount: 1199.00,
          docDate: new Date(),
          warrantyExpiryDate: new Date(Date.now() + 365 * 86400000),
          parsedText: 'Apple Store Receipt MacBook Air M3 15-inch 16GB 512GB Serial C02X12345',
        },
        {
          householdId: hId,
          uploadedById: user.id,
          title: 'Sony WH-1000XM5 Headphones Warranty Card',
          docType: 'WARRANTY',
          vendorName: 'Best Buy',
          amount: 399.00,
          docDate: new Date(Date.now() - 340 * 86400000),
          warrantyExpiryDate: new Date(Date.now() + 25 * 86400000), // Expiring in 25 days!
          parsedText: 'Best Buy Sony Headphones 2 Year Warranty Protection Plan',
        },
      ],
    });

    // Seed Demo Owned Products with Warranties
    await prisma.ownedProduct.createMany({
      data: [
        {
          userId: user.id,
          householdId: hId,
          name: 'Sony WH-1000XM5 Wireless Headphones',
          category: 'ELECTRONICS',
          brand: 'Sony',
          model: 'WH-1000XM5',
          serialNumber: 'SN-99882211',
          purchasePrice: 399,
          storeName: 'Best Buy',
          purchaseDate: new Date(Date.now() - 340 * 86400000),
          warrantyMonths: 12,
          warrantyExpiryDate: new Date(Date.now() + 25 * 86400000), // Expiring in 25 days!
          notes: 'Premium noise-canceling headphones for university studying',
        },
        {
          userId: user.id,
          householdId: hId,
          name: 'LG C3 55-inch 4K OLED TV',
          category: 'ELECTRONICS',
          brand: 'LG',
          model: 'OLED55C3',
          serialNumber: 'LG-TV-554433',
          purchasePrice: 1299,
          storeName: 'Costco Wholesale',
          purchaseDate: new Date(Date.now() - 120 * 86400000),
          warrantyMonths: 24,
          warrantyExpiryDate: new Date(Date.now() + 600 * 86400000),
          notes: 'Living room primary TV',
        },
      ],
    });

    // Seed Demo Notifications
    await prisma.notification.createMany({
      data: [
        {
          householdId: hId,
          title: 'Warranty Expiring Soon',
          message: 'Your Sony WH-1000XM5 Headphones warranty expires in 25 days.',
          type: 'REMINDER',
          link: '/mystuff',
        },
        {
          householdId: hId,
          title: 'Price Drop Alert',
          message: ' DiGiorno Margherita Pizza dropped by 18% at Walmart!',
          type: 'PREDICTION',
          link: '/shopping',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Demo Household dataset loaded! Includes sample documents, warranty alerts, products, and price drops.',
    });
  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json({ error: 'Failed to load demo household data' }, { status: 500 });
  }
}
