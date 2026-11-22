import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { eq, asc } from 'drizzle-orm';
import { celsiusToFahrenheit } from '@/lib/calculations';
import { UnitConverter } from '@/components/public/UnitConverter';
import {
  ArrowLeft,
  Sun,
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PlantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlantDetailPage({ params }: PlantDetailPageProps) {
  await ensureDb();
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const plant = await db
    .select()
    .from(plants)
    .where(eq(plants.id, id))
    .get();

  if (!plant) {
    notFound();
  }

  const issues = await db
    .select()
    .from(plantIssues)
    .where(eq(plantIssues.plantId, id))
    .orderBy(asc(plantIssues.createdAt));

  const tempFMin = plant.tempMinC !== null ? celsiusToFahrenheit(plant.tempMinC) : null;
  const tempFMax = plant.tempMaxC !== null ? celsiusToFahrenheit(plant.tempMaxC) : null;

  // Visual pH meter percentage (0-14 scale)
  const phLeft = Math.max(0, Math.min(100, (plant.phMin / 14) * 100));
  const phRight = Math.max(0, Math.min(100, (plant.phMax / 14) * 100));
  const phWidth = Math.max(4, phRight - phLeft);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            data-testid="back-to-directory-link"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Crop Directory</span>
          </Link>

          <div className="flex items-center gap-3">
            <UnitConverter buttonText="Unit Converter" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Botanical Profile Hero */}
        <section className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Crop Photo */}
            <div className="md:col-span-5 relative h-64 md:h-full min-h-[260px] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              {plant.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600/20 to-teal-800/30 text-emerald-600 dark:text-emerald-400">
                  <Droplets className="w-16 h-16 stroke-[1.5]" />
                </div>
              )}

              <div className="absolute top-4 left-4">
                <span
                  data-testid="plant-detail-category"
                  className="category-badge px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 dark:bg-neutral-900/95 text-emerald-800 dark:text-emerald-300 shadow-md backdrop-blur-xs border border-neutral-200/50 dark:border-neutral-700/50"
                >
                  {plant.category}
                </span>
              </div>
            </div>

            {/* Title & Quick Summary */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Hydroponic Botanical Profile
                </span>
                <h1
                  data-testid="plant-detail-name"
                  className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100"
                >
                  {plant.name}
                </h1>
                {plant.scientificName && (
                  <p className="mt-1 text-sm sm:text-base italic text-neutral-500 dark:text-neutral-400">
                    {plant.scientificName}
                  </p>
                )}
              </div>

              {/* Environmental Overview Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Light / Photoperiod */}
                <div
                  data-testid="metric-light"
                  data-metric="light"
                  className="metric-light p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                      Light Requirement
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {plant.lightRequirement}
                    </span>
                  </div>
                </div>

                {/* Temperature */}
                <div
                  data-testid="metric-temp"
                  data-metric="temp"
                  className="metric-temp p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                      Optimal Temperature
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {plant.tempMinC !== null && plant.tempMaxC !== null ? (
                        <>
                          {plant.tempMinC}°C - {plant.tempMaxC}°C ({tempFMin}°F - {tempFMax}°F)
                        </>
                      ) : (
                        'Standard ambient'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Target Nutrient Metrics Grid */}
        <section aria-labelledby="nutrients-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2
              id="nutrients-heading"
              className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
            >
              Hydroponic Nutrient Target Metrics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* pH Range Card */}
            <div
              data-testid="metric-ph"
              data-metric="ph"
              className="metric-ph p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Target pH Range
                </span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {plant.phMin.toFixed(1)} - {plant.phMax.toFixed(1)}
                </div>
              </div>

              {/* Visual pH meter */}
              <div>
                <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{
                      left: `${phLeft}%`,
                      width: `${phWidth}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>0 (Acidic)</span>
                  <span>7 (Neutral)</span>
                  <span>14 (Alkaline)</span>
                </div>
              </div>
            </div>

            {/* Electrical Conductivity (EC) */}
            <div
              data-testid="metric-ec"
              data-metric="ec"
              className="metric-ec p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Electrical Conductivity (EC)
                </span>
                <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
                  {plant.ecMin.toFixed(1)} - {plant.ecMax.toFixed(1)}{' '}
                  <span className="text-sm font-semibold text-neutral-400">mS/cm</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Fundamental nutrient salt concentration in the reservoir solution.
              </p>
            </div>

            {/* Conductivity Factor (cF) */}
            <div
              data-testid="metric-cf"
              data-metric="cf"
              className="metric-cf p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Conductivity Factor (cF)
                </span>
                <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
                  {plant.cfMin} - {plant.cfMax}{' '}
                  <span className="text-sm font-semibold text-neutral-400">cF</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Standard formula: cF = EC × 10
              </p>
            </div>

            {/* PPM Scales (Hanna 500 & Eutech 700) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-3">
              <div
                data-testid="metric-ppm500"
                data-metric="ppm500"
                className="metric-ppm500"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  PPM 500 (Hanna / US Standard)
                </span>
                <div className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                  {plant.ppm500Min} - {plant.ppm500Max}{' '}
                  <span className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">PPM</span>
                </div>
              </div>

              <div
                data-testid="metric-ppm700"
                data-metric="ppm700"
                className="metric-ppm700 pt-2 border-t border-neutral-100 dark:border-neutral-800"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  PPM 700 (Eutech / UK Standard)
                </span>
                <div className="text-lg font-black text-teal-950 dark:text-teal-200">
                  {plant.ppm700Min} - {plant.ppm700Max}{' '}
                  <span className="text-xs font-medium text-teal-700/80 dark:text-teal-300/80">PPM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Practical Growth Tips Panel */}
        {plant.growthTips && (
          <section
            data-testid="metric-growth-tips"
            className="growth-tips rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/40 p-6 sm:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  Practical Hydroponic Growth &amp; Nutrient Tips
                </div>
                <p className="text-sm leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
                  {plant.growthTips}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Common Growing Issues Section */}
        <section aria-labelledby="issues-heading" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="issues-heading"
                  className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
                >
                  Common Growing Issues &amp; Troubleshooting
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Nutrient deficiencies, physiological disorders, and preventative measures
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {issues.length} {issues.length === 1 ? 'issue documented' : 'issues documented'}
            </span>
          </div>

          {issues.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No Common Issues Documented
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                No severe physiological or pest disorders currently reported for this crop under standard conditions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  data-testid="issue-card"
                  className="issue-card flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
                >
                  {/* Issue Image / Visual Symptom Container */}
                  <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    {issue.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        data-testid="issue-image"
                        src={issue.imageUrl}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        data-testid="issue-image"
                        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/10 to-red-500/10 text-amber-600 dark:text-amber-400"
                      >
                        <AlertTriangle className="w-10 h-10 mb-2 stroke-[1.5]" />
                        <span className="text-xs font-medium text-neutral-500">
                          Diagnostic Symptom Guide
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Issue Body */}
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <h3
                      data-testid="issue-title"
                      className="issue-title text-lg font-bold text-neutral-900 dark:text-neutral-100"
                    >
                      {issue.title}
                    </h3>

                    {/* Cause */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Probable Cause
                      </span>
                      <p
                        data-testid="issue-cause"
                        className="issue-cause text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed"
                      >
                        {issue.causeDescription}
                      </p>
                    </div>

                    {/* Resolution */}
                    <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Recommended Resolution
                      </span>
                      <p
                        data-testid="issue-resolution"
                        className="issue-resolution text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed"
                      >
                        {issue.resolutionDescription}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
