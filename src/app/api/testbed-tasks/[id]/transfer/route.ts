import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testbedTasks, testBeds, testbedTaskTransfers, activityLogs } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid task ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { toTestbedId, reason, transferredBy, notes } = body;

    // Validate required fields
    if (!toTestbedId) {
      return NextResponse.json(
        { 
          error: 'toTestbedId is required',
          code: 'MISSING_TO_TESTBED_ID'
        },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(toTestbedId.toString()))) {
      return NextResponse.json(
        { 
          error: 'toTestbedId must be a valid integer',
          code: 'INVALID_TO_TESTBED_ID'
        },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return NextResponse.json(
        { 
          error: 'reason is required and cannot be empty',
          code: 'MISSING_REASON'
        },
        { status: 400 }
      );
    }

    const toTestbedIdInt = parseInt(toTestbedId.toString());
    const reasonTrimmed = reason.trim();
    const transferredByTrimmed = transferredBy ? transferredBy.trim() : null;
    const notesTrimmed = notes ? notes.trim() : null;

    // Fetch the task
    const taskResult = await db.select()
      .from(testbedTasks)
      .where(eq(testbedTasks.id, taskId))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Task not found',
          code: 'TASK_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const task = taskResult[0];

    // Validate task status
    if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'transferred') {
      return NextResponse.json(
        { 
          error: `Cannot transfer task with status: ${task.status}`,
          code: 'INVALID_TASK_STATUS'
        },
        { status: 400 }
      );
    }

    if (task.status !== 'queued' && task.status !== 'in_progress') {
      return NextResponse.json(
        { 
          error: 'Task must be in queued or in_progress status to transfer',
          code: 'INVALID_TASK_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate toTestbedId exists
    const toTestbedResult = await db.select()
      .from(testBeds)
      .where(eq(testBeds.id, toTestbedIdInt))
      .limit(1);

    if (toTestbedResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Target testbed not found',
          code: 'TO_TESTBED_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Validate toTestbedId != task.testbedId
    if (toTestbedIdInt === task.testbedId) {
      return NextResponse.json(
        { 
          error: 'Cannot transfer task to the same testbed',
          code: 'SAME_TESTBED_TRANSFER'
        },
        { status: 400 }
      );
    }

    const fromTestbedId = task.testbedId;
    const wasInProgress = task.status === 'in_progress';

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Calculate new queue position
      const queuedTasksCount = await tx.select({ count: count() })
        .from(testbedTasks)
        .where(
          and(
            eq(testbedTasks.testbedId, toTestbedIdInt),
            eq(testbedTasks.status, 'queued')
          )
        );

      const newQueuePosition = (queuedTasksCount[0]?.count || 0) + 1;

      // Update the task
      const updatedTask = await tx.update(testbedTasks)
        .set({
          testbedId: toTestbedIdInt,
          status: 'queued',
          queuePosition: newQueuePosition,
          actualStartDate: null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(testbedTasks.id, taskId))
        .returning();

      // If task was in_progress, update old testbed status to available
      if (wasInProgress) {
        await tx.update(testBeds)
          .set({
            status: 'available'
          })
          .where(eq(testBeds.id, fromTestbedId));
      }

      // Create transfer record
      const transferRecord = await tx.insert(testbedTaskTransfers)
        .values({
          taskId: task.id,
          fromTestbedId: fromTestbedId,
          toTestbedId: toTestbedIdInt,
          reason: reasonTrimmed,
          transferredBy: transferredByTrimmed,
          transferredAt: new Date().toISOString(),
          notes: notesTrimmed
        })
        .returning();

      // Create activity log entry
      await tx.insert(activityLogs)
        .values({
          entityType: 'testbed_task',
          entityId: task.id,
          action: 'transferred',
          oldValue: fromTestbedId.toString(),
          newValue: toTestbedIdInt.toString(),
          reason: reasonTrimmed,
          timestamp: new Date().toISOString()
        });

      return {
        task: updatedTask[0],
        transfer: transferRecord[0]
      };
    });

    return NextResponse.json({
      ...result.task,
      transferDetails: result.transfer
    }, { status: 200 });

  } catch (error) {
    console.error('POST transfer error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}