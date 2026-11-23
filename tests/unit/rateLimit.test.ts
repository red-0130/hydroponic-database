import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  resetAllLoginAttempts,
  getClientIp,
  getLoginAttemptsCount,
  MAX_ATTEMPTS,
  WINDOW_MS,
  MAX_MAP_SIZE,
} from '@/lib/rateLimit';

describe('Login Rate Limiter (Issue 3 Fix)', () => {
  beforeEach(() => {
    resetAllLoginAttempts();
    delete process.env.TRUST_PROXY;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic rate limiting & lockout', () => {
    it('allows initial attempts and decrements remaining', () => {
      const ip = '10.0.0.1';
      expect(checkLoginRateLimit(ip)).toEqual({ allowed: true, remaining: MAX_ATTEMPTS });

      recordFailedLogin(ip);
      expect(checkLoginRateLimit(ip)).toEqual({ allowed: true, remaining: 4 });

      for (let i = 0; i < 3; i++) {
        recordFailedLogin(ip);
      }
      expect(checkLoginRateLimit(ip)).toEqual({ allowed: true, remaining: 1 });

      recordFailedLogin(ip); // 5th failure
      const blocked = checkLoginRateLimit(ip);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(WINDOW_MS / 1000);
    });

    it('resets attempts for a single IP', () => {
      const ip = '10.0.0.2';
      recordFailedLogin(ip);
      expect(checkLoginRateLimit(ip).remaining).toBe(4);
      resetLoginAttempts(ip);
      expect(checkLoginRateLimit(ip).remaining).toBe(MAX_ATTEMPTS);
    });
  });

  describe('Memory leak fix: Expired records cleanup', () => {
    it('deletes expired record from Map when checkLoginRateLimit is called after window expires', () => {
      vi.useFakeTimers();
      const ip = '10.0.0.3';

      recordFailedLogin(ip);
      expect(getLoginAttemptsCount()).toBe(1);

      // Advance time past the 15-minute window
      vi.advanceTimersByTime(WINDOW_MS + 1000);

      const status = checkLoginRateLimit(ip);
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(MAX_ATTEMPTS);
      // Record must have been deleted from map, freeing memory
      expect(getLoginAttemptsCount()).toBe(0);
    });

    it('resets record and starts fresh window when recordFailedLogin is called after expiration', () => {
      vi.useFakeTimers();
      const ip = '10.0.0.4';

      recordFailedLogin(ip);
      recordFailedLogin(ip);
      expect(checkLoginRateLimit(ip).remaining).toBe(3);

      // Advance past window
      vi.advanceTimersByTime(WINDOW_MS + 1000);

      // New failed login should start count at 1 instead of 3
      recordFailedLogin(ip);
      expect(checkLoginRateLimit(ip).remaining).toBe(4);
    });
  });

  describe('Capacity bounding & FIFO eviction', () => {
    it('prunes expired entries when Map reaches capacity', () => {
      vi.useFakeTimers();

      // Seed MAX_MAP_SIZE records that expire
      for (let i = 0; i < MAX_MAP_SIZE; i++) {
        recordFailedLogin(`expired-${i}`);
      }
      expect(getLoginAttemptsCount()).toBe(MAX_MAP_SIZE);

      // Expire all of them
      vi.advanceTimersByTime(WINDOW_MS + 1000);

      // Next failed login triggers capacity check and prunes expired records
      recordFailedLogin('fresh-ip');
      // All expired entries should be pruned, leaving only fresh-ip
      expect(getLoginAttemptsCount()).toBe(1);
      expect(checkLoginRateLimit('fresh-ip').remaining).toBe(4);
    });

    it('strictly caps Map size at MAX_MAP_SIZE without unbounded growth', () => {
      // Simulate mass influx exceeding MAX_MAP_SIZE
      const testLimit = MAX_MAP_SIZE + 50;
      for (let i = 0; i < testLimit; i++) {
        recordFailedLogin(`ip-${i}`);
      }

      expect(getLoginAttemptsCount()).toBeLessThanOrEqual(MAX_MAP_SIZE);
      expect(getLoginAttemptsCount()).toBe(MAX_MAP_SIZE);
    });
  });

  describe('IP Spoofing protection (getClientIp)', () => {
    it('ignores client-supplied X-Forwarded-For when TRUST_PROXY is false (default)', () => {
      const headers = new Headers({
        'x-forwarded-for': '203.0.113.195, 198.51.100.1',
      });

      // Default (no env or false)
      expect(getClientIp(headers)).toBe('127.0.0.1');
      expect(getClientIp(headers, false)).toBe('127.0.0.1');
    });

    it('ignores client-supplied X-Real-IP when TRUST_PROXY is false (default)', () => {
      const headers = new Headers({
        'x-real-ip': '203.0.113.195',
      });

      expect(getClientIp(headers)).toBe('127.0.0.1');
      expect(getClientIp(headers, false)).toBe('127.0.0.1');
    });

    it('correctly parses X-Forwarded-For when TRUST_PROXY is true', () => {
      const headers = new Headers({
        'x-forwarded-for': '203.0.113.195, 198.51.100.1',
      });

      expect(getClientIp(headers, true)).toBe('203.0.113.195');

      process.env.TRUST_PROXY = 'true';
      expect(getClientIp(headers)).toBe('203.0.113.195');

      process.env.TRUST_PROXY = '1';
      expect(getClientIp(headers)).toBe('203.0.113.195');
    });

    it('falls back to X-Real-IP when TRUST_PROXY is true and X-Forwarded-For is absent', () => {
      const headers = new Headers({
        'x-real-ip': '198.51.100.42',
      });

      expect(getClientIp(headers, true)).toBe('198.51.100.42');
    });

    it('falls back to 127.0.0.1 when TRUST_PROXY is true but headers are missing', () => {
      const headers = new Headers();
      expect(getClientIp(headers, true)).toBe('127.0.0.1');
    });
  });
});
