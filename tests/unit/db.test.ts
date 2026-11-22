import { describe, it, expect, beforeAll } from 'vitest';
import { db, initDb, plants, plantIssues } from '@/db';
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
});
