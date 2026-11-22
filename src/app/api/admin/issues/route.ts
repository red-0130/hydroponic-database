import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plants, plantIssues } from '@/db';
import { issueInsertSchema } from '@/lib/validators';
import { randomUUID } from 'crypto';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const plantId = request.nextUrl.searchParams.get('plantId')?.trim();

    const query = db.select().from(plantIssues);
    const issues = plantId
      ? await query.where(eq(plantIssues.plantId, plantId)).orderBy(asc(plantIssues.createdAt))
      : await query.orderBy(asc(plantIssues.createdAt));

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
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

    const parseResult = issueInsertSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Verify referenced plant exists
    const plant = await db.select().from(plants).where(eq(plants.id, data.plantId)).get();
    if (!plant) {
      return NextResponse.json({ error: 'Referenced plant not found' }, { status: 404 });
    }

    const id = randomUUID();
    const now = new Date();

    const newIssue = {
      id,
      plantId: data.plantId,
      title: data.title,
      causeDescription: data.causeDescription,
      resolutionDescription: data.resolutionDescription,
      imageUrl: data.imageUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(plantIssues).values(newIssue);

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
