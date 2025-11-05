import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryLogs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_ACTIONS = ['assigned', 'returned', 'relocated', 'status_changed'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Inventory log not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const inventoryId = searchParams.get('inventoryId');
    const employeeId = searchParams.get('employeeId');
    const action = searchParams.get('action');

    if (limit < 0 || offset < 0) {
      return NextResponse.json({ 
        error: "Limit and offset must be non-negative",
        code: "INVALID_PAGINATION" 
      }, { status: 400 });
    }

    if (action && !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
        code: "INVALID_ACTION" 
      }, { status: 400 });
    }

    const conditions = [];

    if (inventoryId) {
      if (isNaN(parseInt(inventoryId))) {
        return NextResponse.json({ 
          error: "Valid inventory ID is required",
          code: "INVALID_INVENTORY_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(inventoryLogs.inventoryId, parseInt(inventoryId)));
    }

    if (employeeId) {
      if (isNaN(parseInt(employeeId))) {
        return NextResponse.json({ 
          error: "Valid employee ID is required",
          code: "INVALID_EMPLOYEE_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(inventoryLogs.employeeId, parseInt(employeeId)));
    }

    if (action) {
      conditions.push(eq(inventoryLogs.action, action));
    }

    let query = db.select().from(inventoryLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(inventoryLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      inventoryId, 
      action, 
      employeeId, 
      fromLocation, 
      toLocation, 
      reason, 
      performedBy, 
      notes 
    } = body;

    if (!inventoryId) {
      return NextResponse.json({ 
        error: "Inventory ID is required",
        code: "MISSING_INVENTORY_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(inventoryId))) {
      return NextResponse.json({ 
        error: "Valid inventory ID is required",
        code: "INVALID_INVENTORY_ID" 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        error: "Action is required",
        code: "MISSING_ACTION" 
      }, { status: 400 });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
        code: "INVALID_ACTION" 
      }, { status: 400 });
    }

    if (employeeId && isNaN(parseInt(employeeId))) {
      return NextResponse.json({ 
        error: "Valid employee ID is required",
        code: "INVALID_EMPLOYEE_ID" 
      }, { status: 400 });
    }

    const sanitizedData: any = {
      inventoryId: parseInt(inventoryId),
      action: action.trim(),
      timestamp: new Date().toISOString()
    };

    if (employeeId) {
      sanitizedData.employeeId = parseInt(employeeId);
    }

    if (fromLocation) {
      sanitizedData.fromLocation = fromLocation.trim();
    }

    if (toLocation) {
      sanitizedData.toLocation = toLocation.trim();
    }

    if (reason) {
      sanitizedData.reason = reason.trim();
    }

    if (performedBy) {
      sanitizedData.performedBy = performedBy.trim();
    }

    if (notes) {
      sanitizedData.notes = notes.trim();
    }

    const newLog = await db.insert(inventoryLogs)
      .values(sanitizedData)
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}