import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { seedDatabase } from '@/db/seed';
import { createSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { resetAllLoginAttempts } from '@/lib/rateLimit';

// Middleware & Robots
import { middleware } from '@/middleware';
import robots from '@/app/robots';

// Public API routes
import { GET as getPlants } from '@/app/api/plants/route';
import { GET as getPlantById } from '@/app/api/plants/[id]/route';

// Admin Auth routes
import { POST as loginPost } from '@/app/api/admin/auth/login/route';
import { POST as logoutPost } from '@/app/api/admin/auth/logout/route';
import { GET as authStatusGet } from '@/app/api/admin/auth/status/route';

// Admin Plant CRUD routes
import { GET as adminGetPlants, POST as adminCreatePlant } from '@/app/api/admin/plants/route';
import {
  GET as adminGetPlantById,
  PUT as adminUpdatePlant,
  DELETE as adminDeletePlant,
} from '@/app/api/admin/plants/[id]/route';

// Admin Issues CRUD routes
import { GET as adminGetIssues, POST as adminCreateIssue } from '@/app/api/admin/issues/route';
import {
  GET as adminGetIssueById,
  PUT as adminUpdateIssue,
  DELETE as adminDeleteIssue,
} from '@/app/api/admin/issues/[id]/route';

// Admin Upload, Seed, Export, Import routes
import { POST as adminUploadImage } from '@/app/api/admin/upload/route';
import { POST as adminSeedDb } from '@/app/api/admin/seed/route';
import { GET as adminExportData } from '@/app/api/admin/export/route';
import { POST as adminImportData } from '@/app/api/admin/import/route';

import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import path from 'path';

function createRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    token?: string;
  }
): NextRequest {
  const headers = new Headers(options?.headers || {});
  if (options?.token) {
    headers.set('cookie', `${ADMIN_COOKIE_NAME}=${options.token}`);
  }

  let requestBody: any = undefined;
  if (options?.body !== undefined) {
    if (typeof options.body === 'string' || options.body instanceof FormData) {
      requestBody = options.body;
    } else {
      headers.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(options.body);
    }
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    headers,
    body: requestBody,
  });
}

