import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { plantInsertSchema, issueInsertSchema } from '@/lib/validators';
import { calculateNutrientMetrics } from '@/lib/calculations';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < csvText.length && csvText[i + 1] === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\r') {
        if (i + 1 < csvText.length && csvText[i + 1] === '\n') {
          i++; // handle \r\n
        }
        currentRow.push(currentCell);
        currentCell = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentCell);
        currentCell = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  // Push final cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function coerceCsvValue(header: string, val: string): unknown {
  if (val === '') return null;
  if (['phMin', 'phMax', 'ecMin', 'ecMax', 'cfMin', 'cfMax', 'tempMinC', 'tempMaxC'].includes(header)) {
    const num = parseFloat(val);
    return isNaN(num) ? val : num;
  }
  if (['ppm500Min', 'ppm500Max', 'ppm700Min', 'ppm700Max'].includes(header)) {
    const num = parseInt(val, 10);
    return isNaN(num) ? val : num;
  }
  if (header === 'isCustomCalculations') {
    return val === 'true' || val === '1';
  }
  if (header === 'issues') {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return val;
}

function parseCsvText(csvText: string): Record<string, unknown>[] {
  const rows = parseCsvToRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const records: Record<string, unknown>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const val = values[j] ?? '';
      obj[header] = coerceCsvValue(header, val);
    }
    records.push(obj);
  }

  return records;
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const contentType = request.headers.get('content-type') || '';
    let rawItems: unknown[] = [];
    let previewOnly = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      previewOnly = formData.get('previewOnly') === 'true';

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'No file provided in form data' },
          { status: 400 }
        );
      }

      const text = await file.text();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv') || file.type.includes('csv')) {
        rawItems = parseCsvText(text);
      } else {
        try {
          const parsed = JSON.parse(text);
          rawItems = Array.isArray(parsed) ? parsed : parsed.data || parsed.plants || [];
        } catch {
          return NextResponse.json(
            { error: 'Failed to parse JSON file' },
            { status: 400 }
          );
        }
      }
    } else {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }

      if (Array.isArray(body)) {
        rawItems = body;
      } else if (body && typeof body === 'object') {
        const bodyObj = body as Record<string, unknown>;
        previewOnly = Boolean(bodyObj.previewOnly);

        if (typeof bodyObj.csv === 'string') {
          rawItems = parseCsvText(bodyObj.csv);
        } else if (Array.isArray(bodyObj.data)) {
          rawItems = bodyObj.data;
        } else if (Array.isArray(bodyObj.plants)) {
          rawItems = bodyObj.plants;
        }
      }
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: 'No items to import found in payload' },
        { status: 400 }
      );
    }

    // Validate each item
    const validationErrors: Array<{ index: number; error: unknown }> = [];
    interface ProcessedPlant {
      plant: typeof plants.$inferInsert;
      issues?: Array<{
        title: string;
        causeDescription: string;
        resolutionDescription: string;
        imageUrl?: string | null;
      }>;
    }
    const processedPlants: ProcessedPlant[] = [];

    const now = new Date();

    for (let i = 0; i < rawItems.length; i++) {
      const raw = rawItems[i];
      if (!raw || typeof raw !== 'object') {
        validationErrors.push({ index: i, error: 'Item must be an object' });
        continue;
      }

      const { id: rawId, issues: rawIssues, ...plantFields } = raw as Record<string, unknown>;
      const parsedPlant = plantInsertSchema.safeParse(plantFields);

      if (!parsedPlant.success) {
        validationErrors.push({
          index: i,
          error: parsedPlant.error.flatten(),
        });
        continue;
      }

      const data = parsedPlant.data;
      const isCustom = Boolean(data.isCustomCalculations);

      let cfMin = data.cfMin;
      let cfMax = data.cfMax;
      let ppm500Min = data.ppm500Min;
      let ppm500Max = data.ppm500Max;
      let ppm700Min = data.ppm700Min;
      let ppm700Max = data.ppm700Max;

      if (
        !isCustom ||
        cfMin == null ||
        cfMax == null ||
        ppm500Min == null ||
        ppm500Max == null ||
        ppm700Min == null ||
        ppm700Max == null
      ) {
        const calculated = calculateNutrientMetrics(data.ecMin, data.ecMax);
        cfMin = isCustom && cfMin != null ? cfMin : calculated.cfMin;
        cfMax = isCustom && cfMax != null ? cfMax : calculated.cfMax;
        ppm500Min = isCustom && ppm500Min != null ? ppm500Min : calculated.ppm500Min;
        ppm500Max = isCustom && ppm500Max != null ? ppm500Max : calculated.ppm500Max;
        ppm700Min = isCustom && ppm700Min != null ? ppm700Min : calculated.ppm700Min;
        ppm700Max = isCustom && ppm700Max != null ? ppm700Max : calculated.ppm700Max;
      }

      const plantId = typeof rawId === 'string' && rawId.trim().length > 0 ? rawId.trim() : randomUUID();

      const plantRecord: typeof plants.$inferInsert = {
        id: plantId,
        name: data.name,
        scientificName: data.scientificName || null,
        category: data.category,
        phMin: data.phMin,
        phMax: data.phMax,
        ecMin: data.ecMin,
        ecMax: data.ecMax,
        cfMin,
        cfMax,
        ppm500Min,
        ppm500Max,
        ppm700Min,
        ppm700Max,
        isCustomCalculations: isCustom,
        tempMinC: data.tempMinC ?? null,
        tempMaxC: data.tempMaxC ?? null,
        lightRequirement: data.lightRequirement || '12 - 16 hours/day',
        growthTips: data.growthTips || null,
        imageUrl: data.imageUrl || null,
        createdAt: now,
        updatedAt: now,
      };

      // Validate issues if present
      const validIssues: ProcessedPlant['issues'] = [];
      if (Array.isArray(rawIssues)) {
        for (const rawIssue of rawIssues) {
          if (rawIssue && typeof rawIssue === 'object') {
            const parsedIssue = issueInsertSchema.safeParse({
              plantId: plantId,
              ...rawIssue,
            });
            if (parsedIssue.success) {
              validIssues.push({
                title: parsedIssue.data.title,
                causeDescription: parsedIssue.data.causeDescription,
                resolutionDescription: parsedIssue.data.resolutionDescription,
                imageUrl: parsedIssue.data.imageUrl || null,
              });
            }
          }
        }
      }

      processedPlants.push({
        plant: plantRecord,
        issues: validIssues,
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Validation failed for one or more items',
          errors: validationErrors,
          count: rawItems.length,
        },
        { status: 400 }
      );
    }

    if (previewOnly) {
      return NextResponse.json({
        valid: true,
        count: processedPlants.length,
        sample: processedPlants.slice(0, 5).map((p) => ({
          ...p.plant,
          issuesCount: p.issues?.length || 0,
        })),
      });
    }

    // Commit to database
    let importedCount = 0;
    await db.transaction(async (tx) => {
      for (const item of processedPlants) {
        const existing = await tx
          .select({ id: plants.id })
          .from(plants)
          .where(eq(plants.id, item.plant.id))
          .get();

        if (existing) {
          await tx
            .update(plants)
            .set({
              ...item.plant,
              updatedAt: now,
            })
            .where(eq(plants.id, item.plant.id));

          await tx.delete(plantIssues).where(eq(plantIssues.plantId, item.plant.id));
        } else {
          await tx.insert(plants).values(item.plant);
        }

        if (item.issues && item.issues.length > 0) {
          for (let j = 0; j < item.issues.length; j++) {
            const issue = item.issues[j];
            await tx.insert(plantIssues).values({
              id: randomUUID(),
              plantId: item.plant.id,
              title: issue.title,
              causeDescription: issue.causeDescription,
              resolutionDescription: issue.resolutionDescription,
              imageUrl: issue.imageUrl || null,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        importedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      imported: importedCount,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
