import { db, initDb, plants, plantIssues } from './index';
import { SEED_CROPS } from './seedData';
import { eq, notInArray } from 'drizzle-orm';

export async function seedDatabase() {
  await initDb();

  const now = new Date();
  let totalIssuesCount = 0;

  // Purge any plants not in standard seed crops
  const seedIds = SEED_CROPS.map((c) => c.id);
  await db.delete(plants).where(notInArray(plants.id, seedIds));

  for (const crop of SEED_CROPS) {
    const { issues, ...plantData } = crop;

    const existingPlant = await db
      .select({ id: plants.id })
      .from(plants)
      .where(eq(plants.id, crop.id))
      .get();

    if (existingPlant) {
      await db
        .update(plants)
        .set({
          ...plantData,
          updatedAt: now,
        })
        .where(eq(plants.id, crop.id));

      await db.delete(plantIssues).where(eq(plantIssues.plantId, crop.id));
    } else {
      await db.insert(plants).values({
        ...plantData,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (issues && issues.length > 0) {
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        await db.insert(plantIssues).values({
          id: `${crop.id}-issue-${i + 1}`,
          plantId: crop.id,
          title: issue.title,
          causeDescription: issue.causeDescription,
          resolutionDescription: issue.resolutionDescription,
          imageUrl: issue.imageUrl,
          createdAt: now,
          updatedAt: now,
        });
        totalIssuesCount++;
      }
    }
  }

  console.log(`Seeding complete: ${SEED_CROPS.length} plants and ${totalIssuesCount} issues.`);
  return { plantsCount: SEED_CROPS.length, issuesCount: totalIssuesCount };
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
    .then(() => {
      console.log('Seed script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script failed:', err);
      process.exit(1);
    });
}
