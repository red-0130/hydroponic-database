export const ADMIN_COOKIE_NAME = 'admin_session';

export function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    'e9d8f2a1b7c3e4f50618293a4b5c6d7e8f90123456789abcdef0123456789abc'
  );
}

interface SessionPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return atob(base64);
  } catch {
    return '';
  }
}

/**
 * Constant-time string comparison in Web Crypto environment.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies session token using standard Web Crypto API (supported in Edge and Node runtimes).
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [payloadEncoded, signature] = parts;
  if (!payloadEncoded || !signature) {
    return false;
  }

  if (typeof signature !== 'string' || signature.length !== 64 || !/^[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSecretKey()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadEncoded));
    const expectedSignature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (!constantTimeEqual(signature.toLowerCase(), expectedSignature.toLowerCase())) {
      return false;
    }

    const decodedStr = base64UrlDecode(payloadEncoded);
    if (!decodedStr) {
      return false;
    }

    const payload: SessionPayload = JSON.parse(decodedStr);

    if (payload.role !== 'admin') {
      return false;
    }

    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export const verifySessionTokenEdge = verifySessionToken;

