import { db, initDb, plants, plantIssues } from './index';
import { SEED_CROPS } from './seedData';
import { count } from 'drizzle-orm';

/**
 * Seeds the database only if uninitialized or currently contains zero plant records.
 * If records already exist, leaves all existing data intact without modifying or re-seeding.
 */
export async function seedIfEmpty(
  targetDb = db,
  targetInitDb = initDb
): Promise<{
  seeded: boolean;
  plantsCount: number;
  issuesCount: number;
}> {
  await targetInitDb();

  const [countResult] = await targetDb.select({ count: count() }).from(plants);
  const existingCount = Number(countResult?.count ?? 0);

  if (existingCount > 0) {
    return {
      seeded: false,
      plantsCount: existingCount,
      issuesCount: 0,
    };
  }

  const now = new Date();
  let totalIssuesCount = 0;

  const runSeed = async (tx: any) => {
    for (const crop of SEED_CROPS) {
      const { issues, ...plantData } = crop;

      await tx
        .insert(plants)
        .values({
          ...plantData,
          imageUrl: plantData.imageUrl ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      if (issues && issues.length > 0) {
        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          await tx
            .insert(plantIssues)
            .values({
              id: `${crop.id}-issue-${i + 1}`,
              plantId: crop.id,
              title: issue.title,
              causeDescription: issue.causeDescription,
              resolutionDescription: issue.resolutionDescription,
              imageUrl: issue.imageUrl ?? null,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoNothing();
          totalIssuesCount++;
        }
      }
    }
  };

  if (typeof (targetDb as any).transaction === 'function') {
    await (targetDb as any).transaction(runSeed);
  } else {
    await runSeed(targetDb);
  }

  console.log(`Seeding complete: ${SEED_CROPS.length} plants and ${totalIssuesCount} issues.`);
  return {
    seeded: true,
    plantsCount: SEED_CROPS.length,
    issuesCount: totalIssuesCount,
  };
}

/**
 * Backwards-compatible alias for seedIfEmpty.
 */
export async function seedDatabase(
  targetDb = db,
  targetInitDb = initDb
): Promise<{
  seeded: boolean;
  plantsCount: number;
  issuesCount: number;
}> {
  return seedIfEmpty(targetDb, targetInitDb);
}

// Check if run directly
const isDirectRun = Boolean(
  import.meta.main ||
    (process.argv[1] &&
      (process.argv[1].endsWith('/src/db/seed.ts') ||
        process.argv[1].endsWith('/src/db/seed.js') ||
        process.argv[1] === 'src/db/seed.ts' ||
        process.argv[1] === 'src/db/seed.js'))
);

if (isDirectRun) {
  seedDatabase()
    .then((res) => {
      console.log(`Seed script finished successfully. Seeded: ${res.seeded}, plants: ${res.plantsCount}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script failed:', err);
      process.exit(1);
    });
}
