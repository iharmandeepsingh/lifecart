import { prisma } from './db';

// Normalizes a product title by lowercasing, standardizing volume/weight units, and removing punctuation
export function normalizeProductName(name: string): string {
  if (!name) return '';
  
  let normalized = name.toLowerCase().trim();
  
  // Standardize volume & units (e.g. 1500ml -> 1.5l, 1,5 l -> 1.5l)
  normalized = normalized
    .replace(/1500\s*ml|1,5\s*l|1\.5\s*liter/g, '1.5l')
    .replace(/1000\s*ml|1\s*liter/g, '1l')
    .replace(/500\s*ml|0,5\s*l/g, '500ml')
    .replace(/1000\s*g|1\s*kg/g, '1kg')
    .replace(/coke\b/g, 'coca-cola')
    .replace(/zero\s*sugar/g, 'zero')
    .replace(/[^a-z0-9\.\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

export async function findOrCreateNormalizedProduct(rawName: string, category: string = 'GROCERY', brand?: string) {
  const normName = normalizeProductName(rawName);
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).trim();

  let product = await prisma.product.findUnique({
    where: { normalizedName: normName },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: displayName,
        normalizedName: normName,
        category,
        brand: brand || null,
      },
    });
  }

  return product;
}
