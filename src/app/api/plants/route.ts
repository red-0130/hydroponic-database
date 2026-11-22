import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { and, eq, or, like, sql, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim();

    const conditions = [];

    if (category && category.toLowerCase() !== 'all') {
      conditions.push(eq(plants.category, category));
    }

    if (q) {
      conditions.push(
        or(
          like(plants.name, `%${q}%`),
          like(plants.scientificName, `%${q}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      .orderBy(asc(plants.name));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}
