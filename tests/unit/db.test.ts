import { describe, it, expect, beforeAll, vi } from 'vitest';
import { db, initDb, ensureDb, resetDbInitPromise, client, plants, plantIssues } from '@/db';
import { seedDatabase } from '@/db/seed';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('Database Schema, Relations & Seeding', () => {
  beforeAll(async () => {
    await initDb();
    await seedDatabase();
  });

  it('contains the 8 reference crops in the database', async () => {
    const allPlants = await db.select().from(plants).all();
    expect(allPlants.length).toBeGreaterThanOrEqual(8);

    const names = allPlants.map((p) => p.name);
    expect(names).toContain('Lettuce (Head/Bibb)');
    expect(names).toContain('Basil (Sweet Genovese)');
    expect(names).toContain('Spinach');
    expect(names).toContain('Tomato (Fruiting)');
    expect(names).toContain('Bell Pepper');
    expect(names).toContain('Strawberry');
    expect(names).toContain('Cucumber');
    expect(names).toContain('Mint (Spearmint)');
  });

  it('loads crop nutrient values accurately from the database', async () => {
    const tomato = await db
      .select()
      .from(plants)
      .where(eq(plants.id, 'crop-tomato'))
      .get();

    expect(tomato).toBeDefined();
    expect(tomato?.phMin).toBe(5.8);
    expect(tomato?.phMax).toBe(6.5);
    expect(tomato?.ecMin).toBe(2.0);
    expect(tomato?.ecMax).toBe(3.5);
    expect(tomato?.cfMin).toBe(20);
    expect(tomato?.cfMax).toBe(35);
    expect(tomato?.ppm500Min).toBe(1000);
    expect(tomato?.ppm500Max).toBe(1750);
    expect(tomato?.ppm700Min).toBe(1400);
    expect(tomato?.ppm700Max).toBe(2450);
    expect(tomato?.lightRequirement).toBe('14 - 18 hours/day (25 - 30 DLI)');
  });

  it('associates issues with plants and cascades deletions', async () => {
    const testPlantId = `temp-test-plant-${nanoid()}`;
    const testIssueId = `temp-test-issue-${nanoid()}`;
    const now = new Date();

    // Insert test plant
    await db.insert(plants).values({
      id: testPlantId,
      name: 'Temporary Test Crop',
      category: 'Other',
      phMin: 6.0,
      phMax: 6.5,
      ecMin: 1.5,
      ecMax: 2.0,
      cfMin: 15,
      cfMax: 20,
      ppm500Min: 750,
      ppm500Max: 1000,
      ppm700Min: 1050,
      ppm700Max: 1400,
      isCustomCalculations: false,
      createdAt: now,
      updatedAt: now,
    });

    // Insert test issue referencing the test plant
    await db.insert(plantIssues).values({
      id: testIssueId,
      plantId: testPlantId,
      title: 'Test Aphid Infestation',
      causeDescription: 'Greenhouse door left open',
      resolutionDescription: 'Introduce predatory mites and insecticidal soap',
      createdAt: now,
      updatedAt: now,
    });

    // Verify issue was inserted
    const fetchedIssue = await db
      .select()
      .from(plantIssues)
      .where(eq(plantIssues.id, testIssueId))
      .get();
    expect(fetchedIssue).toBeDefined();
    expect(fetchedIssue?.title).toBe('Test Aphid Infestation');

    // Delete the test plant
    await db.delete(plants).where(eq(plants.id, testPlantId));

    // Verify cascade deletion of associated issue
    const remainingIssue = await db
      .select()
      .from(plantIssues)
      .where(eq(plantIssues.id, testIssueId))
      .get();
    expect(remainingIssue).toBeUndefined();
  });

  describe('Startup failure resilience & retry (Issue 6)', () => {
    it('resets dbInitPromise and retries after transient startup failure', async () => {
      resetDbInitPromise();

      let shouldFail = true;
      const originalExecute = client.execute.bind(client);
      const executeSpy = vi.spyOn(client, 'execute').mockImplementation(async (stmt) => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('Simulated transient SQLite startup failure');
        }
        return originalExecute(stmt);
      });

      try {
        // First attempt fails due to simulated transient error
        await expect(ensureDb()).rejects.toThrow('Simulated transient SQLite startup failure');

        // Second attempt retries because dbInitPromise was cleared, and succeeds
        await expect(ensureDb()).resolves.toBeUndefined();
      } finally {
        executeSpy.mockRestore();
        resetDbInitPromise();
      }
    });

    it('handles concurrent callers during transient failure and allows subsequent recovery', async () => {
      resetDbInitPromise();

      let failureCount = 0;
      const originalExecute = client.execute.bind(client);
      const executeSpy = vi.spyOn(client, 'execute').mockImplementation(async (stmt) => {
        if (failureCount < 1) {
          failureCount++;
          throw new Error('Simulated concurrent transient failure');
        }
        return originalExecute(stmt);
      });

      try {
        // Concurrent callers share the initial failing promise
        const [res1, res2] = await Promise.allSettled([ensureDb(), ensureDb()]);
        expect(res1.status).toBe('rejected');
        expect(res2.status).toBe('rejected');
        if (res1.status === 'rejected') {
          expect(res1.reason?.message).toBe('Simulated concurrent transient failure');
        }
        if (res2.status === 'rejected') {
          expect(res2.reason?.message).toBe('Simulated concurrent transient failure');
        }

        // After failure, next call retries and succeeds
        await expect(ensureDb()).resolves.toBeUndefined();
      } finally {
        executeSpy.mockRestore();
        resetDbInitPromise();
      }
    });
  });
});
