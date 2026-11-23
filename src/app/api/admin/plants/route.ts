import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { plantInsertSchema } from '@/lib/validators';
import { calculateNutrientMetrics } from '@/lib/calculations';
import { randomUUID } from 'crypto';
import { eq, sql, asc } from 'drizzle-orm';

export async function GET() {
  try {
    await ensureDb();

    const results = await db
      .select({
        id: plants.id,
        name: plants.name,
        scientificName: plants.scientificName,
        category: plants.category,
        phMin: plants.phMin,
        phMax: plants.phMax,
        ecMin: plants.ecMin,
        ecMax: plants.ecMax,
        cfMin: plants.cfMin,
        cfMax: plants.cfMax,
        ppm500Min: plants.ppm500Min,
        ppm500Max: plants.ppm500Max,
        ppm700Min: plants.ppm700Min,
        ppm700Max: plants.ppm700Max,
        isCustomCalculations: plants.isCustomCalculations,
        tempMinC: plants.tempMinC,
        tempMaxC: plants.tempMaxC,
        lightRequirement: plants.lightRequirement,
        growthTips: plants.growthTips,
        imageUrl: plants.imageUrl,
        createdAt: plants.createdAt,
        updatedAt: plants.updatedAt,
        issuesCount: sql<number>`count(${plantIssues.id})`.mapWith(Number),
      })
      .from(plants)
      .leftJoin(plantIssues, eq(plants.id, plantIssues.plantId))
      .groupBy(plants.id)
      .orderBy(asc(plants.name));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching admin plants:', error);
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parseResult = plantInsertSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
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

    const id = randomUUID();
    const now = new Date();

    const newPlant = {
      id,
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

    await db.insert(plants).values(newPlant);

    return NextResponse.json(newPlant, { status: 201 });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}
