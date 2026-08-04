import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { searchDocumentsAI } from '@/lib/documents';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'No active household' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  const documents = await searchDocumentsAI({
    householdId: user.householdId,
    query: q || '',
  });

  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, docType, vendorName, amount, docDate, warrantyExpiryDate, parsedText } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Document title required' }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        householdId: user.householdId,
        uploadedById: user.id,
        title: title.trim(),
        docType: docType || 'RECEIPT',
        vendorName: vendorName?.trim() || null,
        amount: Number(amount) || 0,
        docDate: docDate ? new Date(docDate) : new Date(),
        warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : null,
        parsedText: parsedText?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
