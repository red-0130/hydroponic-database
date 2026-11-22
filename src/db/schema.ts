import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const plants = sqliteTable('plants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  scientificName: text('scientific_name'),
  category: text('category').notNull(), // 'Leafy Greens' | 'Herbs' | 'Fruiting' | 'Root Vegetables' | 'Brassicas' | 'Other'
  
  // pH Range
  phMin: real('ph_min').notNull(),
  phMax: real('ph_max').notNull(),
  
  // Electrical Conductivity (mS/cm)
  ecMin: real('ec_min').notNull(),
  ecMax: real('ec_max').notNull(),
  
  // Derived or Overridden Nutrient Metrics
  cfMin: real('cf_min').notNull(),
  cfMax: real('cf_max').notNull(),
  ppm500Min: integer('ppm500_min').notNull(),
  ppm500Max: integer('ppm500_max').notNull(),
  ppm700Min: integer('ppm700_min').notNull(),
  ppm700Max: integer('ppm700_max').notNull(),
  isCustomCalculations: integer('is_custom_calculations', { mode: 'boolean' }).default(false).notNull(),

  // Environment & Growing Profile
  tempMinC: real('temp_min_c'),
  tempMaxC: real('temp_max_c'),
  lightRequirement: text('light_requirement').notNull().default('12 - 16 hours/day'),
  growthTips: text('growth_tips'),
  imageUrl: text('image_url'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const plantIssues = sqliteTable('plant_issues', {
  id: text('id').primaryKey(),
  plantId: text('plant_id')
    .notNull()
    .references(() => plants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  causeDescription: text('cause_description').notNull(),
  resolutionDescription: text('resolution_description').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const plantsRelations = relations(plants, ({ many }) => ({
  issues: many(plantIssues),
}));

export const plantIssuesRelations = relations(plantIssues, ({ one }) => ({
  plant: one(plants, {
    fields: [plantIssues.plantId],
    references: [plants.id],
  }),
}));

export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type PlantIssue = typeof plantIssues.$inferSelect;
export type NewPlantIssue = typeof plantIssues.$inferInsert;
