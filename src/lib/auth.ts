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

export const DEFAULT_FALLBACK_USER = {
  id: 'demo-user-id-1',
  name: 'Alex Morgan',
  email: 'alex@lifecart.com',
  role: 'SYSTEM_ADMIN',
  avatarUrl: null,
  householdId: 'demo-household-id-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  household: {
    id: 'demo-household-id-1',
    name: 'Morgan Household',
    inviteCode: 'CART-892X',
    createdById: 'demo-user-id-1',
    currency: 'EUR',
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: 'member-1',
        userId: 'demo-user-id-1',
        householdId: 'demo-household-id-1',
        role: 'ADMIN',
        joinedAt: new Date(),
        user: { id: 'demo-user-id-1', name: 'Alex Morgan', email: 'alex@lifecart.com', avatarUrl: null },
      },
      {
        id: 'member-2',
        userId: 'demo-user-id-2',
        householdId: 'demo-household-id-1',
        role: 'MEMBER',
        joinedAt: new Date(),
        user: { id: 'demo-user-id-2', name: 'Sam Taylor', email: 'sam@lifecart.com', avatarUrl: null },
      },
    ],
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

    // Try finding seed user Alex Morgan in DB
    const firstUser = await prisma.user.findFirst({
      where: { email: 'alex@lifecart.com' },
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
