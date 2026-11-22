'use client';

import React, { useState } from 'react';
import {
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface BulkDataActionsProps {
  onRefresh: () => void;
  setMessage: (msg: { text: string; type: 'success' | 'error' } | null) => void;
}

export default function BulkDataActions({
  onRefresh,
  setMessage,
}: BulkDataActionsProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    count: number;
    sample?: Array<{ name: string; category: string }>;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // 1. File Selection & Preview for Import
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportPreview(null);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('previewOnly', 'true');

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || 'Validation failed for import file');
        setImporting(false);
        return;
      }

      setImportPreview({
        count: data.count || 0,
        sample: data.sample || [],
      });
    } catch {
      setImportError('Failed to parse and preview import file');
    } finally {
      setImporting(false);
    }
  }

  // 3. Commit Import
  async function handleCommitImport() {
    if (!importFile) return;

    setImporting(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('previewOnly', 'false');

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || 'Failed to commit import');
        setImporting(false);
        return;
      }

      setMessage({
        text: `Successfully imported ${data.imported || importPreview?.count || 0} crop records into database!`,
        type: 'success',
      });
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreview(null);
      onRefresh();
    } catch {
      setImportError('Failed to commit import due to network error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Export JSON Anchor */}
      <a
        href="/api/admin/export?format=json"
        download="hydroponic-plants.json"
        data-testid="export-json-btn"
        role="button"
        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition border border-neutral-700"
      >
        <FileJson className="w-4 h-4 text-amber-400" />
        <span>Export JSON</span>
      </a>

      {/* Export CSV Anchor */}
      <a
        href="/api/admin/export?format=csv"
        download="hydroponic-plants.csv"
        data-testid="export-csv-btn"
        role="button"
        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition border border-neutral-700"
      >
        <FileSpreadsheet className="w-4 h-4 text-blue-400" />
        <span>Export CSV</span>
      </a>

      {/* Import Button */}
      <button
        type="button"
        data-testid="import-data-btn"
        onClick={() => {
          setIsImportModalOpen(true);
          setImportError(null);
          setImportFile(null);
          setImportPreview(null);
        }}
        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition border border-neutral-700"
      >
        <Upload className="w-4 h-4 text-purple-400" />
        <span>Import Data</span>
      </button>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-neutral-100 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Bulk Import Crops (JSON or CSV)
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importError && (
              <div
                role="alert"
                className="p-3 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Select CSV or JSON file to upload
              </label>
              <input
                type="file"
                accept=".csv,text/csv,.json,application/json"
                onChange={handleFileSelect}
                disabled={importing}
                className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
              />
            </div>

            {importing && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Validating dataset...</span>
              </div>
            )}

            {importPreview && (
              <div className="p-4 bg-neutral-800/60 border border-neutral-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validation passed! Ready to import {importPreview.count} crops.</span>
                </div>
                {importPreview.sample && importPreview.sample.length > 0 && (
                  <div className="text-[11px] text-neutral-400">
                    <span className="block font-semibold mb-1 text-neutral-300">Sample preview:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {importPreview.sample.map((s, idx) => (
                        <li key={idx}>
                          {s.name} ({s.category})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                disabled={importing}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={!importPreview || importing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-950"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Commit Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
