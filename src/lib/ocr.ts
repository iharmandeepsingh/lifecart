import { categorizeItem } from './normalization';
import { prisma } from './db';

export { categorizeItem };

export interface ExtractedReceiptItem {
  name: string;
  category: string;
  price: number;
  quantity: number;
  confidence: number;
}

export interface ExtractedReceiptData {
  storeName: string;
  storeConfidence: number;
  receiptDate: string;
  dateConfidence: number;
  totalAmount: number;
  totalConfidence: number;
  taxAmount: number;
  items: ExtractedReceiptItem[];
  overallConfidence: number;
}

export function parseReceiptTextWithConfidence(text: string): ExtractedReceiptData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let storeName = 'Grocery Store';
  let storeConfidence = 70;
  let receiptDate = new Date().toISOString().split('T')[0];
  let dateConfidence = 75;
  let totalAmount = 0;
  let totalConfidence = 80;
  let taxAmount = 0;
  const items: ExtractedReceiptItem[] = [];

  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (line.includes('WALMART')) { storeName = 'Walmart Supercenter'; storeConfidence = 98; }
    else if (line.includes('TRADER JOE')) { storeName = "Trader Joe's"; storeConfidence = 98; }
    else if (line.includes('TARGET')) { storeName = 'Target'; storeConfidence = 95; }
    else if (line.includes('COSTCO')) { storeName = 'Costco Wholesale'; storeConfidence = 98; }
    else if (line.length > 3 && !line.includes('DATE') && !line.includes('RECEIPT')) {
      storeName = line.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      storeConfidence = 75;
    }
  }

  const priceRegex = /(\$?(\d+\.\d{2}))/;
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) {
          receiptDate = parsed.toISOString().split('T')[0];
          dateConfidence = 95;
        }
      } catch (err) {
        // fallback
      }
    }

    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const val = parseFloat(priceMatch[2]);
      if (line.toUpperCase().includes('TOTAL') && !line.toUpperCase().includes('SUBTOTAL')) {
        totalAmount = val;
        totalConfidence = 95;
      } else if (line.toUpperCase().includes('TAX')) {
        taxAmount = val;
      } else if (!line.toUpperCase().includes('SUBTOTAL') && !line.toUpperCase().includes('CHANGE') && val > 0 && val < 500) {
        const itemName = line.replace(priceRegex, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
        if (itemName.length > 2) {
          const cat = categorizeItem(itemName);
          items.push({
            name: itemName,
            category: cat,
            price: val,
            quantity: 1,
            confidence: val > 0.5 ? 90 : 65,
          });
        }
      }
    }
  }

  const overallConfidence = Math.round((storeConfidence + dateConfidence + totalConfidence) / 3);

  return {
    storeName,
    storeConfidence,
    receiptDate,
    dateConfidence,
    totalAmount,
    totalConfidence,
    taxAmount,
    items,
    overallConfidence,
  };
}

export function parseReceiptText(text: string): ExtractedReceiptData {
  return parseReceiptTextWithConfidence(text);
}

export async function logOcrEvaluationRecord(householdId: string, receiptId: string, data: ExtractedReceiptData, correctedCount: number = 0) {
  try {
    await prisma.ocrEvaluationRecord.create({
      data: {
        householdId,
        receiptId,
        ocrConfidence: data.overallConfidence,
        rawText: `${data.storeName} Total: ${data.totalAmount}`,
        extractedItemsCount: data.items.length,
        correctedItemsCount: correctedCount,
        itemAccuracyPercent: data.items.length > 0 ? ((data.items.length - correctedCount) / data.items.length) * 100 : 100,
      },
    });
  } catch (err) {
    console.error('Failed to log OCR evaluation:', err);
  }
}
