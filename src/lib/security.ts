import { prisma } from './db';
import { getCurrentUser } from './auth';

export async function verifyHouseholdAccess(userId: string, targetHouseholdId: string): Promise<boolean> {
  if (!userId || !targetHouseholdId) return false;

  const member = await prisma.householdMember.findFirst({
    where: { userId, householdId: targetHouseholdId },
  });

  return !!member;
}

export async function requireSystemAdmin() {
  const user = await getCurrentUser();
  if (!user) return { authorized: false, user: null };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== 'SYSTEM_ADMIN') {
    return { authorized: false, user: dbUser };
  }

  return { authorized: true, user: dbUser };
}

export function validateFileUpload(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxBytes = 10 * 1024 * 1024; // 10 MB limit

  if (!allowedMimeTypes.includes(mimeType)) {
    return { valid: false, error: 'Invalid file format. Only PNG, JPG, WebP, and PDF are permitted.' };
  }

  if (fileSize > maxBytes) {
    return { valid: false, error: 'File size exceeds 10MB limit.' };
  }

  return { valid: true };
}

export function sanitizeString(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>?/gm, '').trim();
}
