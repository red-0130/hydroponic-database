import { describe, it, expect, beforeEach } from 'vitest';
import { POST as loginPost } from '@/app/api/admin/auth/login/route';
import { resetAllLoginAttempts } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import {
  verifyAdminPassword,
  createSessionToken,
  verifySessionToken,
  getAdminSecretPath,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';

describe('Authentication & Security', () => {
  describe('Password Verification (timing-safe)', () => {
    it('verifies the correct admin password successfully', () => {
      const correctPassword =
        process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';
      expect(verifyAdminPassword(correctPassword)).toBe(true);
    });

    it('rejects incorrect passwords', () => {
      expect(verifyAdminPassword('wrong_password')).toBe(false);
      expect(verifyAdminPassword('admin_hydroponics_secure_pass_2025')).toBe(false);
      expect(verifyAdminPassword('ADMIN_HYDROPONICS_SECURE_PASS_2026')).toBe(false);
    });

    it('rejects empty or invalid passwords', () => {
      expect(verifyAdminPassword('')).toBe(false);
      // @ts-expect-error testing invalid type
      expect(verifyAdminPassword(null)).toBe(false);
      // @ts-expect-error testing invalid type
      expect(verifyAdminPassword(undefined)).toBe(false);
    });
  });

  describe('Admin Secret Path Configuration', () => {
    it('returns the secret path from env or default', () => {
      const path = getAdminSecretPath();
      expect(path).toBe('sys-portal-8f2e9d');
      expect(path.startsWith('/')).toBe(false);
      expect(path.endsWith('/')).toBe(false);
    });

    it('provides a normalized secret path suitable for secret footer navigation', () => {
      const path = getAdminSecretPath();
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
      expect(path).not.toMatch(/^\//);
      expect(path).not.toMatch(/\/$/);
      expect(`/${path}`).toBe('/sys-portal-8f2e9d');
    });
  });

  describe('Session Token Generation & Verification', () => {
    it('creates a signed token that successfully verifies', () => {
      const token = createSessionToken();
      expect(typeof token).toBe('string');
      expect(token.includes('.')).toBe(true);

      const isValid = verifySessionToken(token);
      expect(isValid).toBe(true);
    });

    it('rejects null, undefined, or malformed tokens', () => {
      expect(verifySessionToken(null)).toBe(false);
      expect(verifySessionToken(undefined)).toBe(false);
      expect(verifySessionToken('')).toBe(false);
      expect(verifySessionToken('single-string-without-dot')).toBe(false);
      expect(verifySessionToken('a.b.c')).toBe(false);
    });

    it('rejects tokens with tampered payloads', () => {
      const token = createSessionToken();
      const [payload, sig] = token.split('.');

      // Tamper with payload
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      decoded.role = 'superadmin';
      const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64url');

      const tamperedToken = `${tamperedPayload}.${sig}`;
      expect(verifySessionToken(tamperedToken)).toBe(false);
    });

    it('rejects tokens with tampered signatures', () => {
      const token = createSessionToken();
      const [payload, sig] = token.split('.');

      // Alter signature
      const tamperedSig = sig.slice(0, -2) + (sig.endsWith('0') ? '1' : '0');
      const tamperedToken = `${payload}.${tamperedSig}`;
      expect(verifySessionToken(tamperedToken)).toBe(false);
    });

    it('rejects tokens with extra characters appended to signature', () => {
      const token = createSessionToken();
      const [payload, sig] = token.split('.');

      const tamperedToken = `${payload}.${sig}a`;
      expect(verifySessionToken(tamperedToken)).toBe(false);

      const truncatedToken = `${payload}.${sig.slice(0, 63)}`;
      expect(verifySessionToken(truncatedToken)).toBe(false);

      const invalidCharsToken = `${payload}.${sig.slice(0, 63)}z`;
      expect(verifySessionToken(invalidCharsToken)).toBe(false);
    });

    it('rejects expired tokens', () => {
      const secret =
        process.env.ADMIN_SESSION_SECRET ||
        'e9d8f2a1b7c3e4f50618293a4b5c6d7e8f90123456789abcdef0123456789abc';

      const expiredPayload = {
        role: 'admin',
        iat: Date.now() - 24 * 60 * 60 * 1000,
        exp: Date.now() - 1000, // expired 1s ago
      };

      const payloadEncoded = Buffer.from(JSON.stringify(expiredPayload)).toString(
        'base64url'
      );
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadEncoded)
        .digest('hex');

      const expiredToken = `${payloadEncoded}.${signature}`;
      expect(verifySessionToken(expiredToken)).toBe(false);
    });

    it('has the expected admin cookie name', () => {
      expect(ADMIN_COOKIE_NAME).toBe('admin_session');
    });
  });

  describe('Login Rate Limiting & Brute-Force Protection', () => {
    beforeEach(() => {
      resetAllLoginAttempts();
    });

    it('rejects attempt 6 with status 429 and Retry-After header after 5 failed attempts', async () => {
      const testIp = '192.168.1.200';

      for (let i = 0; i < 5; i++) {
        const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': testIp,
          },
          body: JSON.stringify({ password: 'wrong-password' }),
        });
        const res = await loginPost(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt should trigger 429 with Retry-After header
      const blockedReq = new NextRequest('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({ password: 'any-password' }),
      });
      const blockedRes = await loginPost(blockedReq);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
      const json = await blockedRes.json();
      expect(json.error).toContain('Too many failed login attempts');
    });
  });
});
