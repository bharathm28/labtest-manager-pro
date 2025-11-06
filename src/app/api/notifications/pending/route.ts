import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskNotifications } from '@/db/schema';
import { eq, and, lte, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    
    const currentTime = new Date().toISOString();
    
    const pendingNotifications = await db.select()
      .from(taskNotifications)
      .where(
        and(
          eq(taskNotifications.sent, false),
          lte(taskNotifications.scheduledFor, currentTime)
        )
      )
      .orderBy(asc(taskNotifications.scheduledFor))
      .limit(limit);
    
    return NextResponse.json(pendingNotifications, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}