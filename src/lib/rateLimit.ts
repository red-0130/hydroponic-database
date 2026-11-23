interface AttemptRecord {
  count: number;
  resetAt: number;
}

// shortcut: In-memory Map suitable for single container; upgrade to Redis/KV if multi-instance cluster is deployed.
const loginAttempts = new Map<string, AttemptRecord>();
export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_MAP_SIZE = 5000;

function pruneExpired(now: number): void {
  for (const [key, record] of loginAttempts.entries()) {
    if (now > record.resetAt) {
      loginAttempts.delete(key);
    }
  }
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (now > record.resetAt) {
    loginAttempts.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    if (loginAttempts.size >= MAX_MAP_SIZE) {
      pruneExpired(now);
      while (loginAttempts.size >= MAX_MAP_SIZE) {
        const oldest = loginAttempts.keys().next().value;
        if (!oldest) break;
        loginAttempts.delete(oldest);
      }
    }

    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
  } else {
    record.count += 1;
  }
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function resetAllLoginAttempts(): void {
  loginAttempts.clear();
}

export function getLoginAttemptsCount(): number {
  return loginAttempts.size;
}

export function getClientIp(
  headers: Headers,
  trustProxy: boolean = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1'
): string {
  if (trustProxy) {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  }
  return '127.0.0.1';
}
