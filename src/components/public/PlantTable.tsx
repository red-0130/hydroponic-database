'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, ArrowRight, Eye } from 'lucide-react';
import type { PlantWithCount, PpmPreference } from './PlantCard';

interface PlantTableProps {
  plants: PlantWithCount[];
  ppmPreference?: PpmPreference;
  onQuickView?: (plant: PlantWithCount) => void;
}

type SortField = 'name' | 'category' | 'phMin' | 'ecMin' | 'cfMin' | 'ppm500Min' | 'ppm700Min';
type SortOrder = 'asc' | 'desc';

export function PlantTable({
  plants,
  ppmPreference = 'both',
  onQuickView,
}: PlantTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      let valA: string | number = a[sortField] ?? '';
      let valB: string | number = b[sortField] ?? '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : (valB as string).localeCompare(valA);
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [plants, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <table
        data-testid="plant-table"
        className="w-full text-left border-collapse text-sm"
      >
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300">
            <th
              scope="col"
              onClick={() => handleSort('name')}
              className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Crop Name</span>
                {renderSortIcon('name')}
              </div>
            </th>

            <th
              scope="col"
              onClick={() => handleSort('category')}
              className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Category</span>
                {renderSortIcon('category')}
              </div>
            </th>

            <th
              scope="col"
              onClick={() => handleSort('phMin')}
              className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>pH Target</span>
                {renderSortIcon('phMin')}
              </div>
            </th>

            <th
              scope="col"
              onClick={() => handleSort('ecMin')}
              className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>EC (mS/cm)</span>
                {renderSortIcon('ecMin')}
              </div>
            </th>

            <th
              scope="col"
              onClick={() => handleSort('cfMin')}
              className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors hidden md:table-cell"
            >
              <div className="flex items-center gap-1.5">
                <span>cF</span>
                {renderSortIcon('cfMin')}
              </div>
            </th>

            {(ppmPreference === '500' || ppmPreference === 'both') && (
              <th
                scope="col"
                onClick={() => handleSort('ppm500Min')}
                className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>PPM 500 (Hanna)</span>
                  {renderSortIcon('ppm500Min')}
                </div>
              </th>
            )}

            {(ppmPreference === '700' || ppmPreference === 'both') && (
              <th
                scope="col"
                onClick={() => handleSort('ppm700Min')}
                className="group px-4 py-3.5 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>PPM 700 (Eutech)</span>
                  {renderSortIcon('ppm700Min')}
                </div>
              </th>
            )}

            <th
              scope="col"
              className="px-4 py-3.5 font-semibold hidden lg:table-cell"
            >
              Light Requirement
            </th>

            <th scope="col" className="px-4 py-3.5 font-semibold text-right">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {sortedPlants.map((plant) => (
            <tr
              key={plant.id}
              data-testid="plant-table-row"
              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              {/* Crop Name */}
              <td className="px-4 py-3.5">
                <div>
                  <Link
                    href={`/plants/${plant.id}`}
                    className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                  >
                    {plant.name}
                  </Link>
                  {plant.scientificName && (
                    <div className="text-xs italic text-neutral-400 dark:text-neutral-500">
                      {plant.scientificName}
                    </div>
                  )}
                </div>
              </td>

              {/* Category */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  {plant.category}
                </span>
              </td>

              {/* pH Range */}
              <td className="px-4 py-3.5 whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400">
                {plant.phMin.toFixed(1)} - {plant.phMax.toFixed(1)}
              </td>

              {/* EC Range */}
              <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                {plant.ecMin.toFixed(1)} - {plant.ecMax.toFixed(1)}
              </td>

              {/* cF Range */}
              <td className="px-4 py-3.5 whitespace-nowrap text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                {plant.cfMin} - {plant.cfMax}
              </td>

              {/* PPM 500 */}
              {(ppmPreference === '500' || ppmPreference === 'both') && (
                <td className="px-4 py-3.5 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                  {plant.ppm500Min} - {plant.ppm500Max}
                </td>
              )}

              {/* PPM 700 */}
              {(ppmPreference === '700' || ppmPreference === 'both') && (
                <td className="px-4 py-3.5 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                  {plant.ppm700Min} - {plant.ppm700Max}
                </td>
              )}

              {/* Light Requirement */}
              <td className="px-4 py-3.5 text-xs text-neutral-600 dark:text-neutral-400 hidden lg:table-cell max-w-xs truncate">
                {plant.lightRequirement}
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  {onQuickView && (
                    <button
                      type="button"
                      onClick={() => onQuickView(plant)}
                      title="Quick Preview"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <Link
                    href={`/plants/${plant.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
