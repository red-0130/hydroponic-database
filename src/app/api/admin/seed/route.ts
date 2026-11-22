import { NextResponse } from 'next/server';
import { seedDatabase } from '@/db/seed';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      count: result.plantsCount,
      issuesCount: result.issuesCount,
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
