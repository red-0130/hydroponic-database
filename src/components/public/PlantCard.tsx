'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Thermometer, Droplets, ArrowRight, AlertTriangle, Eye } from 'lucide-react';
import { celsiusToFahrenheit } from '@/lib/calculations';
import type { Plant } from '@/db/schema';

export type PpmPreference = '500' | '700' | 'both';

export interface PlantWithCount extends Plant {
  issuesCount?: number;
}

interface PlantCardProps {
  plant: PlantWithCount;
  ppmPreference?: PpmPreference;
  onQuickView?: (plant: PlantWithCount) => void;
}

export function PlantCard({
  plant,
  ppmPreference = 'both',
  onQuickView,
}: PlantCardProps) {
  // pH percentage for meter (0 to 14 scale)
  const phLeft = Math.max(0, Math.min(100, (plant.phMin / 14) * 100));
  const phRight = Math.max(0, Math.min(100, (plant.phMax / 14) * 100));
  const phWidth = Math.max(4, phRight - phLeft);

  const tempFMin = plant.tempMinC !== null ? celsiusToFahrenheit(plant.tempMinC) : null;
  const tempFMax = plant.tempMaxC !== null ? celsiusToFahrenheit(plant.tempMaxC) : null;

  return (
    <article
      data-testid="plant-card"
      className="plant-card group relative flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Crop Image Header */}
      <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {plant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plant.imageUrl}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if broken image
              (e.target as HTMLImageElement).src = '/images/lettuce.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-700/30 text-emerald-600 dark:text-emerald-400">
            <Droplets className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        {/* Category Pill Overlay */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-neutral-900/95 text-emerald-800 dark:text-emerald-300 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 backdrop-blur-xs">
            {plant.category}
          </span>
        </div>

        {/* Issues Count Badge (if any) */}
        {typeof plant.issuesCount === 'number' && plant.issuesCount > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-white shadow-sm backdrop-blur-xs">
              <AlertTriangle className="w-3 h-3" />
              {plant.issuesCount} {plant.issuesCount === 1 ? 'issue' : 'issues'}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Name & Botanical Info */}
        <div className="mb-3">
          <Link
            href={`/plants/${plant.id}`}
            className="text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1"
          >
            {plant.name}
          </Link>
          {plant.scientificName && (
            <p className="text-xs italic text-neutral-500 dark:text-neutral-400 line-clamp-1">
              {plant.scientificName}
            </p>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="space-y-3 mb-4">
          {/* pH Range & Visual Meter Bar */}
          <div
            data-metric="ph"
            className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                pH Range
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {plant.phMin.toFixed(1)} - {plant.phMax.toFixed(1)}
              </span>
            </div>
            {/* pH meter track */}
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden">
              <div
                className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{
                  left: `${phLeft}%`,
                  width: `${phWidth}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
              <span>0 (Acidic)</span>
              <span>7 (Neutral)</span>
              <span>14 (Alkaline)</span>
            </div>
          </div>

          {/* EC Range */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              data-metric="ec"
              className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800"
            >
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">EC Range</div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">
                {plant.ecMin.toFixed(1)} - {plant.ecMax.toFixed(1)} <span className="text-[10px] font-normal text-neutral-400">mS/cm</span>
              </div>
            </div>

            <div
              data-metric="cf"
              className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800"
            >
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">cF Range</div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">
                {plant.cfMin} - {plant.cfMax} <span className="text-[10px] font-normal text-neutral-400">cF</span>
              </div>
            </div>
          </div>

          {/* PPM Metrics (Filtered by preference) */}
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {(ppmPreference === '500' || ppmPreference === 'both') && (
              <div
                data-metric="ppm500"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/40"
              >
                <span className="text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                  PPM 500 (Hanna)
                </span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  {plant.ppm500Min} - {plant.ppm500Max} PPM
                </span>
              </div>
            )}

            {(ppmPreference === '700' || ppmPreference === 'both') && (
              <div
                data-metric="ppm700"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100/60 dark:border-teal-900/40"
              >
                <span className="text-teal-800 dark:text-teal-300 font-medium text-[11px]">
                  PPM 700 (Eutech)
                </span>
                <span className="font-bold text-teal-900 dark:text-teal-200">
                  {plant.ppm700Min} - {plant.ppm700Max} PPM
                </span>
              </div>
            )}
          </div>

          {/* Environmental Badges (Light & Temp) */}
          <div className="space-y-1.5 pt-1 text-xs">
            {plant.lightRequirement && (
              <div
                data-metric="light"
                className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{plant.lightRequirement}</span>
              </div>
            )}

            {plant.tempMinC !== null && plant.tempMaxC !== null && (
              <div
                data-metric="temp"
                className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"
              >
                <Thermometer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  {plant.tempMinC}°C - {plant.tempMaxC}°C ({tempFMin}°F - {tempFMax}°F)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(plant)}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Quick View
            </button>
          )}

          <Link
            href={`/plants/${plant.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 ml-auto transition-colors"
          >
            <span>View Full Guide</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
