import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'admin_session';
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 43,200 seconds

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    'e9d8f2a1b7c3e4f50618293a4b5c6d7e8f90123456789abcdef0123456789abc'
  );
}

function getExpectedAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';
}

export function getAdminSecretPath(): string {
  const rawPath = process.env.ADMIN_SECRET_PATH || 'sys-portal-8f2e9d';
  return rawPath.replace(/^\/+|\/+$/g, '');
}

/**
 * Constant-time comparison of the provided password against ADMIN_PASSWORD.
 * Uses SHA-256 digests to ensure fixed 32-byte buffers and avoid timing leaks.
 */
export function verifyAdminPassword(password: string): boolean {
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }

  const expectedPassword = getExpectedAdminPassword();
  
  const actualHash = crypto.createHash('sha256').update(password).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedPassword).digest();

  return crypto.timingSafeEqual(actualHash, expectedHash);
}

interface SessionPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Generates an HMAC-SHA256 signed session token valid for 12 hours.
 */
export function createSessionToken(): string {
  const now = Date.now();
  const payload: SessionPayload = {
    role: 'admin',
    iat: now,
    exp: now + SESSION_DURATION_MS,
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(payloadEncoded)
    .digest('hex');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Verifies the validity, signature, and expiration of a session token.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
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

  const expectedSignature = crypto
    .createHmac('sha256', getSecretKey())
    .update(payloadEncoded)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return false;
  }

  const isSigValid = crypto.timingSafeEqual(sigBuffer, expectedSigBuffer);
  if (!isSigValid) {
    return false;
  }

  try {
    const decodedJson = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(decodedJson);

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

export { verifySessionTokenEdge } from './auth-edge';

