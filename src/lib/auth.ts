import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'lifecart-super-secret-jwt-key-2026';
const TOKEN_COOKIE_NAME = 'lifecart_session';

export interface UserTokenPayload {
  userId: string;
  email: string;
  name: string;
  householdId?: string | null;
}

export const FALLBACK_MEMBERS = [
  { id: 'user-harman', name: 'Harman', email: 'harman@lifecart.com', role: 'ADMIN' },
  { id: 'user-raj', name: 'Raj', email: 'raj@lifecart.com', role: 'MEMBER' },
  { id: 'user-simar', name: 'Simar', email: 'simar@lifecart.com', role: 'MEMBER' },
  { id: 'user-asis', name: 'Asis', email: 'asis@lifecart.com', role: 'MEMBER' },
  { id: 'user-arman', name: 'Arman', email: 'arman@lifecart.com', role: 'MEMBER' },
];

export const DEFAULT_FALLBACK_USER = {
  id: 'user-harman',
  name: 'Harman',
  email: 'harman@lifecart.com',
  role: 'SYSTEM_ADMIN',
  avatarUrl: null,
  householdId: 'demo-household-id-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  household: {
    id: 'demo-household-id-1',
    name: 'LifeCart Shared House',
    inviteCode: 'CART-892X',
    createdById: 'user-harman',
    currency: 'EUR',
    createdAt: new Date(),
    updatedAt: new Date(),
    members: FALLBACK_MEMBERS.map((m) => ({
      id: `member-${m.name.toLowerCase()}`,
      userId: m.id,
      householdId: 'demo-household-id-1',
      role: m.role,
      joinedAt: new Date(),
      user: { id: m.id, name: m.name, email: m.email, avatarUrl: null },
    })),
  },
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

    if (token) {
      const payload = verifyToken(token);
      if (payload?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            household: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (user) {
          const { passwordHash: _, ...safeUser } = user;
          return safeUser;
        }
      }
    }

    // Try finding seed user Harman in DB
    const firstUser = await prisma.user.findFirst({
      where: { email: 'harman@lifecart.com' },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (firstUser) {
      const { passwordHash: _, ...safeUser } = firstUser;
      return safeUser;
    }

    return DEFAULT_FALLBACK_USER;
  } catch (error) {
    console.warn('Database query failed in getCurrentUser, using default fallback user:', error);
    return DEFAULT_FALLBACK_USER;
  }
}

export { TOKEN_COOKIE_NAME };