describe('Milestone 2 API & Security Integration Test Suite', () => {
  beforeAll(async () => {
    await ensureDb();
    await seedDatabase();
  });

  beforeEach(() => {
    resetAllLoginAttempts();
  });

  describe('1. Middleware & Route Protection', () => {
    it('returns 404 for direct /admin requests', async () => {
      const req = createRequest('/admin');
      const res = await middleware(req);
      expect(res.status).toBe(404);
    });

    it('returns 404 for /admin subpaths (e.g., /admin/login, /admin/dashboard)', async () => {
      const req1 = createRequest('/admin/login');
      const res1 = await middleware(req1);
      expect(res1.status).toBe(404);

      const req2 = createRequest('/admin/settings/security');
      const res2 = await middleware(req2);
      expect(res2.status).toBe(404);
    });

    it('returns 404 for direct /dashboard and subpaths', async () => {
      const req1 = createRequest('/dashboard');
      const res1 = await middleware(req1);
      expect(res1.status).toBe(404);

      const req2 = createRequest('/dashboard/analytics');
      const res2 = await middleware(req2);
      expect(res2.status).toBe(404);
    });

    it('blocks unauthenticated requests to /api/admin/* with 401', async () => {
      const req = createRequest('/api/admin/plants');
      const res = await middleware(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('blocks requests with tampered or invalid session token with 401', async () => {
      const req = createRequest('/api/admin/plants', { token: 'invalid.token.signature' });
      const res = await middleware(req);
      expect(res.status).toBe(401);
    });

    it('allows /api/admin/auth/login without authentication', async () => {
      const req = createRequest('/api/admin/auth/login', { method: 'POST' });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it('allows protected /api/admin/* requests when valid session token is provided', async () => {
      const token = createSessionToken();
      const req = createRequest('/api/admin/plants', { token });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it('allows public routes to pass through', async () => {
      const req = createRequest('/api/plants');
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe('2. Robots Metadata Configuration', () => {
    it('disallows /api/admin/ and /*portal* paths without disclosing secret admin path', () => {
      const config = robots();
      expect(config.rules).toBeDefined();
      const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      expect(rules.userAgent).toBe('*');
      expect(rules.disallow).toEqual(['/api/admin/', '/*portal*']);

      const secretPath = process.env.ADMIN_SECRET_PATH || 'sys-portal-8f2e9d';
      const disallows = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
      for (const d of disallows) {
        expect(d).not.toBe(`/${secretPath}/`);
        expect(d).not.toBe(`/${secretPath}`);
      }
    });
  });

  describe('3. Admin Authentication Endpoints', () => {
    const validPassword =
      process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';

    it('POST /api/admin/auth/login succeeds with correct password and sets cookie', async () => {
      const req = createRequest('/api/admin/auth/login', {
        method: 'POST',
        body: { password: validPassword },
      });
      const res = await loginPost(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      const cookie = res.cookies.get(ADMIN_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBeTruthy();
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.maxAge).toBe(43200);
    });

    it('POST /api/admin/auth/login rejects incorrect password with 401', async () => {
      const req = createRequest('/api/admin/auth/login', {
        method: 'POST',
        body: { password: 'wrong-password' },
      });
      const res = await loginPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Invalid password');
    });

    it('POST /api/admin/auth/login validates required fields', async () => {
      const req1 = createRequest('/api/admin/auth/login', {
        method: 'POST',
        body: {},
      });
      const res1 = await loginPost(req1);
      expect(res1.status).toBe(400);

      const req2 = createRequest('/api/admin/auth/login', {
        method: 'POST',
        body: { password: 12345 },
      });
      const res2 = await loginPost(req2);
      expect(res2.status).toBe(400);
    });

    it('POST /api/admin/auth/login enforces brute force rate limiting after 5 failures', async () => {
      const testIp = '192.168.1.100';

      for (let i = 0; i < 5; i++) {
        const req = createRequest('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'x-forwarded-for': testIp },
          body: { password: 'wrong' },
        });
        const res = await loginPost(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt should be blocked with 429
      const blockedReq = createRequest('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': testIp },
        body: { password: validPassword },
      });
      const blockedRes = await loginPost(blockedReq);
      expect(blockedRes.status).toBe(429);
      const json = await blockedRes.json();
      expect(json.error).toContain('Too many failed login attempts');
      expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
    });

    it('POST /api/admin/auth/logout clears session cookie', async () => {
      const res = await logoutPost();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const cookie = res.cookies.get(ADMIN_COOKIE_NAME);
      expect(cookie?.value).toBe('');
      expect(cookie?.maxAge).toBe(0);
    });

    it('GET /api/admin/auth/status returns false for unauthenticated user', async () => {
      const req = createRequest('/api/admin/auth/status');
      const res = await authStatusGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(false);
    });

    it('GET /api/admin/auth/status returns true for valid session', async () => {
      const token = createSessionToken();
      const req = createRequest('/api/admin/auth/status', { token });
      const res = await authStatusGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(true);
    });
  });

  describe('4. Public Plants Endpoints', () => {
    it('GET /api/plants returns all crops with issuesCount', async () => {
      const req = createRequest('/api/plants');
      const res = await getPlants(req);
      expect(res.status).toBe(200);

      const plantsList = await res.json();
      expect(Array.isArray(plantsList)).toBe(true);
      expect(plantsList.length).toBeGreaterThanOrEqual(8);

      const lettuce = plantsList.find((p: any) => p.name.includes('Lettuce'));
      expect(lettuce).toBeDefined();
      expect(typeof lettuce.issuesCount).toBe('number');
      expect(lettuce.issuesCount).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/plants filters by category', async () => {
      const req = createRequest('/api/plants?category=Herbs');
      const res = await getPlants(req);
      expect(res.status).toBe(200);

      const herbs = await res.json();
      expect(Array.isArray(herbs)).toBe(true);
      expect(herbs.length).toBeGreaterThanOrEqual(2);
      expect(herbs.every((p: any) => p.category === 'Herbs')).toBe(true);
    });

    it('GET /api/plants searches by name query substring case-insensitively', async () => {
      const req = createRequest('/api/plants?q=tOmAtO');
      const res = await getPlants(req);
      expect(res.status).toBe(200);

      const results = await res.json();
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toContain('Tomato');
    });

    it('GET /api/plants searches by scientificName substring', async () => {
      const req = createRequest('/api/plants?q=Ocimum');
      const res = await getPlants(req);
      expect(res.status).toBe(200);

      const results = await res.json();
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].scientificName).toContain('Ocimum');
    });

    it('GET /api/plants/[id] returns plant detail with attached issues', async () => {
      const req = createRequest('/api/plants/crop-lettuce');
      const res = await getPlantById(req, {
        params: Promise.resolve({ id: 'crop-lettuce' }),
      });
      expect(res.status).toBe(200);

      const plant = await res.json();
      expect(plant.id).toBe('crop-lettuce');
      expect(plant.name).toContain('Lettuce');
      expect(Array.isArray(plant.issues)).toBe(true);
      expect(plant.issues.length).toBeGreaterThanOrEqual(1);
      expect(plant.issues[0].title).toBeDefined();
      expect(plant.issues[0].causeDescription).toBeDefined();
      expect(plant.issues[0].resolutionDescription).toBeDefined();
    });

    it('GET /api/plants/[id] returns 404 for nonexistent plant', async () => {
      const req = createRequest('/api/plants/crop-nonexistent-999');
      const res = await getPlantById(req, {
        params: Promise.resolve({ id: 'crop-nonexistent-999' }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Plant not found');
    });
  });

  describe('5. Admin Plant CRUD Operations', () => {
    let createdPlantId = '';

    it('POST /api/admin/plants creates plant with automatic nutrient calculation', async () => {
      const newPlantPayload = {
        name: 'Arugula Rocket',
        scientificName: 'Eruca vesicaria',
        category: 'Leafy Greens',
        phMin: 6.0,
        phMax: 6.8,
        ecMin: 1.2,
        ecMax: 1.8,
        tempMinC: 15,
        tempMaxC: 22,
        lightRequirement: '14 - 18 hours/day',
        growthTips: 'Fast growing, harvest outer leaves regularly.',
      };

      const req = createRequest('/api/admin/plants', {
        method: 'POST',
        body: newPlantPayload,
      });

      const res = await adminCreatePlant(req);
      expect(res.status).toBe(201);

      const created = await res.json();
      expect(created.id).toBeDefined();
      createdPlantId = created.id;

      expect(created.name).toBe('Arugula Rocket');
      expect(created.cfMin).toBe(12); // 1.2 * 10
      expect(created.cfMax).toBe(18); // 1.8 * 10
      expect(created.ppm500Min).toBe(600); // 1.2 * 500
      expect(created.ppm500Max).toBe(900); // 1.8 * 500
      expect(created.ppm700Min).toBe(840); // 1.2 * 700
      expect(created.ppm700Max).toBe(1260); // 1.8 * 700
      expect(created.isCustomCalculations).toBe(false);
    });

    it('POST /api/admin/plants creates plant with custom calculations when flag is true', async () => {
      const customPlantPayload = {
        name: 'Custom Swiss Chard',
        category: 'Leafy Greens',
        phMin: 6.2,
        phMax: 7.0,
        ecMin: 1.8,
        ecMax: 2.3,
        cfMin: 20, // overridden custom value
        cfMax: 25,
        ppm500Min: 950,
        ppm500Max: 1200,
        ppm700Min: 1300,
        ppm700Max: 1650,
        isCustomCalculations: true,
      };

      const req = createRequest('/api/admin/plants', {
        method: 'POST',
        body: customPlantPayload,
      });

      const res = await adminCreatePlant(req);
      expect(res.status).toBe(201);

      const created = await res.json();
      expect(created.cfMin).toBe(20);
      expect(created.ppm500Min).toBe(950);
      expect(created.isCustomCalculations).toBe(true);

      // Clean up
      await db.delete(plants).where(eq(plants.id, created.id));
    });

    it('POST /api/admin/plants rejects invalid plant schema (inverted pH)', async () => {
      const req = createRequest('/api/admin/plants', {
        method: 'POST',
        body: {
          name: 'Invalid Plant',
          category: 'Herbs',
          phMin: 7.0,
          phMax: 6.0, // inverted
          ecMin: 1.0,
          ecMax: 1.5,
        },
      });

      const res = await adminCreatePlant(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Validation failed');
    });

    it('PUT /api/admin/plants/[id] updates plant and recalculates metrics', async () => {
      expect(createdPlantId).toBeTruthy();

      const updatePayload = {
        name: 'Arugula Rocket (Updated)',
        ecMin: 1.5,
        ecMax: 2.0,
      };

      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: updatePayload,
      });

      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(200);

      const updated = await res.json();
      expect(updated.name).toBe('Arugula Rocket (Updated)');
      expect(updated.ecMin).toBe(1.5);
      expect(updated.ecMax).toBe(2.0);
      expect(updated.cfMin).toBe(15);
      expect(updated.cfMax).toBe(20);
      expect(updated.ppm500Min).toBe(750);
      expect(updated.ppm500Max).toBe(1000);
    });

    it('PUT /api/admin/plants/[id] rejects partial updates that invert phMin > existing phMax', async () => {
      expect(createdPlantId).toBeTruthy();

      // existing: phMin: 6.0, phMax: 6.8
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: { phMin: 7.5 },
      });
      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('phMin cannot be greater than phMax');
    });

    it('PUT /api/admin/plants/[id] rejects partial updates that invert existing phMin > phMax', async () => {
      expect(createdPlantId).toBeTruthy();

      // existing: phMin: 6.0, phMax: 6.8
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: { phMax: 5.5 },
      });
      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('phMin cannot be greater than phMax');
    });

    it('PUT /api/admin/plants/[id] rejects partial updates that invert ecMin > existing ecMax', async () => {
      expect(createdPlantId).toBeTruthy();

      // existing: ecMin: 1.5, ecMax: 2.0
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: { ecMin: 3.0 },
      });
      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('ecMin cannot be greater than ecMax');
    });

    it('PUT /api/admin/plants/[id] rejects partial updates that invert existing ecMin > ecMax', async () => {
      expect(createdPlantId).toBeTruthy();

      // existing: ecMin: 1.5, ecMax: 2.0
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: { ecMax: 1.0 },
      });
      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('ecMin cannot be greater than ecMax');
    });

    it('PUT /api/admin/plants/[id] rejects partial updates that invert temperature range', async () => {
      expect(createdPlantId).toBeTruthy();

      // existing: tempMinC: 15, tempMaxC: 22
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: { tempMinC: 30 },
      });
      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('tempMinC cannot be greater than tempMaxC');
    });

    it('PUT /api/admin/plants/[id] accepts valid partial update to ecMin and recalculates all metrics with effective ecMax', async () => {
      expect(createdPlantId).toBeTruthy();

      // existing: ecMin: 1.5, ecMax: 2.0
      // Update only ecMin to 1.8
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'PUT',
        body: { ecMin: 1.8 },
      });
      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(200);

      const updated = await res.json();
      expect(updated.ecMin).toBe(1.8);
      expect(updated.ecMax).toBe(2.0); // preserved existing
      expect(updated.cfMin).toBe(18); // 1.8 * 10
      expect(updated.cfMax).toBe(20); // 2.0 * 10
      expect(updated.ppm500Min).toBe(900); // 1.8 * 500
      expect(updated.ppm500Max).toBe(1000); // 2.0 * 500
      expect(updated.ppm700Min).toBe(1260); // 1.8 * 700
      expect(updated.ppm700Max).toBe(1400); // 2.0 * 700
    });

    it('PUT /api/admin/plants/[id] returns 404 for nonexistent plant', async () => {
      const req = createRequest('/api/admin/plants/nonexistent-id', {
        method: 'PUT',
        body: { name: 'Does Not Exist' },
      });

      const res = await adminUpdatePlant(req, {
        params: Promise.resolve({ id: 'nonexistent-id' }),
      });
      expect(res.status).toBe(404);
    });

    it('DELETE /api/admin/plants/[id] removes plant', async () => {
      const req = createRequest(`/api/admin/plants/${createdPlantId}`, {
        method: 'DELETE',
      });

      const res = await adminDeletePlant(req, {
        params: Promise.resolve({ id: createdPlantId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const plantInDb = await db
        .select()
        .from(plants)
        .where(eq(plants.id, createdPlantId))
        .get();
      expect(plantInDb).toBeUndefined();
    });
  });

  describe('6. Admin Common Issues CRUD & Cascade Deletion', () => {
    let testPlantId = '';
    let testIssueId = '';

    beforeAll(async () => {
      // Create a dedicated plant to attach issues to
      const res = await adminCreatePlant(
        createRequest('/api/admin/plants', {
          method: 'POST',
          body: {
            name: 'Cascade Test Kale',
            category: 'Brassicas',
            phMin: 6.0,
            phMax: 6.5,
            ecMin: 1.5,
            ecMax: 2.0,
          },
        })
      );
      const plant = await res.json();
      testPlantId = plant.id;
    });

    it('POST /api/admin/issues creates issue for existing plant', async () => {
      const issuePayload = {
        plantId: testPlantId,
        title: 'Aphids Attack',
        causeDescription: 'High humidity and warm greenhouse temperatures',
        resolutionDescription: 'Introduce predatory wasps or spray insecticidal soap',
        imageUrl: '/images/aphids.jpg',
      };

      const req = createRequest('/api/admin/issues', {
        method: 'POST',
        body: issuePayload,
      });

      const res = await adminCreateIssue(req);
      expect(res.status).toBe(201);

      const issue = await res.json();
      expect(issue.id).toBeDefined();
      testIssueId = issue.id;
      expect(issue.plantId).toBe(testPlantId);
      expect(issue.title).toBe('Aphids Attack');
    });

    it('POST /api/admin/issues rejects invalid plantId', async () => {
      const req = createRequest('/api/admin/issues', {
        method: 'POST',
        body: {
          plantId: 'nonexistent-plant-id',
          title: 'Root Rot',
          causeDescription: 'Pythium fungus',
          resolutionDescription: 'Add hydrogen peroxide',
        },
      });

      const res = await adminCreateIssue(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain('Referenced plant not found');
    });

    it('PUT /api/admin/issues/[id] updates issue content', async () => {
      const req = createRequest(`/api/admin/issues/${testIssueId}`, {
        method: 'PUT',
        body: {
          title: 'Severe Aphids Attack',
          resolutionDescription: 'Wash with neem oil and apply beneficial insects.',
        },
      });

      const res = await adminUpdateIssue(req, {
        params: Promise.resolve({ id: testIssueId }),
      });
      expect(res.status).toBe(200);

      const updated = await res.json();
      expect(updated.title).toBe('Severe Aphids Attack');
      expect(updated.resolutionDescription).toContain('neem oil');
    });

    it('DELETE /api/admin/plants cascades and deletes attached issues', async () => {
      // Confirm issue exists in database
      const issueBefore = await db
        .select()
        .from(plantIssues)
        .where(eq(plantIssues.id, testIssueId))
        .get();
      expect(issueBefore).toBeDefined();

      // Delete parent plant
      const req = createRequest(`/api/admin/plants/${testPlantId}`, {
        method: 'DELETE',
      });
      const res = await adminDeletePlant(req, {
        params: Promise.resolve({ id: testPlantId }),
      });
      expect(res.status).toBe(200);

      // Verify issue was cascade deleted
      const issueAfter = await db
        .select()
        .from(plantIssues)
        .where(eq(plantIssues.id, testIssueId))
        .get();
      expect(issueAfter).toBeUndefined();
    });
  });

  describe('7. Admin Image Upload Endpoint', () => {
    let uploadedFileUrl = '';

    it('POST /api/admin/upload rejects missing file', async () => {
      const formData = new FormData();
      const req = createRequest('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const res = await adminUploadImage(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('No file provided');
    });

    it('POST /api/admin/upload rejects invalid MIME types (e.g. text/plain)', async () => {
      const formData = new FormData();
      const blob = new Blob(['sample text content'], { type: 'text/plain' });
      formData.append('file', blob, 'sample.txt');

      const req = createRequest('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const res = await adminUploadImage(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid file type');
    });

    it('POST /api/admin/upload accepts valid PNG/JPEG and stores to public/uploads', async () => {
      const formData = new FormData();
      const dummyPngData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG magic bytes
      const blob = new Blob([dummyPngData], { type: 'image/png' });
      formData.append('file', blob, 'test-leaf.png');

      const req = createRequest('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const res = await adminUploadImage(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
      uploadedFileUrl = json.url;

      // Clean up uploaded test file
      const diskPath = path.join(process.cwd(), 'public', uploadedFileUrl);
      await unlink(diskPath).catch(() => {});
    });
  });

  describe('8. Admin Bulk Data, Export, Import & Seed Endpoints', () => {
    it('POST /api/admin/seed is disabled and returns 404', async () => {
      const res = await adminSeedDb();
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('GET /api/admin/export returns JSON dataset with attached issues by default', async () => {
      const req = createRequest('/api/admin/export');
      const res = await adminExportData(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(8);
      expect(data[0].issues).toBeDefined();
    });

    it('GET /api/admin/export?format=csv returns CSV formatted content', async () => {
      const req = createRequest('/api/admin/export?format=csv');
      const res = await adminExportData(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/csv');

      const csv = await res.text();
      expect(csv).toContain('id,name,scientificName,category,phMin,phMax');
      expect(csv).toContain('Lettuce');
      expect(csv).toContain('Basil');
    });

    it('POST /api/admin/import validates data in previewOnly mode', async () => {
      const importPayload = {
        previewOnly: true,
        data: [
          {
            name: 'Butterhead Lettuce',
            category: 'Leafy Greens',
            phMin: 5.8,
            phMax: 6.5,
            ecMin: 1.0,
            ecMax: 1.4,
          },
        ],
      };

      const req = createRequest('/api/admin/import', {
        method: 'POST',
        body: importPayload,
      });

      const res = await adminImportData(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.count).toBe(1);
      expect(json.sample.length).toBe(1);
      expect(json.sample[0].name).toBe('Butterhead Lettuce');
      expect(json.sample[0].cfMin).toBe(10); // Auto-calculated!
    });

    it('POST /api/admin/import rejects invalid dataset in preview', async () => {
      const badPayload = {
        previewOnly: true,
        data: [
          {
            name: '', // Empty name invalid
            category: 'InvalidCategory',
            phMin: 8.0,
            phMax: 6.0,
            ecMin: 1.0,
            ecMax: 2.0,
          },
        ],
      };

      const req = createRequest('/api/admin/import', {
        method: 'POST',
        body: badPayload,
      });

      const res = await adminImportData(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.valid).toBe(false);
      expect(json.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/admin/import commits data and issues to the database', async () => {
      const importPayload = {
        previewOnly: false,
        data: [
          {
            name: 'Hydro Mint Special',
            category: 'Herbs',
            phMin: 5.5,
            phMax: 6.5,
            ecMin: 1.2,
            ecMax: 2.0,
            issues: [
              {
                title: 'Powdery Mildew',
                causeDescription: 'Poor air circulation in dense canopy',
                resolutionDescription: 'Prune old runners and improve fan circulation',
              },
            ],
          },
        ],
      };

      const req = createRequest('/api/admin/import', {
        method: 'POST',
        body: importPayload,
      });

      const res = await adminImportData(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.imported).toBe(1);

      // Verify plant and issue exist in DB
      const importedPlant = await db
        .select()
        .from(plants)
        .where(eq(plants.name, 'Hydro Mint Special'))
        .get();
      expect(importedPlant).toBeDefined();

      if (importedPlant) {
        const issues = await db
          .select()
          .from(plantIssues)
          .where(eq(plantIssues.plantId, importedPlant.id));
        expect(issues.length).toBe(1);
        expect(issues[0].title).toBe('Powdery Mildew');

        // Cleanup
        await db.delete(plants).where(eq(plants.id, importedPlant.id));
      }
    });

    it('POST /api/admin/import parses and commits CSV data', async () => {
      const csvData = [
        'name,category,phMin,phMax,ecMin,ecMax',
        'Watercress,Leafy Greens,6.5,6.8,0.4,1.8',
      ].join('\n');

      const req = createRequest('/api/admin/import', {
        method: 'POST',
        body: {
          csv: csvData,
          previewOnly: false,
        },
      });

      const res = await adminImportData(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.imported).toBe(1);

      const watercress = await db
        .select()
        .from(plants)
        .where(eq(plants.name, 'Watercress'))
        .get();
      expect(watercress).toBeDefined();
      expect(watercress?.cfMin).toBe(4);

      if (watercress) {
        await db.delete(plants).where(eq(plants.id, watercress.id));
      }
    });

    it('POST /api/admin/import handles multiline quoted growthTips in CSV without fracturing rows', async () => {
      const multilineCsv = [
        'name,category,phMin,phMax,ecMin,ecMax,growthTips',
        '"Multiline Lettuce",Leafy Greens,5.5,6.5,1.0,1.5,"Tip 1: Water in morning.\nTip 2: Keep cool.\nTip 3: Harvest outer leaves."',
        '"Multiline Basil",Herbs,5.8,6.8,1.2,1.8,"Warmth loving.\nPrune regularly."',
      ].join('\n');

      const req = createRequest('/api/admin/import', {
        method: 'POST',
        body: {
          csv: multilineCsv,
          previewOnly: true,
        },
      });

      const res = await adminImportData(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.count).toBe(2);
      expect(json.sample.length).toBe(2);
      expect(json.sample[0].name).toBe('Multiline Lettuce');
      expect(json.sample[0].growthTips).toBe('Tip 1: Water in morning.\nTip 2: Keep cool.\nTip 3: Harvest outer leaves.');
      expect(json.sample[1].name).toBe('Multiline Basil');
      expect(json.sample[1].growthTips).toBe('Warmth loving.\nPrune regularly.');
    });

    it('round-trips multiline growthTips and issues via GET /api/admin/export and POST /api/admin/import', async () => {
      // 1. Create a plant with multiline tips
      const createRes = await adminCreatePlant(
        createRequest('/api/admin/plants', {
          method: 'POST',
          body: {
            name: 'RoundTrip Hydro Plant',
            category: 'Leafy Greens',
            phMin: 5.8,
            phMax: 6.4,
            ecMin: 1.2,
            ecMax: 1.6,
            growthTips: 'Line 1: High light\nLine 2: Sensitive to tip-burn\nLine 3: Keep reservoir aerated',
          },
        })
      );
      expect(createRes.status).toBe(201);
      const created = await createRes.json();

      // 2. Export all data to CSV
      const exportReq = createRequest('/api/admin/export?format=csv');
      const exportRes = await adminExportData(exportReq);
      expect(exportRes.status).toBe(200);
      const csvData = await exportRes.text();

      // Verify the exported CSV contains the multiline string enclosed in quotes
      expect(csvData).toContain('RoundTrip Hydro Plant');
      expect(csvData).toContain('"Line 1: High light\nLine 2: Sensitive to tip-burn\nLine 3: Keep reservoir aerated"');

      // 3. Re-import the exported CSV in preview mode
      const importReq = createRequest('/api/admin/import', {
        method: 'POST',
        body: {
          csv: csvData,
          previewOnly: true,
        },
      });
      const importRes = await adminImportData(importReq);
      expect(importRes.status).toBe(200);
      const importJson = await importRes.json();
      expect(importJson.valid).toBe(true);
      // Ensure all rows were parsed as intact plants (count should be at least 9)
      expect(importJson.count).toBeGreaterThanOrEqual(9);

      // Clean up test plant
      await db.delete(plants).where(eq(plants.id, created.id));
    });
  });
});
