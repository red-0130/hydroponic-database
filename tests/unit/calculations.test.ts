import { describe, it, expect } from 'vitest';
import {
  calculateNutrientMetrics,
  convertEcToCf,
  convertCfToEc,
  convertFromCf,
  convertEcToPpm500,
  convertPpm500ToEc,
  convertFromPpm500,
  convertEcToPpm700,
  convertPpm700ToEc,
  convertFromPpm700,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  roundToDecimals,
} from '@/lib/calculations';

describe('Hydroponic Calculations & Conversions', () => {
  describe('AGENTS.md Reference Table Targets', () => {
    it('calculates Lettuce metrics correctly (EC 0.8 - 1.2)', () => {
      const metrics = calculateNutrientMetrics(0.8, 1.2);
      expect(metrics).toEqual({
        cfMin: 8,
        cfMax: 12,
        ppm500Min: 400,
        ppm500Max: 600,
        ppm700Min: 560,
        ppm700Max: 840,
      });
    });

    it('calculates Basil metrics correctly (EC 1.0 - 1.6)', () => {
      const metrics = calculateNutrientMetrics(1.0, 1.6);
      expect(metrics).toEqual({
        cfMin: 10,
        cfMax: 16,
        ppm500Min: 500,
        ppm500Max: 800,
        ppm700Min: 700,
        ppm700Max: 1120,
      });
    });

    it('calculates Spinach metrics correctly (EC 1.0 - 1.8)', () => {
      const metrics = calculateNutrientMetrics(1.0, 1.8);
      expect(metrics).toEqual({
        cfMin: 10,
        cfMax: 18,
        ppm500Min: 500,
        ppm500Max: 900,
        ppm700Min: 700,
        ppm700Max: 1260,
      });
    });

    it('calculates Tomato metrics correctly (EC 2.0 - 3.5)', () => {
      const metrics = calculateNutrientMetrics(2.0, 3.5);
      expect(metrics).toEqual({
        cfMin: 20,
        cfMax: 35,
        ppm500Min: 1000,
        ppm500Max: 1750,
        ppm700Min: 1400,
        ppm700Max: 2450,
      });
    });

    it('calculates Bell Pepper metrics correctly (EC 1.8 - 2.6)', () => {
      const metrics = calculateNutrientMetrics(1.8, 2.6);
      expect(metrics).toEqual({
        cfMin: 18,
        cfMax: 26,
        ppm500Min: 900,
        ppm500Max: 1300,
        ppm700Min: 1260,
        ppm700Max: 1820,
      });
    });

    it('calculates Strawberry metrics correctly (EC 1.0 - 1.4)', () => {
      const metrics = calculateNutrientMetrics(1.0, 1.4);
      expect(metrics).toEqual({
        cfMin: 10,
        cfMax: 14,
        ppm500Min: 500,
        ppm500Max: 700,
        ppm700Min: 700,
        ppm700Max: 980,
      });
    });

    it('calculates Cucumber metrics correctly (EC 1.7 - 2.5)', () => {
      const metrics = calculateNutrientMetrics(1.7, 2.5);
      expect(metrics).toEqual({
        cfMin: 17,
        cfMax: 25,
        ppm500Min: 850,
        ppm500Max: 1250,
        ppm700Min: 1190,
        ppm700Max: 1750,
      });
    });

    it('calculates Mint metrics correctly (EC 1.2 - 2.2)', () => {
      const metrics = calculateNutrientMetrics(1.2, 2.2);
      expect(metrics).toEqual({
        cfMin: 12,
        cfMax: 22,
        ppm500Min: 600,
        ppm500Max: 1100,
        ppm700Min: 840,
        ppm700Max: 1540,
      });
    });
  });

  describe('EC and cF Conversions', () => {
    it('converts EC to cF (cF = EC * 10)', () => {
      expect(convertEcToCf(0)).toBe(0);
      expect(convertEcToCf(1.5)).toBe(15);
      expect(convertEcToCf(2.4)).toBe(24);
      expect(convertEcToCf(0.85)).toBe(8.5);
    });

    it('converts cF to EC (EC = cF / 10)', () => {
      expect(convertCfToEc(0)).toBe(0);
      expect(convertCfToEc(15)).toBe(1.5);
      expect(convertCfToEc(24)).toBe(2.4);
      expect(convertFromCf(8.5)).toBe(0.85);
    });
  });

  describe('EC and PPM 500 (Hanna) Conversions', () => {
    it('converts EC to PPM 500 (PPM500 = EC * 500)', () => {
      expect(convertEcToPpm500(0)).toBe(0);
      expect(convertEcToPpm500(1.0)).toBe(500);
      expect(convertEcToPpm500(2.5)).toBe(1250);
      expect(convertEcToPpm500(0.85)).toBe(425);
    });

    it('converts PPM 500 to EC (EC = PPM500 / 500)', () => {
      expect(convertPpm500ToEc(0)).toBe(0);
      expect(convertPpm500ToEc(500)).toBe(1.0);
      expect(convertPpm500ToEc(1250)).toBe(2.5);
      expect(convertFromPpm500(425)).toBe(0.85);
    });
  });

  describe('EC and PPM 700 (Eutech / Truncheon) Conversions', () => {
    it('converts EC to PPM 700 (PPM700 = EC * 700)', () => {
      expect(convertEcToPpm700(0)).toBe(0);
      expect(convertEcToPpm700(1.0)).toBe(700);
      expect(convertEcToPpm700(2.5)).toBe(1750);
      expect(convertEcToPpm700(0.85)).toBe(595);
    });

    it('converts PPM 700 to EC (EC = PPM700 / 700)', () => {
      expect(convertPpm700ToEc(0)).toBe(0);
      expect(convertPpm700ToEc(700)).toBe(1.0);
      expect(convertPpm700ToEc(1750)).toBe(2.5);
      expect(convertFromPpm700(595)).toBe(0.85);
    });
  });

  describe('Temperature Conversions', () => {
    it('converts Celsius to Fahrenheit correctly', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
      expect(celsiusToFahrenheit(20)).toBe(68);
      expect(celsiusToFahrenheit(25)).toBe(77);
      expect(celsiusToFahrenheit(100)).toBe(212);
      expect(celsiusToFahrenheit(-10)).toBe(14);
    });

    it('converts Fahrenheit to Celsius correctly', () => {
      expect(fahrenheitToCelsius(32)).toBe(0);
      expect(fahrenheitToCelsius(68)).toBe(20);
      expect(fahrenheitToCelsius(77)).toBe(25);
      expect(fahrenheitToCelsius(212)).toBe(100);
      expect(fahrenheitToCelsius(14)).toBe(-10);
    });
  });

  describe('Edge Cases and Defensive Handling', () => {
    it('handles non-finite values safely', () => {
      expect(convertEcToCf(NaN)).toBe(0);
      expect(convertEcToPpm500(Infinity)).toBe(0);
      expect(convertEcToPpm700(-Infinity)).toBe(0);
      expect(celsiusToFahrenheit(NaN)).toBe(0);
      expect(fahrenheitToCelsius(NaN)).toBe(0);
    });

    it('handles roundToDecimals helper accurately', () => {
      expect(roundToDecimals(1.2345, 2)).toBe(1.23);
      expect(roundToDecimals(1.2355, 2)).toBe(1.24);
      expect(roundToDecimals(1.2, 0)).toBe(1);
    });
  });
});
