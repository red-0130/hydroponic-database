import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, ADMIN_COOKIE_NAME, getAdminSecretPath } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = await verifySessionToken(token);

  if (authenticated) {
    return NextResponse.json({
      authenticated: true,
      redirectUrl: `/${getAdminSecretPath()}`,
    });
  }

  return NextResponse.json({ authenticated: false });
}
