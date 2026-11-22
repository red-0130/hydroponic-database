'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  Plus,
  LogOut,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import AdminPlantTable from './AdminPlantTable';
import PlantFormModal, { type PlantRecord } from './PlantFormModal';
import IssueFormModal from './IssueFormModal';
import BulkDataActions from './BulkDataActions';
import { PLANT_CATEGORIES, type PlantCategory } from '@/lib/validators';

interface AdminDashboardProps {
  secretPath?: string;
  onLogout?: () => void;
}

export default function AdminDashboard({ secretPath, onLogout }: AdminDashboardProps) {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Notification message
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Modals state
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRecord | null>(null);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuePlant, setIssuePlant] = useState<PlantRecord | null>(null);

  // Delete plant state
  const [plantToDelete, setPlantToDelete] = useState<PlantRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all plants from admin API
  const fetchPlants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plants');
      if (res.ok) {
        const data = await res.json();
        setPlants(data);
      }
    } catch (err) {
      console.error('Failed to fetch plants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Handle Logout
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
      if (onLogout) {
        onLogout();
      }
    }
  }

  // Handle Confirm Delete Plant
  async function handleConfirmDeletePlant() {
    if (!plantToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/plants/${plantToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({
          text: `Crop "${plantToDelete.name}" deleted successfully.`,
          type: 'success',
        });
        setPlantToDelete(null);
        fetchPlants();
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage({
          text: errData.error || 'Failed to delete crop.',
          type: 'error',
        });
      }
    } catch {
      setMessage({
        text: 'Failed to delete crop due to network error.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }

  // Filter plants by search query and category
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plant.scientificName &&
        plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || plant.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      data-testid="admin-dashboard"
      className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Top Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>Admin Dashboard</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-medium">
                  Crop Management
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage botanical profiles, nutrient standards, and diagnostic issues
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Add Crop Button */}
            <button
              type="button"
              data-testid="add-plant-btn"
              onClick={() => {
                setEditingPlant(null);
                setIsPlantModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Crop</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              data-testid="admin-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 text-red-400" />
              )}
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Status / Feedback Banner */}
        {message && (
          <div
            role="status"
            className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 border shadow-md transition ${
              message.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/50 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-neutral-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Control Bar: Bulk Actions & Counters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <span
              data-testid="active-crop-count"
              className="text-xs font-semibold text-neutral-300 uppercase tracking-wider"
            >
              Total crops: {plants.length} (Active: {filteredPlants.length})
            </span>
          </div>

          {/* Bulk Actions: Export JSON/CSV, Import */}
          <BulkDataActions onRefresh={fetchPlants} setMessage={setMessage} />
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crops by common or scientific name..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              {PLANT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-sm">Loading crop database...</span>
          </div>
        ) : (
          <AdminPlantTable
            plants={filteredPlants}
            onEdit={(plant) => {
              setEditingPlant(plant);
              setIsPlantModalOpen(true);
            }}
            onDelete={(plant) => setPlantToDelete(plant)}
            onManageIssues={(plant) => {
              setIssuePlant(plant);
              setIsIssueModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Plant Form Modal (Add / Edit) */}
      <PlantFormModal
        isOpen={isPlantModalOpen}
        onClose={() => {
          setIsPlantModalOpen(false);
          setEditingPlant(null);
        }}
        onSuccess={() => {
          setMessage({
            text: editingPlant
              ? `Crop "${editingPlant.name}" updated successfully.`
              : 'New crop created successfully.',
            type: 'success',
          });
          fetchPlants();
        }}
        plant={editingPlant}
      />

      {/* Common Issues Modal */}
      <IssueFormModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setIssuePlant(null);
        }}
        plant={issuePlant}
        onRefresh={fetchPlants}
      />

      {/* Delete Plant Confirmation Dialog */}
      {plantToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-neutral-100">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Confirm Delete Crop
            </h3>
            <p className="text-sm text-neutral-300">
              Are you sure you want to permanently delete crop &ldquo;
              <strong>{plantToDelete.name}</strong>&rdquo;? All associated growing issues and metrics will also be purged.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setPlantToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs sm:text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete-btn"
                onClick={handleConfirmDeletePlant}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-950 transition"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
