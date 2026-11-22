import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createSessionToken,
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  getClientIp,
} from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rateLimit = checkLoginRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds ?? 900),
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || !('password' in body)) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const { password } = body as { password: unknown };
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Password must be a string' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      recordFailedLogin(ip);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Reset failed attempts on success
    resetLoginAttempts(ip);

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
