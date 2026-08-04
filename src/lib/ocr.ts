export interface ExtractedReceiptItem {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface ExtractedReceiptData {
  storeName: string;
  receiptDate: string;
  totalAmount: number;
  taxAmount: number;
  items: ExtractedReceiptItem[];
  rawText: string;
}

// Categorizes receipt items based on common food/grocery item keywords
export function categorizeItem(name: string): string {
  const lower = name.toLowerCase();
  
  if (/\b(apple|banana|orange|tomato|onion|potato|avocado|lettuce|berry|berries|grape|fruit|veg|carrot|salad|spinach|garlic|lemon|lime)\b/.test(lower)) {
    return 'PRODUCE';
  }
  if (/\b(milk|cheese|yogurt|butter|cream|egg|eggs|margarine|cheddar|mozzarella|parmesan)\b/.test(lower)) {
    return 'DAIRY';
  }
  if (/\b(chicken|beef|pork|steak|turkey|salmon|tuna|fish|bacon|sausage|meat|shrimp|ground)\b/.test(lower)) {
    return 'MEAT';
  }
  if (/\b(paper|towel|soap|detergent|cleaner|tissue|bag|trash|sponge|wipes|dish|clean)\b/.test(lower)) {
    return 'HOUSEHOLD';
  }
  if (/\b(shampoo|deodorant|toothpaste|soap|lotion|razor|brush|cream|vitamin|bath)\b/.test(lower)) {
    return 'PERSONAL';
  }
  if (/\b(bread|cereal|pasta|rice|flour|sugar|oil|sauce|can|canned|soup|chips|snack|cookie|cracker|coffee|tea)\b/.test(lower)) {
    return 'PANTRY';
  }
  
  return 'GROCERY';
}

export function parseReceiptText(text: string): ExtractedReceiptData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let storeName = 'Grocery Store';
  let totalAmount = 0;
  let taxAmount = 0;
  let receiptDate = new Date().toISOString().split('T')[0];
  const items: ExtractedReceiptItem[] = [];

  // Try to find Store Name (usually first non-empty lines)
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (/walmart|target|costco|trader joe|kroger|safeway|whole foods|aldi|h-e-b|publix|market|mart|store/i.test(line)) {
      storeName = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
      break;
    } else if (i === 0 && line.length > 2 && !/\$|\d{3}/.test(line)) {
      storeName = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
    }
  }

  // Regex patterns
  const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/;
  const priceRegex = /\$?(\d+\.\d{2})\b/;
  const totalRegex = /\b(total|balance|amount due|grand total)\b/i;
  const taxRegex = /\b(tax|sales tax|vat)\b/i;

  lines.forEach(line => {
    // Check Date
    const dateMatch = line.match(dateRegex);
    if (dateMatch && dateMatch[1]) {
      try {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) {
          receiptDate = d.toISOString().split('T')[0];
        }
      } catch {
        // Fallback to default date
      }
    }

    // Check Tax
    if (taxRegex.test(line)) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        taxAmount = parseFloat(priceMatch[1]);
      }
      return;
    }

    // Check Total Amount
    if (totalRegex.test(line)) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        totalAmount = Math.max(totalAmount, parseFloat(priceMatch[1]));
      }
      return;
    }

    // Parse Line Items: usually "Item Description $XX.XX" or "Item Description XX.XX"
    const priceMatch = line.match(priceRegex);
    if (priceMatch && !/subtotal|total|change|cash|card|visa|mastercard|tax|savings|discount/i.test(line)) {
      const price = parseFloat(priceMatch[1]);
      let name = line.substring(0, priceMatch.index).trim();
      
      // Clean up item name
      name = name.replace(/^[\d\*\s\-]+/, '').replace(/[\*\$]/g, '').trim();
      
      if (name.length >= 2 && price > 0 && price < 500) {
        const category = categorizeItem(name);
        items.push({
          name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
          category,
          price,
          quantity: 1,
        });
      }
    }
  });

  // If total wasn't found explicitly, calculate from sum of items + tax
  if (totalAmount === 0 && items.length > 0) {
    const itemSum = items.reduce((sum, item) => sum + item.price, 0);
    totalAmount = parseFloat((itemSum + taxAmount).toFixed(2));
  }

  return {
    storeName,
    receiptDate,
    totalAmount,
    taxAmount,
    items,
    rawText: text,
  };
}
