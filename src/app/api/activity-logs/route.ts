import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLogs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.id, parsedId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Activity log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const action = searchParams.get('action');

    // Build conditions array
    const conditions = [];

    if (entityType) {
      conditions.push(eq(activityLogs.entityType, entityType));
    }

    if (entityId) {
      const parsedEntityId = parseInt(entityId);
      if (isNaN(parsedEntityId)) {
        return NextResponse.json(
          { error: 'Valid entity ID is required', code: 'INVALID_ENTITY_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(activityLogs.entityId, parsedEntityId));
    }

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    // Build query
    let query = db.select().from(activityLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entityType,
      entityId,
      action,
      fieldName,
      oldValue,
      newValue,
      reason,
      performedBy,
      metadata,
    } = body;

    // Validate required fields
    if (!entityType || typeof entityType !== 'string' || entityType.trim() === '') {
      return NextResponse.json(
        { error: 'Entity type is required and must be a non-empty string', code: 'MISSING_ENTITY_TYPE' },
        { status: 400 }
      );
    }

    if (!entityId || typeof entityId !== 'number') {
      return NextResponse.json(
        { error: 'Entity ID is required and must be a valid integer', code: 'MISSING_ENTITY_ID' },
        { status: 400 }
      );
    }

    if (!action || typeof action !== 'string' || action.trim() === '') {
      return NextResponse.json(
        { error: 'Action is required and must be a non-empty string', code: 'MISSING_ACTION' },
        { status: 400 }
      );
    }

    // Sanitize string inputs
    const sanitizedData = {
      entityType: entityType.trim(),
      entityId: parseInt(String(entityId)),
      action: action.trim(),
      fieldName: fieldName ? String(fieldName).trim() : null,
      oldValue: oldValue ? String(oldValue).trim() : null,
      newValue: newValue ? String(newValue).trim() : null,
      reason: reason ? String(reason).trim() : null,
      performedBy: performedBy ? String(performedBy).trim() : null,
      timestamp: new Date().toISOString(),
      metadata: metadata ? String(metadata).trim() : null,
    };

    // Validate entityId is a valid integer
    if (isNaN(sanitizedData.entityId)) {
      return NextResponse.json(
        { error: 'Entity ID must be a valid integer', code: 'INVALID_ENTITY_ID' },
        { status: 400 }
      );
    }

    // Insert new activity log
    const newLog = await db
      .insert(activityLogs)
      .values(sanitizedData)
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}