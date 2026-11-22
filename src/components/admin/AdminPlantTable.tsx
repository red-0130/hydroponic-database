'use client';

import React from 'react';
import { Pencil, Trash2, AlertTriangle, Layers, Sprout } from 'lucide-react';
import type { PlantRecord } from './PlantFormModal';

interface AdminPlantTableProps {
  plants: PlantRecord[];
  onEdit: (plant: PlantRecord) => void;
  onDelete: (plant: PlantRecord) => void;
  onManageIssues: (plant: PlantRecord) => void;
}

export default function AdminPlantTable({
  plants,
  onEdit,
  onDelete,
  onManageIssues,
}: AdminPlantTableProps) {
  if (plants.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
        <Sprout className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No crops found</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          No crops matched your current filter or the database is empty. Click &ldquo;Add Crop&rdquo; or &ldquo;Seed Database&rdquo; above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-800/80 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider border-b border-neutral-800">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Crop &amp; Botanical Profile
              </th>
              <th scope="col" className="px-4 py-3.5">
                Category
              </th>
              <th scope="col" className="px-4 py-3.5">
                pH Range
              </th>
              <th scope="col" className="px-4 py-3.5">
                EC (mS/cm)
              </th>
              <th scope="col" className="px-4 py-3.5">
                Derived PPM (500)
              </th>
              <th scope="col" className="px-4 py-3.5">
                Issues
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {plants.map((plant) => (
              <tr
                key={plant.id}
                data-testid="admin-plant-row"
                className="hover:bg-neutral-800/40 transition group"
              >
                {/* Crop Name & Scientific Name */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {plant.imageUrl ? (
                      <img
                        src={plant.imageUrl}
                        alt={plant.name}
                        className="w-10 h-10 rounded-xl object-cover bg-neutral-800 border border-neutral-700/60 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <Sprout className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-white text-sm block">
                        {plant.name}
                      </span>
                      {plant.scientificName && (
                        <span className="text-[11px] text-neutral-400 italic block">
                          {plant.scientificName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category Badge */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {plant.category}
                  </span>
                </td>

                {/* pH Range */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-semibold text-neutral-200">
                    {plant.phMin.toFixed(1)} - {plant.phMax.toFixed(1)}
                  </span>
                </td>

                {/* EC Range */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-semibold text-emerald-400">
                    {plant.ecMin.toFixed(1)} - {plant.ecMax.toFixed(1)}
                  </span>
                </td>

                {/* PPM (500) */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-neutral-300">
                    {plant.ppm500Min} - {plant.ppm500Max}
                  </span>
                  {plant.isCustomCalculations && (
                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      custom
                    </span>
                  )}
                </td>

                {/* Issues Count */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onManageIssues(plant)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition border border-neutral-700"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{plant.issuesCount ?? 0}</span>
                  </button>
                </td>

                {/* Action Buttons */}
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Manage Issues */}
                    <button
                      type="button"
                      data-testid="manage-issues-btn"
                      onClick={() => onManageIssues(plant)}
                      title="Manage Issues"
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium flex items-center gap-1 border border-neutral-700 transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Issues</span>
                    </button>

                    {/* Edit Crop */}
                    <button
                      type="button"
                      data-testid="edit-plant-btn"
                      onClick={() => onEdit(plant)}
                      title="Edit Crop"
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium flex items-center gap-1 border border-neutral-700 transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Crop */}
                    <button
                      type="button"
                      data-testid="delete-plant-btn"
                      onClick={() => onDelete(plant)}
                      title="Delete Crop"
                      className="px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-red-200 text-xs font-medium flex items-center gap-1 border border-red-500/30 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
