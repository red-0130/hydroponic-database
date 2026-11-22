import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { asc, eq } from 'drizzle-orm';

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const format = request.nextUrl.searchParams.get('format')?.toLowerCase() || 'json';

    const allPlants = await db.select().from(plants).orderBy(asc(plants.name));
    const allIssues = await db.select().from(plantIssues).orderBy(asc(plantIssues.createdAt));

    // Group issues by plantId
    const issuesByPlant = new Map<string, typeof allIssues>();
    for (const issue of allIssues) {
      const list = issuesByPlant.get(issue.plantId) || [];
      list.push(issue);
      issuesByPlant.set(issue.plantId, list);
    }

    const exportedData = allPlants.map((plant) => ({
      ...plant,
      issues: issuesByPlant.get(plant.id) || [],
    }));

    if (format === 'csv') {
      const headers = [
        'id',
        'name',
        'scientificName',
        'category',
        'phMin',
        'phMax',
        'ecMin',
        'ecMax',
        'cfMin',
        'cfMax',
        'ppm500Min',
        'ppm500Max',
        'ppm700Min',
        'ppm700Max',
        'isCustomCalculations',
        'tempMinC',
        'tempMaxC',
        'lightRequirement',
        'growthTips',
        'imageUrl',
        'issues',
      ];

      const rows = exportedData.map((p) => [
        escapeCsvCell(p.id),
        escapeCsvCell(p.name),
        escapeCsvCell(p.scientificName),
        escapeCsvCell(p.category),
        escapeCsvCell(p.phMin),
        escapeCsvCell(p.phMax),
        escapeCsvCell(p.ecMin),
        escapeCsvCell(p.ecMax),
        escapeCsvCell(p.cfMin),
        escapeCsvCell(p.cfMax),
        escapeCsvCell(p.ppm500Min),
        escapeCsvCell(p.ppm500Max),
        escapeCsvCell(p.ppm700Min),
        escapeCsvCell(p.ppm700Max),
        escapeCsvCell(p.isCustomCalculations),
        escapeCsvCell(p.tempMinC),
        escapeCsvCell(p.tempMaxC),
        escapeCsvCell(p.lightRequirement),
        escapeCsvCell(p.growthTips),
        escapeCsvCell(p.imageUrl),
        escapeCsvCell(p.issues),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="hydroponic-plants.csv"',
        },
      });
    }

    // Default JSON format
    return NextResponse.json(exportedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="hydroponic-plants.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
