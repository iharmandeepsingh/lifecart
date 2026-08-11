export type BaseUnitCategory = 'VOLUME' | 'MASS' | 'COUNT' | 'LENGTH' | 'OTHER';

export interface NormalizedQuantity {
  normalizedValue: number;
  baseUnit: string;
  category: BaseUnitCategory;
}

export function normalizeQuantityAndUnit(quantity: number, rawUnit: string): NormalizedQuantity {
  const u = (rawUnit || '').toLowerCase().trim();

  // Volume -> ml
  if (u === 'l' || u === 'liter' || u === 'liters' || u === 'litre' || u === 'litres') {
    return { normalizedValue: quantity * 1000, baseUnit: 'ml', category: 'VOLUME' };
  }
  if (u === 'ml' || u === 'milliliter' || u === 'milliliters') {
    return { normalizedValue: quantity, baseUnit: 'ml', category: 'VOLUME' };
  }
  if (u === 'gal' || u === 'gallon' || u === 'gallons') {
    return { normalizedValue: quantity * 3785.41, baseUnit: 'ml', category: 'VOLUME' };
  }

  // Mass -> g
  if (u === 'kg' || u === 'kilo' || u === 'kilogram' || u === 'kilograms') {
    return { normalizedValue: quantity * 1000, baseUnit: 'g', category: 'MASS' };
  }
  if (u === 'g' || u === 'gram' || u === 'grams') {
    return { normalizedValue: quantity, baseUnit: 'g', category: 'MASS' };
  }
  if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') {
    return { normalizedValue: quantity * 453.592, baseUnit: 'g', category: 'MASS' };
  }
  if (u === 'oz' || u === 'ounce' || u === 'ounces') {
    return { normalizedValue: quantity * 28.3495, baseUnit: 'g', category: 'MASS' };
  }

  // Count -> pcs
  return { normalizedValue: quantity, baseUnit: 'pcs', category: 'COUNT' };
}
