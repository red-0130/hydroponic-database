'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, ArrowRight, Sun, Thermometer, Droplets, ShieldAlert } from 'lucide-react';
import { celsiusToFahrenheit } from '@/lib/calculations';
import type { PlantWithCount, PpmPreference } from './PlantCard';

interface PlantDetailModalProps {
  plant: PlantWithCount | null;
  ppmPreference?: PpmPreference;
  onClose: () => void;
}

export function PlantDetailModal({
  plant,
  ppmPreference = 'both',
  onClose,
}: PlantDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!plant || !mounted) return null;

  const tempFMin = plant.tempMinC !== null ? celsiusToFahrenheit(plant.tempMinC) : null;
  const tempFMax = plant.tempMaxC !== null ? celsiusToFahrenheit(plant.tempMaxC) : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-plant-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative h-44 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          {plant.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/lettuce.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-950/20 text-emerald-500">
              <Droplets className="w-12 h-12" />
            </div>
          )}

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-neutral-900/95 text-emerald-800 dark:text-emerald-300 shadow-sm">
              {plant.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[calc(80vh-11rem)] overflow-y-auto">
          <div>
            <h2
              id="modal-plant-name"
              className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
            >
              {plant.name}
            </h2>
            {plant.scientificName && (
              <p className="text-sm italic text-neutral-500 dark:text-neutral-400">
                {plant.scientificName}
              </p>
            )}
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
              <div className="text-xs text-neutral-500">pH Target</div>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                {plant.phMin.toFixed(1)} - {plant.phMax.toFixed(1)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
              <div className="text-xs text-neutral-500">EC (mS/cm)</div>
              <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {plant.ecMin.toFixed(1)} - {plant.ecMax.toFixed(1)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
              <div className="text-xs text-neutral-500">cF Range</div>
              <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {plant.cfMin} - {plant.cfMax}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
              <div className="text-xs text-neutral-500">
                {ppmPreference === '700' ? 'PPM 700' : 'PPM 500'}
              </div>
              <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {ppmPreference === '700'
                  ? `${plant.ppm700Min} - ${plant.ppm700Max}`
                  : `${plant.ppm500Min} - ${plant.ppm500Max}`}
              </div>
            </div>
          </div>

          {/* Environment */}
          <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            {plant.lightRequirement && (
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong className="font-semibold">Photoperiod:</strong> {plant.lightRequirement}
                </span>
              </div>
            )}

            {plant.tempMinC !== null && plant.tempMaxC !== null && (
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong className="font-semibold">Temperature:</strong> {plant.tempMinC}°C - {plant.tempMaxC}°C ({tempFMin}°F - {tempFMax}°F)
                </span>
              </div>
            )}

            {typeof plant.issuesCount === 'number' && (
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong className="font-semibold">Growing Issues:</strong>{' '}
                  {plant.issuesCount > 0 ? `${plant.issuesCount} documented issue(s)` : 'No reported issues'}
                </span>
              </div>
            )}
          </div>

          {/* Growth Tips */}
          {plant.growthTips && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200">
              <strong className="font-semibold block mb-1">Growth Tips:</strong>
              {plant.growthTips}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
          <Link
            href={`/plants/${plant.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <span>Open Dedicated Detail Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
