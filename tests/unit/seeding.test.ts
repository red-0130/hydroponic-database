import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db, initDb, ensureDb, plants, plantIssues } from '@/db';
import { seedIfEmpty, seedDatabase } from '@/db/seed';
import { count, eq } from 'drizzle-orm';

describe('Fresh Deployment & Startup Database Seeding', () => {
  beforeEach(async () => {
    await initDb();
  });

  afterAll(async () => {
    // Restore clean standard seed dataset after all tests run
    await db.delete(plantIssues);
    await db.delete(plants);
    await seedIfEmpty();
  });

  it('a) startup seeding on an empty SQLite database populates all 8 plants and 13 issues', async () => {
    // 1. Wipe database to simulate fresh/empty deployment
    await db.delete(plantIssues);
    await db.delete(plants);

    const [countBefore] = await db.select({ count: count() }).from(plants);
    expect(Number(countBefore?.count ?? 0)).toBe(0);

    // 2. Execute startup seeding
    const result = await seedIfEmpty();

    // 3. Verify return values
    expect(result.seeded).toBe(true);
    expect(result.plantsCount).toBe(8);
    expect(result.issuesCount).toBe(13);

    // 4. Verify plant records in database
    const allPlants = await db.select().from(plants).all();
    expect(allPlants.length).toBe(8);

    const plantNames = allPlants.map((p) => p.name);
    expect(plantNames).toContain('Lettuce (Head/Bibb)');
    expect(plantNames).toContain('Basil (Sweet Genovese)');
    expect(plantNames).toContain('Spinach');
    expect(plantNames).toContain('Tomato (Fruiting)');
    expect(plantNames).toContain('Bell Pepper');
    expect(plantNames).toContain('Strawberry');
    expect(plantNames).toContain('Cucumber');
    expect(plantNames).toContain('Mint (Spearmint)');

    // Verify all seeded plants have imageUrl as null
    for (const plant of allPlants) {
      expect(plant.imageUrl).toBeNull();
    }

    // 5. Verify issues in database
    const allIssues = await db.select().from(plantIssues).all();
    expect(allIssues.length).toBe(13);

    // Verify foreign key relations and null imageUrl
    for (const issue of allIssues) {
      expect(issue.plantId).toBeTruthy();
      expect(issue.imageUrl).toBeNull();
      expect(plantNames.some(() => allPlants.some((p) => p.id === issue.plantId))).toBe(true);
    }
  });

  it('b) startup seeding on an already populated database is a strict no-op', async () => {
    // Ensure standard 8 crops are present first
    const [existingCount] = await db.select({ count: count() }).from(plants);
    if (Number(existingCount?.count ?? 0) === 0) {
      await seedIfEmpty();
    }

    // 1. Insert a custom user plant
    const customPlantId = 'custom-crop-dragonfruit';
    const customPlant = {
      id: customPlantId,
      name: 'Custom Dragonfruit (Pitaya)',
      scientificName: 'Selenicereus undatus',
      category: 'Fruiting' as const,
      phMin: 5.8,
      phMax: 6.8,
      ecMin: 1.4,
      ecMax: 2.2,
      cfMin: 14,
      cfMax: 22,
      ppm500Min: 700,
      ppm500Max: 1100,
      ppm700Min: 980,
      ppm700Max: 1540,
      isCustomCalculations: false,
      tempMinC: 18,
      tempMaxC: 32,
      lightRequirement: '12 - 16 hours/day',
      growthTips: 'Requires heavy trellis support and moderate feeding.',
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(plants).values(customPlant);

    // 2. Modify an existing standard crop (customize Lettuce)
    const modifiedName = 'Hydroponic Butterhead Lettuce (Modified)';
    const modifiedPhMin = 5.9;
    await db
      .update(plants)
      .set({
        name: modifiedName,
        phMin: modifiedPhMin,
        updatedAt: new Date(),
      })
      .where(eq(plants.id, 'crop-lettuce'));

    const [countBeforeSeed] = await db.select({ count: count() }).from(plants);
    const expectedCount = Number(countBeforeSeed?.count ?? 0);
    expect(expectedCount).toBe(9); // 8 standard + 1 custom

    // 3. Trigger startup seeding again on the populated database
    const noopResult = await seedIfEmpty();

    // 4. Verify no-op response
    expect(noopResult.seeded).toBe(false);
    expect(noopResult.plantsCount).toBe(expectedCount);
    expect(noopResult.issuesCount).toBe(0);

    // 5. Verify custom plant was untouched (NOT deleted or overwritten)
    const fetchedCustom = await db
      .select()
      .from(plants)
      .where(eq(plants.id, customPlantId))
      .get();
    expect(fetchedCustom).toBeDefined();
    expect(fetchedCustom?.name).toBe('Custom Dragonfruit (Pitaya)');
    expect(fetchedCustom?.ecMin).toBe(1.4);

    // 6. Verify modified standard crop was untouched (NOT reverted to seed defaults)
    const fetchedLettuce = await db
      .select()
      .from(plants)
      .where(eq(plants.id, 'crop-lettuce'))
      .get();
    expect(fetchedLettuce).toBeDefined();
    expect(fetchedLettuce?.name).toBe(modifiedName);
    expect(fetchedLettuce?.phMin).toBe(modifiedPhMin);

    // 7. Verify no duplicate records created
    const [countAfterSeed] = await db.select({ count: count() }).from(plants);
    expect(Number(countAfterSeed?.count ?? 0)).toBe(9);

    const [issuesCountAfterSeed] = await db.select({ count: count() }).from(plantIssues);
    expect(Number(issuesCountAfterSeed?.count ?? 0)).toBe(13);

    // 8. Clean up custom plant and revert lettuce for subsequent tests
    await db.delete(plants).where(eq(plants.id, customPlantId));
  });

  it('c) repeated or concurrent calls to ensureDb() or seedIfEmpty() are strictly idempotent', async () => {
    // Run multiple calls concurrently
    const [result1, result2, ensureResult1, ensureResult2] = await Promise.all([
      seedIfEmpty(),
      seedIfEmpty(),
      ensureDb(),
      ensureDb(),
    ]);

    // Since database is populated, seedIfEmpty should report seeded: false
    expect(result1.seeded).toBe(false);
    expect(result2.seeded).toBe(false);
    expect(result1.plantsCount).toBeGreaterThanOrEqual(8);
    expect(result2.plantsCount).toBe(result1.plantsCount);

    // ensureDb should resolve without error
    expect(ensureResult1).toBeUndefined();
    expect(ensureResult2).toBeUndefined();

    // Ensure backwards-compatible seedDatabase() alias works identical to seedIfEmpty()
    const aliasResult = await seedDatabase();
    expect(aliasResult.seeded).toBe(false);
    expect(aliasResult.plantsCount).toBe(result1.plantsCount);
    expect(aliasResult.issuesCount).toBe(0);
  });
});
