/**
 * Hydroponic nutrient calculations and unit conversions.
 * Standards:
 * - cF = EC * 10
 * - PPM 500 (Hanna scale) = EC * 500
 * - PPM 700 (Eutech / Truncheon scale) = EC * 700
 */

export function roundToDecimals(num: number, decimals: number = 1): number {
  if (!Number.isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function convertEcToCf(ec: number): number {
  if (!Number.isFinite(ec)) return 0;
  return roundToDecimals(ec * 10, 1);
}

export function convertCfToEc(cf: number): number {
  if (!Number.isFinite(cf)) return 0;
  return roundToDecimals(cf / 10, 2);
}

export const convertFromCf = convertCfToEc;

export function convertEcToPpm500(ec: number): number {
  if (!Number.isFinite(ec)) return 0;
  return Math.round(ec * 500);
}

export function convertPpm500ToEc(ppm: number): number {
  if (!Number.isFinite(ppm)) return 0;
  return roundToDecimals(ppm / 500, 2);
}

export const convertFromPpm500 = convertPpm500ToEc;

export function convertEcToPpm700(ec: number): number {
  if (!Number.isFinite(ec)) return 0;
  return Math.round(ec * 700);
}

export function convertPpm700ToEc(ppm: number): number {
  if (!Number.isFinite(ppm)) return 0;
  return roundToDecimals(ppm / 700, 2);
}

export const convertFromPpm700 = convertPpm700ToEc;

export interface NutrientMetrics {
  cfMin: number;
  cfMax: number;
  ppm500Min: number;
  ppm500Max: number;
  ppm700Min: number;
  ppm700Max: number;
}

export function calculateNutrientMetrics(ecMin: number, ecMax: number): NutrientMetrics {
  return {
    cfMin: convertEcToCf(ecMin),
    cfMax: convertEcToCf(ecMax),
    ppm500Min: convertEcToPpm500(ecMin),
    ppm500Max: convertEcToPpm500(ecMax),
    ppm700Min: convertEcToPpm700(ecMin),
    ppm700Max: convertEcToPpm700(ecMax),
  };
}

export function celsiusToFahrenheit(c: number): number {
  if (!Number.isFinite(c)) return 0;
  return Math.round(c * 1.8 + 32);
}

export function fahrenheitToCelsius(f: number): number {
  if (!Number.isFinite(f)) return 0;
  return roundToDecimals((f - 32) / 1.8, 1);
}
