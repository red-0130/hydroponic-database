import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { and, eq, or, like, sql, asc, desc } from 'drizzle-orm';
import { plantQuerySchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const rawEntries = Array.from(request.nextUrl.searchParams.entries())
      .map(([k, v]) => [k, v.trim()] as const)
      .filter(([_, v]) => v !== '');
    const rawParams = Object.fromEntries(rawEntries);
    const parseResult = plantQuerySchema.safeParse(rawParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { q, category, page, limit, sortBy, sortOrder } = parseResult.data;
    const trimmedQ = q?.trim();
    const trimmedCategory = category?.trim();

    const conditions = [];

    if (trimmedCategory && trimmedCategory.toLowerCase() !== 'all') {
      conditions.push(eq(plants.category, trimmedCategory));
    }

    if (trimmedQ) {
      conditions.push(
        or(
          like(plants.name, `%${trimmedQ}%`),
          like(plants.scientificName, `%${trimmedQ}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortField = sortBy ? plants[sortBy] : plants.name;
    const primaryOrder = sortOrder === 'desc' ? desc(sortField) : asc(sortField);
    const orderClauses = sortBy && sortBy !== 'name' ? [primaryOrder, asc(plants.name)] : [primaryOrder];
    const offset = (page - 1) * limit;

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
      .where(whereClause)
      .groupBy(plants.id)
      .orderBy(...orderClauses)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}
