'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { calculateNutrientMetrics } from '@/lib/calculations';
import { PLANT_CATEGORIES, type PlantCategory } from '@/lib/validators';

export interface PlantRecord {
  id: string;
  name: string;
  scientificName?: string | null;
  category: PlantCategory;
  phMin: number;
  phMax: number;
  ecMin: number;
  ecMax: number;
  cfMin: number;
  cfMax: number;
  ppm500Min: number;
  ppm500Max: number;
  ppm700Min: number;
  ppm700Max: number;
  isCustomCalculations: boolean;
  tempMinC?: number | null;
  tempMaxC?: number | null;
  lightRequirement: string;
  growthTips?: string | null;
  imageUrl?: string | null;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
  issuesCount?: number;
}

interface PlantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plant?: PlantRecord | null;
}

export default function PlantFormModal({
  isOpen,
  onClose,
  onSuccess,
  plant,
}: PlantFormModalProps) {
  const isEditing = Boolean(plant);

  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [category, setCategory] = useState<PlantCategory>('Leafy Greens');
  const [imageUrl, setImageUrl] = useState('');
  const [lightRequirement, setLightRequirement] = useState('12 - 16 hours/day');
  const [growthTips, setGrowthTips] = useState('');

  const [phMin, setPhMin] = useState('5.5');
  const [phMax, setPhMax] = useState('6.5');
  const [ecMin, setEcMin] = useState('1.0');
  const [ecMax, setEcMax] = useState('2.0');

  const [tempMinC, setTempMinC] = useState('');
  const [tempMaxC, setTempMaxC] = useState('');

  const [isCustomCalculations, setIsCustomCalculations] = useState(false);
  const [cfMin, setCfMin] = useState('10');
  const [cfMax, setCfMax] = useState('20');
  const [ppm500Min, setPpm500Min] = useState('500');
  const [ppm500Max, setPpm500Max] = useState('1000');
  const [ppm700Min, setPpm700Min] = useState('700');
  const [ppm700Max, setPpm700Max] = useState('1400');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Initialize form when opened or plant changes
  useEffect(() => {
    if (plant) {
      setName(plant.name || '');
      setScientificName(plant.scientificName || '');
      setCategory(plant.category || 'Leafy Greens');
      setImageUrl(plant.imageUrl || '');
      setLightRequirement(plant.lightRequirement || '12 - 16 hours/day');
      setGrowthTips(plant.growthTips || '');
      setPhMin(plant.phMin !== undefined ? String(plant.phMin) : '5.5');
      setPhMax(plant.phMax !== undefined ? String(plant.phMax) : '6.5');
      setEcMin(plant.ecMin !== undefined ? String(plant.ecMin) : '1.0');
      setEcMax(plant.ecMax !== undefined ? String(plant.ecMax) : '2.0');
      setTempMinC(plant.tempMinC !== undefined && plant.tempMinC !== null ? String(plant.tempMinC) : '');
      setTempMaxC(plant.tempMaxC !== undefined && plant.tempMaxC !== null ? String(plant.tempMaxC) : '');
      setIsCustomCalculations(Boolean(plant.isCustomCalculations));
      setCfMin(String(plant.cfMin));
      setCfMax(String(plant.cfMax));
      setPpm500Min(String(plant.ppm500Min));
      setPpm500Max(String(plant.ppm500Max));
      setPpm700Min(String(plant.ppm700Min));
      setPpm700Max(String(plant.ppm700Max));
    } else {
      setName('');
      setScientificName('');
      setCategory('Leafy Greens');
      setImageUrl('');
      setLightRequirement('12 - 16 hours/day');
      setGrowthTips('');
      setPhMin('5.5');
      setPhMax('6.5');
      setEcMin('1.0');
      setEcMax('2.0');
      setTempMinC('');
      setTempMaxC('');
      setIsCustomCalculations(false);
      const initialMetrics = calculateNutrientMetrics(1.0, 2.0);
      setCfMin(String(initialMetrics.cfMin));
      setCfMax(String(initialMetrics.cfMax));
      setPpm500Min(String(initialMetrics.ppm500Min));
      setPpm500Max(String(initialMetrics.ppm500Max));
      setPpm700Min(String(initialMetrics.ppm700Min));
      setPpm700Max(String(initialMetrics.ppm700Max));
    }
    setErrorAlert(null);
  }, [plant, isOpen]);

  // Real-time calculation derivation from EC
  const parsedEcMin = parseFloat(ecMin);
  const parsedEcMax = parseFloat(ecMax);
  const validEc = !isNaN(parsedEcMin) && !isNaN(parsedEcMax);
  const liveMetrics = validEc
    ? calculateNutrientMetrics(parsedEcMin, parsedEcMax)
    : { cfMin: 0, cfMax: 0, ppm500Min: 0, ppm500Max: 0, ppm700Min: 0, ppm700Max: 0 };

  // When override is toggled OFF, revert custom values to liveMetrics
  const handleToggleOverride = (checked: boolean) => {
    setIsCustomCalculations(checked);
    if (!checked && validEc) {
      setCfMin(String(liveMetrics.cfMin));
      setCfMax(String(liveMetrics.cfMax));
      setPpm500Min(String(liveMetrics.ppm500Min));
      setPpm500Max(String(liveMetrics.ppm500Max));
      setPpm700Min(String(liveMetrics.ppm700Min));
      setPpm700Max(String(liveMetrics.ppm700Max));
    }
  };

  // Image file upload
  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setErrorAlert('Selected file is empty or still downloading from iCloud');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorAlert('File size exceeds maximum allowed limit of 5MB');
      return;
    }

    setUploadingImage(true);
    setErrorAlert(null);

    try {
      const formData = new FormData();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.jpg';
      formData.append('file', file, safeName);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorAlert(data.error || 'Failed to upload image');
        setUploadingImage(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      }
    } catch {
      setErrorAlert('Image upload failed due to network error');
    } finally {
      setUploadingImage(false);
    }
  }

  // Form submit handler with validation
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorAlert(null);

    // 1. Name validation
    if (!name.trim()) {
      setErrorAlert('Crop name is required');
      return;
    }

    // 2. pH validation
    const numPhMin = parseFloat(phMin);
    const numPhMax = parseFloat(phMax);
    if (isNaN(numPhMin) || isNaN(numPhMax)) {
      setErrorAlert('pH values must be valid numbers');
      return;
    }
    if (numPhMin < 0 || numPhMin > 14 || numPhMax < 0 || numPhMax > 14) {
      setErrorAlert('pH must be between 0 and 14');
      return;
    }
    if (numPhMin > numPhMax) {
      setErrorAlert('phMin must be less than or equal to phMax');
      return;
    }

    // 3. EC validation
    const numEcMin = parseFloat(ecMin);
    const numEcMax = parseFloat(ecMax);
    if (isNaN(numEcMin) || isNaN(numEcMax)) {
      setErrorAlert('EC values must be valid numbers');
      return;
    }
    if (numEcMin < 0 || numEcMax < 0) {
      setErrorAlert('EC must be greater than or equal to 0');
      return;
    }
    if (numEcMin > numEcMax) {
      setErrorAlert('ecMin must be less than or equal to ecMax');
      return;
    }

    // 4. Temp validation
    let numTempMin: number | null = null;
    let numTempMax: number | null = null;
    if (tempMinC.trim() !== '') {
      numTempMin = parseFloat(tempMinC);
      if (isNaN(numTempMin)) {
        setErrorAlert('Temp min must be a valid number');
        return;
      }
    }
    if (tempMaxC.trim() !== '') {
      numTempMax = parseFloat(tempMaxC);
      if (isNaN(numTempMax)) {
        setErrorAlert('Temp max must be a valid number');
        return;
      }
    }
    if (numTempMin !== null && numTempMax !== null && numTempMin > numTempMax) {
      setErrorAlert('tempMinC must be less than or equal to tempMaxC');
      return;
    }

    // Build payload
    const payload: Record<string, unknown> = {
      name: name.trim(),
      scientificName: scientificName.trim() || null,
      category,
      imageUrl: imageUrl.trim() || null,
      lightRequirement: lightRequirement.trim() || '12 - 16 hours/day',
      growthTips: growthTips.trim() || null,
      phMin: numPhMin,
      phMax: numPhMax,
      ecMin: numEcMin,
      ecMax: numEcMax,
      tempMinC: numTempMin,
      tempMaxC: numTempMax,
      isCustomCalculations,
    };

    if (isCustomCalculations) {
      payload.cfMin = parseFloat(cfMin) || liveMetrics.cfMin;
      payload.cfMax = parseFloat(cfMax) || liveMetrics.cfMax;
      payload.ppm500Min = parseInt(ppm500Min, 10) || liveMetrics.ppm500Min;
      payload.ppm500Max = parseInt(ppm500Max, 10) || liveMetrics.ppm500Max;
      payload.ppm700Min = parseInt(ppm700Min, 10) || liveMetrics.ppm700Min;
      payload.ppm700Max = parseInt(ppm700Max, 10) || liveMetrics.ppm700Max;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing && plant ? `/api/admin/plants/${plant.id}` : '/api/admin/plants';
      const method = isEditing && plant ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let msg = errorData.error || 'Failed to save crop';
        if (errorData.details?.fieldErrors) {
          const firstField = Object.keys(errorData.details.fieldErrors)[0];
          msg = `${firstField}: ${errorData.details.fieldErrors[firstField][0]}`;
        }
        setErrorAlert(msg);
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorAlert('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="plant-form-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              {isEditing ? `Edit Crop: ${plant?.name}` : 'Add New Crop'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Specify nutrient ranges, environmental profile, and botanical metrics
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

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorAlert && (
            <div
              data-testid="form-error-alert"
              role="alert"
              className="flex items-center gap-3 p-3.5 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl text-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorAlert}</span>
            </div>
          )}

          {/* Basic Botanical Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-1">
              General Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="plant-name"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Plant Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="plant-name"
                  data-testid="plant-name-input"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Romaine Lettuce"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="plant-scientific-name"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Botanical / Latin Binomial
                </label>
                <input
                  id="plant-scientific-name"
                  data-testid="plant-scientific-name-input"
                  name="scientificName"
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder="e.g. Lactuca sativa var. longifolia"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="plant-category"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="plant-category"
                  data-testid="plant-category-select"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PlantCategory)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PLANT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="plant-light"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Light Requirement
                </label>
                <input
                  id="plant-light"
                  data-testid="plant-light-input"
                  name="lightRequirement"
                  type="text"
                  value={lightRequirement}
                  onChange={(e) => setLightRequirement(e.target.value)}
                  placeholder="e.g. 14 - 18 hours/day"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Image URL & File Upload */}
            <div>
              <label
                htmlFor="plant-image"
                className="block text-xs font-medium text-neutral-300 mb-1"
              >
                Plant Image URL or Upload Photo
              </label>
              <div className="flex gap-2">
                <input
                  id="plant-image"
                  data-testid="plant-image-input"
                  name="imageUrl"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/strawberry.jpg or https://..."
                  className="flex-1 bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-neutral-200 transition">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageFileUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="truncate">Active image: {imageUrl}</span>
                </div>
              )}
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-1">
              Temperature Limits (°C)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="plant-temp-min"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Temp Min (°C)
                </label>
                <input
                  id="plant-temp-min"
                  data-testid="plant-temp-min-input"
                  name="tempMinC"
                  type="number"
                  step="0.5"
                  value={tempMinC}
                  onChange={(e) => setTempMinC(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="plant-temp-max"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  Temp Max (°C)
                </label>
                <input
                  id="plant-temp-max"
                  data-testid="plant-temp-max-input"
                  name="tempMaxC"
                  type="number"
                  step="0.5"
                  value={tempMaxC}
                  onChange={(e) => setTempMaxC(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Nutrient Targets (pH and EC) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-1">
              Hydroponic Nutrient Ranges
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="plant-ph-min"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  pH Min <span className="text-red-400">*</span>
                </label>
                <input
                  id="plant-ph-min"
                  data-testid="plant-ph-min-input"
                  name="phMin"
                  type="number"
                  step="0.1"
                  value={phMin}
                  onChange={(e) => setPhMin(e.target.value)}
                  placeholder="e.g. 5.5"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="plant-ph-max"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  pH Max <span className="text-red-400">*</span>
                </label>
                <input
                  id="plant-ph-max"
                  data-testid="plant-ph-max-input"
                  name="phMax"
                  type="number"
                  step="0.1"
                  value={phMax}
                  onChange={(e) => setPhMax(e.target.value)}
                  placeholder="e.g. 6.5"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="plant-ec-min"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  EC Min (mS/cm) <span className="text-red-400">*</span>
                </label>
                <input
                  id="plant-ec-min"
                  data-testid="plant-ec-min-input"
                  name="ecMin"
                  type="number"
                  step="0.1"
                  value={ecMin}
                  onChange={(e) => setEcMin(e.target.value)}
                  placeholder="e.g. 1.0"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="plant-ec-max"
                  className="block text-xs font-medium text-neutral-300 mb-1"
                >
                  EC Max (mS/cm) <span className="text-red-400">*</span>
                </label>
                <input
                  id="plant-ec-max"
                  data-testid="plant-ec-max-input"
                  name="ecMax"
                  type="number"
                  step="0.1"
                  value={ecMax}
                  onChange={(e) => setEcMax(e.target.value)}
                  placeholder="e.g. 2.0"
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Live Nutrient Calculations Preview */}
            <div
              data-testid="live-calculation-preview"
              className="calc-preview live-preview p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Live Derived Nutrient Targets
                </span>
                <span className="text-[11px] text-emerald-400/80">
                  Auto-calculated from EC
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium">
                <div className="bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-neutral-400 block">cF Range</span>
                  <span className="text-white font-bold">
                    {liveMetrics.cfMin} - {liveMetrics.cfMax} cF
                  </span>
                </div>
                <div className="bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-neutral-400 block">PPM 500 (Hanna)</span>
                  <span className="text-white font-bold">
                    {liveMetrics.ppm500Min} - {liveMetrics.ppm500Max} PPM
                  </span>
                </div>
                <div className="bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-neutral-400 block">PPM 700 (Eutech)</span>
                  <span className="text-white font-bold">
                    {liveMetrics.ppm700Min} - {liveMetrics.ppm700Max} PPM
                  </span>
                </div>
              </div>
            </div>

            {/* Calculation Override Switch */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  data-testid="override-calculations-toggle"
                  name="isCustomCalculations"
                  checked={isCustomCalculations}
                  onChange={(e) => handleToggleOverride(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-neutral-900"
                />
                <div>
                  <span className="text-sm font-semibold text-white">
                    Override Derived Calculations
                  </span>
                  <span className="block text-xs text-neutral-400">
                    Manually specify custom targets for cF, PPM 500, or PPM 700
                  </span>
                </div>
              </label>

              {/* Custom Overrides Fields */}
              {isCustomCalculations && (
                <div className="mt-4 p-4 bg-neutral-800/60 border border-neutral-700 rounded-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Custom cF Min
                      </label>
                      <input
                        data-testid="plant-cf-min-input"
                        name="cfMin"
                        type="number"
                        step="0.1"
                        value={cfMin}
                        onChange={(e) => setCfMin(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Custom cF Max
                      </label>
                      <input
                        data-testid="plant-cf-max-input"
                        name="cfMax"
                        type="number"
                        step="0.1"
                        value={cfMax}
                        onChange={(e) => setCfMax(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Custom PPM 500 Min
                      </label>
                      <input
                        data-testid="plant-ppm500-min-input"
                        name="ppm500Min"
                        type="number"
                        value={ppm500Min}
                        onChange={(e) => setPpm500Min(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Custom PPM 500 Max
                      </label>
                      <input
                        data-testid="plant-ppm500-max-input"
                        name="ppm500Max"
                        type="number"
                        value={ppm500Max}
                        onChange={(e) => setPpm500Max(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Custom PPM 700 Min
                      </label>
                      <input
                        data-testid="plant-ppm700-min-input"
                        name="ppm700Min"
                        type="number"
                        value={ppm700Min}
                        onChange={(e) => setPpm700Min(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Custom PPM 700 Max
                      </label>
                      <input
                        data-testid="plant-ppm700-max-input"
                        name="ppm700Max"
                        type="number"
                        value={ppm700Max}
                        onChange={(e) => setPpm700Max(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Practical Hydroponic Growth Tips */}
          <div>
            <label
              htmlFor="plant-growth-tips"
              className="block text-xs font-medium text-neutral-300 mb-1"
            >
              Growth Tips & Nutrient Sensitivities
            </label>
            <textarea
              id="plant-growth-tips"
              data-testid="plant-growth-tips-input"
              name="growthTips"
              rows={3}
              value={growthTips}
              onChange={(e) => setGrowthTips(e.target.value)}
              placeholder="e.g. Prone to calcium deficiency under high transpiration; keep EC lower in summer..."
              className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions / Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="plant-submit-btn"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Crop' : 'Save Crop'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
