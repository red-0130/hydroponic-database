import crypto from 'crypto';
import {
  ADMIN_COOKIE_NAME,
  getSecretKey,
  verifySessionToken,
  verifySessionTokenEdge,
} from './auth-edge';

export {
  ADMIN_COOKIE_NAME,
  verifySessionToken,
  verifySessionTokenEdge,
};

export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 43,200 seconds

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


