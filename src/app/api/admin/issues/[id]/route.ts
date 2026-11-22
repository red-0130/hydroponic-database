import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, plantIssues } from '@/db';
import { issueUpdateSchema } from '@/lib/validators';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
    }

    const issue = await db.select().from(plantIssues).where(eq(plantIssues.id, id)).get();
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
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
      return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
    }

    const existingIssue = await db.select().from(plantIssues).where(eq(plantIssues.id, id)).get();
    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parseResult = issueUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const now = new Date();

    const updateFields = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.causeDescription !== undefined && { causeDescription: data.causeDescription }),
      ...(data.resolutionDescription !== undefined && { resolutionDescription: data.resolutionDescription }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      updatedAt: now,
    };

    await db.update(plantIssues).set(updateFields).where(eq(plantIssues.id, id));

    const updated = await db.select().from(plantIssues).where(eq(plantIssues.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
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
      return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
    }

    const existingIssue = await db.select().from(plantIssues).where(eq(plantIssues.id, id)).get();
    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    await db.delete(plantIssues).where(eq(plantIssues.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
  }
}
