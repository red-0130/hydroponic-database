'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { PlantCard, type PlantWithCount, type PpmPreference } from './PlantCard';
import { PlantTable } from './PlantTable';
import { PlantDetailModal } from './PlantDetailModal';
import { LayoutGrid, Table, Layers, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', testId: 'category-all' },
  { id: 'Leafy Greens', label: 'Leafy Greens', testId: 'category-leafy-greens' },
  { id: 'Herbs', label: 'Herbs', testId: 'category-herbs' },
  { id: 'Fruiting', label: 'Fruiting', testId: 'category-fruiting' },
  { id: 'Root Vegetables', label: 'Root Vegetables', testId: 'category-root-vegetables' },
  { id: 'Brassicas', label: 'Brassicas', testId: 'category-brassicas' },
  { id: 'Other', label: 'Other', testId: 'category-other' },
] as const;

interface CropExplorerProps {
  initialPlants: PlantWithCount[];
}

export function CropExplorer({ initialPlants }: CropExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [ppmPreference, setPpmPreference] = useState<PpmPreference>('both');
  const [isPpmPressed, setIsPpmPressed] = useState<boolean>(false);
  const [quickViewPlant, setQuickViewPlant] = useState<PlantWithCount | null>(null);

  // Debounce search query by 150ms to prevent stutter during typing
  useEffect(() => {
    if (!searchQuery) {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter crops
  const filteredPlants = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim().toLowerCase();

    return initialPlants.filter((plant) => {
      // Category filter
      if (
        selectedCategory !== 'all' &&
        plant.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Search query filter (matches common name and scientific name)
      if (trimmedQuery.length > 0) {
        const matchesName = plant.name.toLowerCase().includes(trimmedQuery);
        const matchesScientific = plant.scientificName
          ? plant.scientificName.toLowerCase().includes(trimmedQuery)
          : false;

        if (!matchesName && !matchesScientific) {
          return false;
        }
      }

      return true;
    });
  }, [initialPlants, debouncedQuery, selectedCategory]);

  const handlePpmToggle = () => {
    setIsPpmPressed(true);
    setPpmPreference((prev) => {
      if (prev === 'both') return '500';
      if (prev === '500') return '700';
      return 'both';
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6">
      {/* Search & Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => {
            setSearchQuery('');
            setDebouncedQuery('');
          }}
          className="flex-1"
        />

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* PPM Scale Preference Selector */}
          <button
            type="button"
            data-testid="ppm-scale-selector"
            aria-pressed={isPpmPressed ? 'true' : 'false'}
            onClick={handlePpmToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isPpmPressed
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
            }`}
            title="Click to toggle PPM Scale preference"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              PPM: {ppmPreference === 'both' ? 'Both (500 & 700)' : ppmPreference === '500' ? 'Hanna 500' : 'Eutech 700'}
            </span>
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/50 dark:border-neutral-700">
            <button
              type="button"
              data-testid="view-grid-btn"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="view-table-btn"
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Count Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected =
              cat.id === 'all'
                ? selectedCategory === 'all'
                : selectedCategory.toLowerCase() === cat.id.toLowerCase();

            return (
              <button
                key={cat.id}
                type="button"
                data-testid={cat.testId}
                aria-label={cat.id === 'Root Vegetables' ? 'Root Crops' : cat.label}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all select-none ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Active Plant Counter */}
        <div className="shrink-0 flex items-center gap-2">
          <span
            data-testid="active-crop-count"
            className="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
          >
            Showing {filteredPlants.length} {filteredPlants.length === 1 ? 'crop' : 'crops'}
          </span>
        </div>
      </div>

      {/* Empty State vs Content */}
      {filteredPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            No crops found
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            No matching plants found for your current filter and search criteria.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              ppmPreference={ppmPreference}
              onQuickView={setQuickViewPlant}
            />
          ))}
        </div>
      ) : (
        <PlantTable
          plants={filteredPlants}
          ppmPreference={ppmPreference}
          onQuickView={setQuickViewPlant}
        />
      )}

      {/* Quick View Modal */}
      <PlantDetailModal
        plant={quickViewPlant}
        ppmPreference={ppmPreference}
        onClose={() => setQuickViewPlant(null)}
      />
    </div>
  );
}
