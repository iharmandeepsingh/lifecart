import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    if (cleanPassword(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: 'USER',
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      householdId: user.householdId,
    });

    const response = NextResponse.json({
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email, householdId: user.householdId },
    });

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration API Error Details:', error?.stack || error);
    return NextResponse.json({ 
      error: error?.message || 'Internal server error during registration.' 
    }, { status: 500 });
  }
}

function cleanPassword(pass: any): string {
  return typeof pass === 'string' ? pass : '';
}
