'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, X, RefreshCw, ArrowRightLeft } from 'lucide-react';
import {
  convertEcToCf,
  convertCfToEc,
  convertEcToPpm500,
  convertPpm500ToEc,
  convertEcToPpm700,
  convertPpm700ToEc,
} from '@/lib/calculations';

interface UnitConverterProps {
  buttonText?: string;
  className?: string;
  initiallyOpen?: boolean;
}

export function UnitConverter({
  buttonText = 'Quick Unit Converter',
  className = '',
  initiallyOpen = false,
}: UnitConverterProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [ec, setEc] = useState<string>('1.8');
  const [cf, setCf] = useState<string>('18');
  const [ppm500, setPpm500] = useState<string>('900');
  const [ppm700, setPpm700] = useState<string>('1260');
  const [isInvalidEc, setIsInvalidEc] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEcChange = (val: string) => {
    setEc(val);
    if (val.trim() === '') {
      setCf('');
      setPpm500('');
      setPpm700('');
      setIsInvalidEc(false);
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      setCf('');
      setPpm500('');
      setPpm700('');
      setIsInvalidEc(true);
      return;
    }
    if (num < 0) {
      setIsInvalidEc(true);
      setCf('0');
      setPpm500('0');
      setPpm700('0');
      return;
    }
    setIsInvalidEc(false);
    setCf(String(convertEcToCf(num)));
    setPpm500(String(convertEcToPpm500(num)));
    setPpm700(String(convertEcToPpm700(num)));
  };

  const handleCfChange = (val: string) => {
    setCf(val);
    if (val.trim() === '') {
      setEc('');
      setPpm500('');
      setPpm700('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setEc('0');
      setPpm500('0');
      setPpm700('0');
      return;
    }
    const computedEc = convertCfToEc(num);
    setEc(String(computedEc));
    setPpm500(String(convertEcToPpm500(computedEc)));
    setPpm700(String(convertEcToPpm700(computedEc)));
  };

  const handlePpm500Change = (val: string) => {
    setPpm500(val);
    if (val.trim() === '') {
      setEc('');
      setCf('');
      setPpm700('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setEc('0');
      setCf('0');
      setPpm700('0');
      return;
    }
    const computedEc = convertPpm500ToEc(num);
    setEc(String(computedEc));
    setCf(String(convertEcToCf(computedEc)));
    setPpm700(String(convertEcToPpm700(computedEc)));
  };

  const handlePpm700Change = (val: string) => {
    setPpm700(val);
    if (val.trim() === '') {
      setEc('');
      setCf('');
      setPpm500('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setEc('0');
      setCf('0');
      setPpm500('0');
      return;
    }
    const computedEc = convertPpm700ToEc(num);
    setEc(String(computedEc));
    setCf(String(convertEcToCf(computedEc)));
    setPpm500(String(convertEcToPpm500(computedEc)));
  };

  const handleReset = () => {
    setEc('1.8');
    setCf('18');
    setPpm500('900');
    setPpm700('1260');
    setIsInvalidEc(false);
  };

  return (
    <>
      <button
        type="button"
        data-testid="unit-converter-btn"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-sm transition-colors ${className}`}
      >
        <Calculator className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>

      {isOpen && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="converter-dialog-title"
          data-testid="unit-converter-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="converter-dialog-title"
                    className="text-lg font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    Hydroponic Nutrient Unit Converter
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Real-time 4-way synchronization across EC, cF, and PPM scales
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="converter-close-btn"
                aria-label="Close"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs Body */}
            <div className="p-6 space-y-4">
              {/* EC */}
              <div>
                <label
                  htmlFor="ec"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5"
                >
                  EC (Electrical Conductivity mS/cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="ec"
                    name="ec"
                    data-testid="converter-ec-input"
                    aria-label="EC (Electrical Conductivity mS/cm)"
                    aria-invalid={isInvalidEc ? 'true' : 'false'}
                    min="0"
                    step="0.01"
                    value={ec}
                    onChange={(e) => handleEcChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-base font-semibold focus:outline-none focus:ring-2 transition-colors ${
                      isInvalidEc
                        ? 'border-red-500 focus:ring-red-500/20 text-red-600 dark:text-red-400'
                        : 'border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 focus:ring-emerald-500/20 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    }`}
                    placeholder="e.g. 1.8"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-neutral-400 select-none">
                    mS/cm
                  </span>
                </div>
              </div>

              {/* cF */}
              <div>
                <label
                  htmlFor="cf"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5"
                >
                  cF (Conductivity Factor = EC × 10)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="cf"
                    name="cf"
                    data-testid="converter-cf-input"
                    aria-label="cF (Conductivity Factor)"
                    min="0"
                    step="0.1"
                    value={cf}
                    onChange={(e) => handleCfChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    placeholder="e.g. 18"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-neutral-400 select-none">
                    cF
                  </span>
                </div>
              </div>

              {/* PPM 500 (Hanna) */}
              <div>
                <label
                  htmlFor="ppm500"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5"
                >
                  PPM 500 (Hanna / US Standard = EC × 500)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="ppm500"
                    name="ppm500"
                    data-testid="converter-ppm500-input"
                    aria-label="PPM 500 (Hanna scale)"
                    min="0"
                    step="1"
                    value={ppm500}
                    onChange={(e) => handlePpm500Change(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    placeholder="e.g. 900"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-neutral-400 select-none">
                    PPM₅₀₀
                  </span>
                </div>
              </div>

              {/* PPM 700 (Eutech / Truncheon) */}
              <div>
                <label
                  htmlFor="ppm700"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5"
                >
                  PPM 700 (Eutech / Truncheon / UK Standard = EC × 700)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="ppm700"
                    name="ppm700"
                    data-testid="converter-ppm700-input"
                    aria-label="PPM 700 (Eutech scale)"
                    min="0"
                    step="1"
                    value={ppm700}
                    onChange={(e) => handlePpm700Change(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    placeholder="e.g. 1260"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-neutral-400 select-none">
                    PPM₇₀₀
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset defaults
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-neutral-900 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
