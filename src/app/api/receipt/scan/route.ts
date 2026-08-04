import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { parseReceiptText } from '@/lib/ocr';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawText } = await req.json();
    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'Receipt text or image content required.' }, { status: 400 });
    }

    const extracted = parseReceiptText(rawText);

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (error) {
    console.error('Scan receipt error:', error);
    return NextResponse.json({ error: 'Failed to process receipt text.' }, { status: 500 });
  }
}
