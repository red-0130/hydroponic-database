import { z } from 'zod';

export const PLANT_CATEGORIES = [
  'Leafy Greens',
  'Herbs',
  'Fruiting',
  'Root Vegetables',
  'Brassicas',
  'Other',
] as const;

export type PlantCategory = (typeof PLANT_CATEGORIES)[number];

const refinePlantRanges = <T extends {
  phMin?: number;
  phMax?: number;
  ecMin?: number;
  ecMax?: number;
  tempMinC?: number | null;
  tempMaxC?: number | null;
}>(
  schema: z.ZodType<T>
) => {
  return schema
    .refine(
      (data) => {
        if (data.phMin !== undefined && data.phMax !== undefined) {
          return data.phMin <= data.phMax;
        }
        return true;
      },
      {
        message: 'phMin must be less than or equal to phMax',
        path: ['phMin'],
      }
    )
    .refine(
      (data) => {
        if (data.ecMin !== undefined && data.ecMax !== undefined) {
          return data.ecMin <= data.ecMax;
        }
        return true;
      },
      {
        message: 'ecMin must be less than or equal to ecMax',
        path: ['ecMin'],
      }
    )
    .refine(
      (data) => {
        if (
          data.tempMinC !== undefined &&
          data.tempMinC !== null &&
          data.tempMaxC !== undefined &&
          data.tempMaxC !== null
        ) {
          return data.tempMinC <= data.tempMaxC;
        }
        return true;
      },
      {
        message: 'tempMinC must be less than or equal to tempMaxC',
        path: ['tempMinC'],
      }
    );
};

export const basePlantSchema = z.object({
  name: z.string().trim().min(1, 'Plant name is required'),
  scientificName: z.string().trim().nullable().optional(),
  category: z.enum(PLANT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid plant category' }),
  }),
  phMin: z.number().finite().min(0, 'phMin must be at least 0').max(14, 'phMin must be at most 14'),
  phMax: z.number().finite().min(0, 'phMax must be at least 0').max(14, 'phMax must be at most 14'),
  ecMin: z.number().finite().min(0, 'ecMin cannot be negative'),
  ecMax: z.number().finite().min(0, 'ecMax cannot be negative'),
  cfMin: z.number().finite().min(0).nullish(),
  cfMax: z.number().finite().min(0).nullish(),
  ppm500Min: z.number().int().finite().min(0).nullish(),
  ppm500Max: z.number().int().finite().min(0).nullish(),
  ppm700Min: z.number().int().finite().min(0).nullish(),
  ppm700Max: z.number().int().finite().min(0).nullish(),
  isCustomCalculations: z.boolean().nullish().transform(Boolean),
  tempMinC: z.number().finite().nullable().optional(),
  tempMaxC: z.number().finite().nullable().optional(),
  lightRequirement: z.string().trim().min(1).default('12 - 16 hours/day'),
  growthTips: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

export const createPlantSchema = refinePlantRanges(basePlantSchema);

export const plantSchema = refinePlantRanges(
  basePlantSchema.extend({
    id: z.string().min(1, 'ID is required'),
    cfMin: z.number().finite(),
    cfMax: z.number().finite(),
    ppm500Min: z.number().int().finite(),
    ppm500Max: z.number().int().finite(),
    ppm700Min: z.number().int().finite(),
    ppm700Max: z.number().int().finite(),
    createdAt: z.union([z.date(), z.number()]),
    updatedAt: z.union([z.date(), z.number()]),
  })
);

export const updatePlantSchema = refinePlantRanges(
  basePlantSchema.partial()
);

export const createPlantIssueSchema = z.object({
  plantId: z.string().trim().min(1, 'Plant ID is required'),
  title: z.string().trim().min(1, 'Issue title is required'),
  causeDescription: z.string().trim().min(1, 'Cause description is required'),
  resolutionDescription: z.string().trim().min(1, 'Resolution description is required'),
  imageUrl: z.string().nullable().optional(),
});

export const plantIssueSchema = createPlantIssueSchema.extend({
  id: z.string().min(1, 'Issue ID is required'),
  createdAt: z.union([z.date(), z.number()]),
  updatedAt: z.union([z.date(), z.number()]),
});

export const updatePlantIssueSchema = createPlantIssueSchema.partial();

export const plantQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  sortBy: z.enum(['name', 'category', 'phMin', 'ecMin', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
export type CreatePlantIssueInput = z.infer<typeof createPlantIssueSchema>;
export type UpdatePlantIssueInput = z.infer<typeof updatePlantIssueSchema>;
export type PlantQueryParams = z.infer<typeof plantQuerySchema>;

// Schema aliases
export const plantInsertSchema = createPlantSchema;
export const plantUpdateSchema = updatePlantSchema;
export const issueInsertSchema = createPlantIssueSchema;
export const issueUpdateSchema = updatePlantIssueSchema;
export type PlantInsertInput = CreatePlantInput;
export type PlantUpdateInput = UpdatePlantInput;
export type IssueInsertInput = CreatePlantIssueInput;
export type IssueUpdateInput = UpdatePlantIssueInput;

