import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { plantUpdateSchema } from '@/lib/validators';
import { calculateNutrientMetrics } from '@/lib/calculations';
import { deleteUploadedImages } from '@/lib/uploads';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Plant ID is required' }, { status: 400 });
    }

    const plant = await db.select().from(plants).where(eq(plants.id, id)).get();
    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    const issues = await db
      .select()
      .from(plantIssues)
      .where(eq(plantIssues.plantId, id))
      .orderBy(asc(plantIssues.createdAt));

    return NextResponse.json({ ...plant, issues });
  } catch (error) {
    console.error('Error fetching admin plant:', error);
    return NextResponse.json({ error: 'Failed to fetch plant' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Plant ID is required' }, { status: 400 });
    }

    const existingPlant = await db.select().from(plants).where(eq(plants.id, id)).get();
    if (!existingPlant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parseResult = plantUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Cross-validate effective merged boundaries against existingPlant to prevent range inversion
    const effectivePhMin = data.phMin !== undefined ? data.phMin : existingPlant.phMin;
    const effectivePhMax = data.phMax !== undefined ? data.phMax : existingPlant.phMax;
    if (effectivePhMin > effectivePhMax) {
      return NextResponse.json(
        { error: 'Validation failed: phMin cannot be greater than phMax' },
        { status: 400 }
      );
    }

    const effectiveEcMin = data.ecMin !== undefined ? data.ecMin : existingPlant.ecMin;
    const effectiveEcMax = data.ecMax !== undefined ? data.ecMax : existingPlant.ecMax;
    if (effectiveEcMin > effectiveEcMax) {
      return NextResponse.json(
        { error: 'Validation failed: ecMin cannot be greater than ecMax' },
        { status: 400 }
      );
    }

    const effectiveTempMin = data.tempMinC !== undefined ? data.tempMinC : existingPlant.tempMinC;
    const effectiveTempMax = data.tempMaxC !== undefined ? data.tempMaxC : existingPlant.tempMaxC;
    if (effectiveTempMin !== null && effectiveTempMax !== null && effectiveTempMin > effectiveTempMax) {
      return NextResponse.json(
        { error: 'Validation failed: tempMinC cannot be greater than tempMaxC' },
        { status: 400 }
      );
    }

    const isCustom = data.isCustomCalculations !== undefined
      ? Boolean(data.isCustomCalculations)
      : existingPlant.isCustomCalculations;

    let cfMin = data.cfMin != null ? data.cfMin : existingPlant.cfMin;
    let cfMax = data.cfMax != null ? data.cfMax : existingPlant.cfMax;
    let ppm500Min = data.ppm500Min != null ? data.ppm500Min : existingPlant.ppm500Min;
    let ppm500Max = data.ppm500Max != null ? data.ppm500Max : existingPlant.ppm500Max;
    let ppm700Min = data.ppm700Min != null ? data.ppm700Min : existingPlant.ppm700Min;
    let ppm700Max = data.ppm700Max != null ? data.ppm700Max : existingPlant.ppm700Max;

    // If custom calculations is false, or ecMin/ecMax changed without custom calculations
    if (!isCustom) {
      const calculated = calculateNutrientMetrics(effectiveEcMin, effectiveEcMax);
      cfMin = calculated.cfMin;
      cfMax = calculated.cfMax;
      ppm500Min = calculated.ppm500Min;
      ppm500Max = calculated.ppm500Max;
      ppm700Min = calculated.ppm700Min;
      ppm700Max = calculated.ppm700Max;
    } else {
      if (cfMin > cfMax) {
        return NextResponse.json(
          { error: 'Validation failed: cfMin cannot be greater than cfMax' },
          { status: 400 }
        );
      }
      if (ppm500Min > ppm500Max) {
        return NextResponse.json(
          { error: 'Validation failed: ppm500Min cannot be greater than ppm500Max' },
          { status: 400 }
        );
      }
      if (ppm700Min > ppm700Max) {
        return NextResponse.json(
          { error: 'Validation failed: ppm700Min cannot be greater than ppm700Max' },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    const updateFields = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.scientificName !== undefined && { scientificName: data.scientificName }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.phMin !== undefined && { phMin: data.phMin }),
      ...(data.phMax !== undefined && { phMax: data.phMax }),
      ...(data.ecMin !== undefined && { ecMin: data.ecMin }),
      ...(data.ecMax !== undefined && { ecMax: data.ecMax }),
      cfMin,
      cfMax,
      ppm500Min,
      ppm500Max,
      ppm700Min,
      ppm700Max,
      isCustomCalculations: isCustom,
      ...(data.tempMinC !== undefined && { tempMinC: data.tempMinC }),
      ...(data.tempMaxC !== undefined && { tempMaxC: data.tempMaxC }),
      ...(data.lightRequirement !== undefined && { lightRequirement: data.lightRequirement }),
      ...(data.growthTips !== undefined && { growthTips: data.growthTips }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      updatedAt: now,
    };

    await db.update(plants).set(updateFields).where(eq(plants.id, id));

    const updatedPlant = await db.select().from(plants).where(eq(plants.id, id)).get();
    return NextResponse.json(updatedPlant);
  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json({ error: 'Failed to update plant' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Plant ID is required' }, { status: 400 });
    }

    const existingPlant = await db.select().from(plants).where(eq(plants.id, id)).get();
    if (!existingPlant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    const linkedIssues = await db.select().from(plantIssues).where(eq(plantIssues.plantId, id));

    // Explicitly delete linked issues to ensure cascade
    await db.delete(plantIssues).where(eq(plantIssues.plantId, id));
    await db.delete(plants).where(eq(plants.id, id));

    // Clean up local uploaded images for plant and linked issues
    await deleteUploadedImages([
      existingPlant.imageUrl,
      ...linkedIssues.map((issue) => issue.imageUrl),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plant:', error);
    return NextResponse.json({ error: 'Failed to delete plant' }, { status: 500 });
  }
}
