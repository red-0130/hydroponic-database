import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
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

    const plant = await db
      .select()
      .from(plants)
      .where(eq(plants.id, id))
      .get();

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    const issues = await db
      .select()
      .from(plantIssues)
      .where(eq(plantIssues.plantId, id))
      .orderBy(asc(plantIssues.createdAt));

    return NextResponse.json({
      ...plant,
      issues,
    });
  } catch (error) {
    console.error('Error fetching plant detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plant' },
      { status: 500 }
    );
  }
}
