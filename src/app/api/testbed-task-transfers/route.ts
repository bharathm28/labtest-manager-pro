import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testbedTaskTransfers, testbedTasks, testBeds } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const transfer = await db.select()
        .from(testbedTaskTransfers)
        .where(eq(testbedTaskTransfers.id, parseInt(id)))
        .limit(1);

      if (transfer.length === 0) {
        return NextResponse.json({ 
          error: 'Transfer record not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(transfer[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const taskId = searchParams.get('taskId');
    const fromTestbedId = searchParams.get('fromTestbedId');
    const toTestbedId = searchParams.get('toTestbedId');

    let query = db.select().from(testbedTaskTransfers);

    // Build filter conditions
    const conditions = [];
    
    if (taskId) {
      if (isNaN(parseInt(taskId))) {
        return NextResponse.json({ 
          error: "Valid taskId is required",
          code: "INVALID_TASK_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(testbedTaskTransfers.taskId, parseInt(taskId)));
    }

    if (fromTestbedId) {
      if (isNaN(parseInt(fromTestbedId))) {
        return NextResponse.json({ 
          error: "Valid fromTestbedId is required",
          code: "INVALID_FROM_TESTBED_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(testbedTaskTransfers.fromTestbedId, parseInt(fromTestbedId)));
    }

    if (toTestbedId) {
      if (isNaN(parseInt(toTestbedId))) {
        return NextResponse.json({ 
          error: "Valid toTestbedId is required",
          code: "INVALID_TO_TESTBED_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(testbedTaskTransfers.toTestbedId, parseInt(toTestbedId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(testbedTaskTransfers.transferredAt))
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
    const { taskId, fromTestbedId, toTestbedId, reason, transferredBy, notes } = body;

    // Validate required fields
    if (!taskId) {
      return NextResponse.json({ 
        error: "taskId is required",
        code: "MISSING_TASK_ID" 
      }, { status: 400 });
    }

    if (!fromTestbedId) {
      return NextResponse.json({ 
        error: "fromTestbedId is required",
        code: "MISSING_FROM_TESTBED_ID" 
      }, { status: 400 });
    }

    if (!toTestbedId) {
      return NextResponse.json({ 
        error: "toTestbedId is required",
        code: "MISSING_TO_TESTBED_ID" 
      }, { status: 400 });
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ 
        error: "reason is required and cannot be empty",
        code: "MISSING_REASON" 
      }, { status: 400 });
    }

    // Validate IDs are integers
    if (isNaN(parseInt(taskId))) {
      return NextResponse.json({ 
        error: "Valid taskId is required",
        code: "INVALID_TASK_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(fromTestbedId))) {
      return NextResponse.json({ 
        error: "Valid fromTestbedId is required",
        code: "INVALID_FROM_TESTBED_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(toTestbedId))) {
      return NextResponse.json({ 
        error: "Valid toTestbedId is required",
        code: "INVALID_TO_TESTBED_ID" 
      }, { status: 400 });
    }

    // Business logic: validate fromTestbedId != toTestbedId
    if (parseInt(fromTestbedId) === parseInt(toTestbedId)) {
      return NextResponse.json({ 
        error: "Cannot transfer to the same testbed",
        code: "SAME_TESTBED_TRANSFER" 
      }, { status: 400 });
    }

    // Validate taskId exists
    const task = await db.select()
      .from(testbedTasks)
      .where(eq(testbedTasks.id, parseInt(taskId)))
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json({ 
        error: "Task not found",
        code: "TASK_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate fromTestbedId exists
    const fromTestbed = await db.select()
      .from(testBeds)
      .where(eq(testBeds.id, parseInt(fromTestbedId)))
      .limit(1);

    if (fromTestbed.length === 0) {
      return NextResponse.json({ 
        error: "Source testbed not found",
        code: "FROM_TESTBED_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate toTestbedId exists
    const toTestbed = await db.select()
      .from(testBeds)
      .where(eq(testBeds.id, parseInt(toTestbedId)))
      .limit(1);

    if (toTestbed.length === 0) {
      return NextResponse.json({ 
        error: "Destination testbed not found",
        code: "TO_TESTBED_NOT_FOUND" 
      }, { status: 404 });
    }

    // Create transfer record
    const transferData = {
      taskId: parseInt(taskId),
      fromTestbedId: parseInt(fromTestbedId),
      toTestbedId: parseInt(toTestbedId),
      reason: reason.trim(),
      transferredBy: transferredBy?.trim() || null,
      transferredAt: new Date().toISOString(),
      notes: notes?.trim() || null,
    };

    const newTransfer = await db.insert(testbedTaskTransfers)
      .values(transferData)
      .returning();

    return NextResponse.json(newTransfer[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}