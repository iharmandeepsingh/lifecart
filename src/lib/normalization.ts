import { normalizeQuantityAndUnit } from './units';

export interface NormalizationResult {
  rawName: string;
  normalizedName: string;
  brand: string | null;
  quantity: number;
  unit: string;
  category: string;
  matchConfidence: number;
  status: 'AUTO_MATCH' | 'NEEDS_CONFIRMATION' | 'SEPARATE_PRODUCT';
}

const BRANDS = ['SONY', 'APPLE', 'LG', 'SAMSUNG', 'COCA-COLA', 'COKE', 'TRADER JOES', 'WALMART', 'ORGANIC VALLEY', 'NESTLE'];

export function cleanProductString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s\.\,\-\%]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectBrand(cleanedStr: string): string | null {
  const upper = cleanedStr.toUpperCase();
  for (const b of BRANDS) {
    if (upper.includes(b)) {
      return b;
    }
  }
  return null;
}

export function computeJaccardSimilarity(strA: string, strB: string): number {
  const setA = new Set(strA.toLowerCase().split(' '));
  const setB = new Set(strB.toLowerCase().split(' '));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function normalizeProductName(name: string): NormalizationResult {
  const cleaned = cleanProductString(name);
  const brand = detectBrand(cleaned);

  let category = 'GROCERY';
  if (cleaned.includes('milk') || cleaned.includes('cheese') || cleaned.includes('yogurt')) category = 'DAIRY';
  else if (cleaned.includes('chicken') || cleaned.includes('beef') || cleaned.includes('pork')) category = 'MEAT';
  else if (cleaned.includes('apple') || cleaned.includes('banana') || cleaned.includes('salad')) category = 'PRODUCE';
  else if (cleaned.includes('phone') || cleaned.includes('tv') || cleaned.includes('laptop') || cleaned.includes('headphone')) category = 'ELECTRONICS';

  // Normalize quantity & unit (e.g. 1.5L -> 1500ml)
  let quantity = 1;
  let unit = 'pcs';

  const matchVol = cleaned.match(/(\d+(\.\d+)?)\s*(l|litre|liters|ml|gal)/i);
  if (matchVol) {
    const val = parseFloat(matchVol[1]);
    const norm = normalizeQuantityAndUnit(val, matchVol[3]);
    quantity = norm.normalizedValue;
    unit = norm.baseUnit;
  }

  const normalizedName = `${brand ? brand + ' ' : ''}${cleaned}`.trim();
  const matchConfidence = brand ? 92 : 75;

  return {
    rawName: name,
    normalizedName,
    brand,
    quantity,
    unit,
    category,
    matchConfidence,
    status: matchConfidence >= 85 ? 'AUTO_MATCH' : matchConfidence >= 60 ? 'NEEDS_CONFIRMATION' : 'SEPARATE_PRODUCT',
  };
}

export function categorizeItem(name: string): string {
  return normalizeProductName(name).category;
}
