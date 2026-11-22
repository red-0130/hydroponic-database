import React from 'react';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { eq, sql, asc } from 'drizzle-orm';
import { CropExplorer } from '@/components/public/CropExplorer';
import { UnitConverter } from '@/components/public/UnitConverter';
import { Sprout, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await ensureDb();

  const allPlants = await db
    .select({
      id: plants.id,
      name: plants.name,
      scientificName: plants.scientificName,
      category: plants.category,
      phMin: plants.phMin,
      phMax: plants.phMax,
      ecMin: plants.ecMin,
      ecMax: plants.ecMax,
      cfMin: plants.cfMin,
      cfMax: plants.cfMax,
      ppm500Min: plants.ppm500Min,
      ppm500Max: plants.ppm500Max,
      ppm700Min: plants.ppm700Min,
      ppm700Max: plants.ppm700Max,
      isCustomCalculations: plants.isCustomCalculations,
      tempMinC: plants.tempMinC,
      tempMaxC: plants.tempMaxC,
      lightRequirement: plants.lightRequirement,
      growthTips: plants.growthTips,
      imageUrl: plants.imageUrl,
      createdAt: plants.createdAt,
      updatedAt: plants.updatedAt,
      issuesCount: sql<number>`count(${plantIssues.id})`.mapWith(Number),
    })
    .from(plants)
    .leftJoin(plantIssues, eq(plants.id, plantIssues.plantId))
    .groupBy(plants.id)
    .orderBy(asc(plants.name));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Navigation / App Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Sprout className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                Hydroponic Database
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:block">
                Commercial and hobbyist nutrient reference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UnitConverter buttonText="Quick Unit Converter" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 sm:p-10 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
              <Database className="w-3.5 h-3.5" />
              Verified Commercial Hydroponic Targets
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Precision Crop Nutrients & Environment Profile
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Explore optimal pH targets, electrical conductivity (EC), PPM conversions across Hanna &amp; Eutech scales, photoperiod requirements, and diagnostic guides for common deficiencies.
            </p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        </section>

        {/* Explorer Section */}
        <section aria-label="Crop explorer">
          <CropExplorer initialPlants={allPlants} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          <p>© 2026 Hydroponic Database System. All rights reserved.</p>
          <p>
            Formulas: cF = EC × 10 | PPM 500 = EC × 500 (Hanna) | PPM 700 = EC × 700 (Eutech)
          </p>
        </div>
      </footer>
    </div>
  );
}
