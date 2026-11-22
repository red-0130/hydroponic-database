'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { PlantRecord } from './PlantFormModal';

export interface PlantIssueRecord {
  id: string;
  plantId: string;
  title: string;
  causeDescription: string;
  resolutionDescription: string;
  imageUrl?: string | null;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
}

interface IssueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: PlantRecord | null;
  onRefresh?: () => void;
}

export default function IssueFormModal({
  isOpen,
  onClose,
  plant,
  onRefresh,
}: IssueFormModalProps) {
  const [issues, setIssues] = useState<PlantIssueRecord[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [editingIssue, setEditingIssue] = useState<PlantIssueRecord | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [causeDescription, setCauseDescription] = useState('');
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [issueToDelete, setIssueToDelete] = useState<PlantIssueRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch issues when modal is opened
  useEffect(() => {
    if (!plant || !isOpen) return;

    async function loadIssues() {
      setLoadingIssues(true);
      try {
        const res = await fetch(`/api/admin/issues?plantId=${plant?.id}`);
        if (res.ok) {
          const data = await res.json();
          setIssues(data);
        }
      } catch (err) {
        console.error('Failed to load issues', err);
      } finally {
        setLoadingIssues(false);
      }
    }

    loadIssues();
    resetForm();
    setIssueToDelete(null);
  }, [plant?.id, isOpen]);

  function resetForm() {
    setEditingIssue(null);
    setTitle('');
    setCauseDescription('');
    setResolutionDescription('');
    setImageUrl('');
    setFormError(null);
  }

  function handleStartEdit(issue: PlantIssueRecord) {
    setEditingIssue(issue);
    setTitle(issue.title);
    setCauseDescription(issue.causeDescription);
    setResolutionDescription(issue.resolutionDescription);
    setImageUrl(issue.imageUrl || '');
    setFormError(null);
  }

  // Image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || 'Failed to upload symptom image');
        setUploadingImage(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      }
    } catch {
      setFormError('Image upload failed due to network error');
    } finally {
      setUploadingImage(false);
    }
  }

  // Submit issue create/update
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!plant) return;

    if (!title.trim()) {
      setFormError('Issue title is required');
      return;
    }
    if (!causeDescription.trim()) {
      setFormError('Cause description is required');
      return;
    }
    if (!resolutionDescription.trim()) {
      setFormError('Resolution description is required');
      return;
    }

    setSubmitting(true);

    const payload = {
      plantId: plant.id,
      title: title.trim(),
      causeDescription: causeDescription.trim(),
      resolutionDescription: resolutionDescription.trim(),
      imageUrl: imageUrl.trim() || null,
    };

    const url = editingIssue
      ? `/api/admin/issues/${editingIssue.id}`
      : '/api/admin/issues';
    const method = editingIssue ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || 'Failed to save issue');
        setSubmitting(false);
        return;
      }

      // Refresh issues list
      const issuesRes = await fetch(`/api/admin/issues?plantId=${plant.id}`);
      if (issuesRes.ok) {
        const updatedList = await issuesRes.json();
        setIssues(updatedList);
      }

      resetForm();
      if (onRefresh) onRefresh();
    } catch {
      setFormError('An error occurred while saving issue');
    } finally {
      setSubmitting(false);
    }
  }

  // Delete issue
  async function handleConfirmDelete() {
    if (!issueToDelete || !plant) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/issues/${issueToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIssues((prev) => prev.filter((i) => i.id !== issueToDelete.id));
        setIssueToDelete(null);
        if (onRefresh) onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || 'Failed to delete issue');
      }
    } catch {
      setFormError('Failed to delete issue due to network error');
    } finally {
      setDeleting(false);
    }
  }

  if (!isOpen || !plant) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="issue-form-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Manage Common Issues: {plant.name}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Add or edit pest, deficiency, disease, and environmental issues
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {formError && (
            <div
              data-testid="form-error-alert"
              role="alert"
              className="flex items-center gap-3 p-3.5 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl text-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Existing Issues Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2 mb-4 flex items-center justify-between">
              <span>Existing Documented Issues ({issues.length})</span>
            </h3>

            {loadingIssues ? (
              <div className="flex items-center justify-center py-6 text-neutral-400 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading issues...</span>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-4 bg-neutral-800/40 border border-neutral-800 rounded-xl text-center text-sm text-neutral-400">
                No issues recorded for this crop yet. Add one below.
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    data-testid="admin-issue-item"
                    className="issue-card p-4 bg-neutral-800/60 border border-neutral-700/70 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4 transition hover:border-neutral-600"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {issue.title}
                        </span>
                        {issue.imageUrl && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Photo attached
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-300">
                        <strong className="text-neutral-400">Cause:</strong> {issue.causeDescription}
                      </p>
                      <p className="text-xs text-neutral-300">
                        <strong className="text-emerald-400">Resolution:</strong> {issue.resolutionDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                      <button
                        type="button"
                        data-testid="edit-issue-btn"
                        onClick={() => handleStartEdit(issue)}
                        className="px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        data-testid="delete-issue-btn"
                        onClick={() => setIssueToDelete(issue)}
                        className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add / Edit Form */}
          <div className="p-5 bg-neutral-800/40 border border-neutral-700/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {editingIssue ? (
                  <>
                    <Pencil className="w-4 h-4 text-emerald-400" />
                    <span>Edit Issue: {editingIssue.title}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Add New Common Issue</span>
                  </>
                )}
              </h4>
              {editingIssue && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="issue-title"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Issue Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="issue-title"
                  data-testid="issue-title-input"
                  name="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spider Mites / Calcium Deficiency"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="issue-cause"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Cause Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="issue-cause"
                  data-testid="issue-cause-input"
                  name="causeDescription"
                  rows={2}
                  value={causeDescription}
                  onChange={(e) => setCauseDescription(e.target.value)}
                  placeholder="Explain environmental trigger, nutrient imbalance, or pest pathogen..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="issue-resolution"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Resolution Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="issue-resolution"
                  data-testid="issue-resolution-input"
                  name="resolutionDescription"
                  rows={2}
                  value={resolutionDescription}
                  onChange={(e) => setResolutionDescription(e.target.value)}
                  placeholder="Step-by-step corrective action (e.g. adjust pH, flush salts, beneficial insects)..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="issue-image"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Symptom Visual Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    id="issue-image"
                    data-testid="issue-image-input"
                    name="imageUrl"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/cucumber.jpg or https://..."
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-neutral-200 transition">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="truncate">Symptom photo: {imageUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  data-testid="issue-submit-btn"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-950"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Issue...</span>
                    </>
                  ) : (
                    <span>{editingIssue ? 'Update Issue' : 'Save Issue'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Deleting Issue */}
      {issueToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Confirm Delete Issue
            </h3>
            <p className="text-sm text-neutral-300">
              Are you sure you want to permanently delete issue &ldquo;
              <strong>{issueToDelete.title}</strong>&rdquo;? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIssueToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-950 transition"
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
