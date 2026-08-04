import { prisma } from './db';

export interface DocumentSearchQuery {
  householdId: string;
  query: string;
}

export async function searchDocumentsAI({ householdId, query }: DocumentSearchQuery) {
  if (!query || !query.trim()) {
    return prisma.document.findMany({
      where: { householdId },
      orderBy: { docDate: 'desc' },
    });
  }

  const q = query.toLowerCase().trim();
  const docs = await prisma.document.findMany({
    where: { householdId },
    orderBy: { docDate: 'desc' },
  });

  return docs.filter((d) => {
    const textMatch = (d.parsedText || '').toLowerCase().includes(q);
    const titleMatch = d.title.toLowerCase().includes(q);
    const vendorMatch = (d.vendorName || '').toLowerCase().includes(q);
    const typeMatch = d.docType.toLowerCase().includes(q);

    // Natural language intent matching (e.g. "laptop", "receipt", "warranty", "tv")
    if (q.includes('receipt') && d.docType === 'RECEIPT') return true;
    if (q.includes('warranty') && d.docType === 'WARRANTY') return true;
    if (q.includes('invoice') && d.docType === 'INVOICE') return true;
    if (q.includes('bill') && d.docType === 'BILL') return true;

    return textMatch || titleMatch || vendorMatch || typeMatch;
  });
}
