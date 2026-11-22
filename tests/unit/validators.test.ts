import { describe, it, expect } from 'vitest';
import {
  createPlantSchema,
  plantSchema,
  updatePlantSchema,
  createPlantIssueSchema,
  plantIssueSchema,
  plantQuerySchema,
  PLANT_CATEGORIES,
} from '@/lib/validators';

describe('Data Validation Schemas', () => {
  describe('Plant Schema Validation', () => {
    const validPlantData = {
      name: 'Genovese Basil',
      scientificName: 'Ocimum basilicum',
      category: 'Herbs' as const,
      phMin: 5.5,
      phMax: 6.5,
      ecMin: 1.0,
      ecMax: 1.6,
      tempMinC: 20,
      tempMaxC: 28,
      lightRequirement: '14 - 16 hours/day',
      growthTips: 'Prune regularly to encourage bushy growth',
      imageUrl: '/images/basil.jpg',
    };

    it('successfully validates a complete valid plant creation payload', () => {
      const result = createPlantSchema.safeParse(validPlantData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Genovese Basil');
        expect(result.data.category).toBe('Herbs');
        expect(result.data.isCustomCalculations).toBe(false);
      }
    });

    it('successfully validates all allowed plant categories', () => {
      for (const category of PLANT_CATEGORIES) {
        const result = createPlantSchema.safeParse({
          ...validPlantData,
          category,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects an invalid plant category', () => {
      const result = createPlantSchema.safeParse({
        ...validPlantData,
        category: 'Tropical Fruit',
      });
      expect(result.success).toBe(false);
    });

    it('rejects inverted pH range (phMin > phMax)', () => {
      const result = createPlantSchema.safeParse({
        ...validPlantData,
        phMin: 6.8,
        phMax: 5.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('phMin'))).toBe(true);
      }
    });

    it('rejects out of bounds pH (< 0 or > 14)', () => {
      const negativePh = createPlantSchema.safeParse({
        ...validPlantData,
        phMin: -0.5,
      });
      expect(negativePh.success).toBe(false);

      const excessPh = createPlantSchema.safeParse({
        ...validPlantData,
        phMax: 14.5,
      });
      expect(excessPh.success).toBe(false);
    });

    it('rejects inverted EC range (ecMin > ecMax)', () => {
      const result = createPlantSchema.safeParse({
        ...validPlantData,
        ecMin: 2.5,
        ecMax: 1.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('ecMin'))).toBe(true);
      }
    });

    it('rejects negative EC values', () => {
      const result = createPlantSchema.safeParse({
        ...validPlantData,
        ecMin: -1.0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-finite values (Infinity / -Infinity)', () => {
      const infiniteEcMax = createPlantSchema.safeParse({
        ...validPlantData,
        ecMax: Infinity,
      });
      expect(infiniteEcMax.success).toBe(false);

      const infiniteEcMin = createPlantSchema.safeParse({
        ...validPlantData,
        ecMin: -Infinity,
      });
      expect(infiniteEcMin.success).toBe(false);

      const infinitePh = createPlantSchema.safeParse({
        ...validPlantData,
        phMax: Infinity,
      });
      expect(infinitePh.success).toBe(false);

      const infiniteTemp = createPlantSchema.safeParse({
        ...validPlantData,
        tempMaxC: Infinity,
      });
      expect(infiniteTemp.success).toBe(false);
    });

    it('rejects inverted temperature range (tempMinC > tempMaxC)', () => {
      const result = createPlantSchema.safeParse({
        ...validPlantData,
        tempMinC: 30,
        tempMaxC: 18,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('tempMinC'))).toBe(true);
      }
    });

    it('validates full plant schema with ID and timestamps', () => {
      const now = new Date();
      const fullPlant = {
        ...validPlantData,
        id: 'test-plant-1',
        cfMin: 10,
        cfMax: 16,
        ppm500Min: 500,
        ppm500Max: 800,
        ppm700Min: 700,
        ppm700Max: 1120,
        createdAt: now,
        updatedAt: now,
      };

      const result = plantSchema.safeParse(fullPlant);
      expect(result.success).toBe(true);
    });

    it('validates partial update schema', () => {
      const updatePayload = {
        phMax: 6.8,
        growthTips: 'Updated tips for cooler climates',
      };
      const result = updatePlantSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Plant Issue Schema Validation', () => {
    const validIssueData = {
      plantId: 'crop-tomato',
      title: 'Blossom End Rot',
      causeDescription: 'Calcium deficiency during rapid cell expansion',
      resolutionDescription: 'Maintain steady moisture and adjust calcium to 150-200 ppm',
      imageUrl: '/images/issues/tomato-ber.jpg',
    };

    it('successfully validates a valid plant issue creation payload', () => {
      const result = createPlantIssueSchema.safeParse(validIssueData);
      expect(result.success).toBe(true);
    });

    it('rejects empty title or descriptions', () => {
      const missingTitle = createPlantIssueSchema.safeParse({
        ...validIssueData,
        title: '',
      });
      expect(missingTitle.success).toBe(false);

      const missingCause = createPlantIssueSchema.safeParse({
        ...validIssueData,
        causeDescription: '   ',
      });
      expect(missingCause.success).toBe(false);
    });

    it('validates full plant issue schema with ID and timestamps', () => {
      const now = new Date();
      const fullIssue = {
        ...validIssueData,
        id: 'issue-tomato-1',
        createdAt: now,
        updatedAt: now,
      };
      const result = plantIssueSchema.safeParse(fullIssue);
      expect(result.success).toBe(true);
    });
  });

  describe('Plant Query Schema Validation', () => {
    it('coerces and validates query parameters with defaults', () => {
      const result = plantQuerySchema.safeParse({
        page: '2',
        limit: '25',
        q: 'lettuce',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
        expect(result.data.q).toBe('lettuce');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('caps limit at 100', () => {
      const result = plantQuerySchema.safeParse({
        limit: '150',
      });
      expect(result.success).toBe(false);
    });
  });
});
