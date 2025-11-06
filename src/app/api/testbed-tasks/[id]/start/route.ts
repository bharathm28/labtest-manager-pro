import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testbedTasks, testBeds, serviceRequests, activityLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid task ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    // Fetch the task from testbedTasks table
    const task = await db
      .select()
      .from(testbedTasks)
      .where(eq(testbedTasks.id, taskId))
      .limit(1);

    // Validate task exists
    if (task.length === 0) {
      return NextResponse.json(
        {
          error: 'Task not found',
          code: 'TASK_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const currentTask = task[0];

    // Validate task status is 'queued'
    if (currentTask.status !== 'queued') {
      return NextResponse.json(
        {
          error: `Cannot start task with status '${currentTask.status}'. Only tasks with status 'queued' can be started.`,
          code: 'INVALID_TASK_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if the testbed already has an in_progress task
    const inProgressTasks = await db
      .select()
      .from(testbedTasks)
      .where(
        and(
          eq(testbedTasks.testbedId, currentTask.testbedId),
          eq(testbedTasks.status, 'in_progress')
        )
      )
      .limit(1);

    if (inProgressTasks.length > 0) {
      return NextResponse.json(
        {
          error: 'Test bed already has a task in progress',
          code: 'TESTBED_IN_USE',
        },
        { status: 400 }
      );
    }

    // Execute all updates in a transaction for atomicity
    const result = await db.transaction(async (tx) => {
      const currentTimestamp = new Date().toISOString();

      // Update the task
      const updatedTask = await tx
        .update(testbedTasks)
        .set({
          status: 'in_progress',
          actualStartDate: currentTimestamp,
          updatedAt: currentTimestamp,
        })
        .where(eq(testbedTasks.id, taskId))
        .returning();

      // Update the testBeds table
      await tx
        .update(testBeds)
        .set({
          status: 'in_use',
        })
        .where(eq(testBeds.id, currentTask.testbedId));

      // Fetch current service request to check if testingStartDate is null
      const serviceRequest = await tx
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, currentTask.serviceRequestId))
        .limit(1);

      // Update serviceRequests table only if testingStartDate is null
      if (serviceRequest.length > 0 && !serviceRequest[0].testingStartDate) {
        await tx
          .update(serviceRequests)
          .set({
            testingStartDate: currentTimestamp,
            updatedAt: currentTimestamp,
          })
          .where(eq(serviceRequests.id, currentTask.serviceRequestId));
      }

      // Create activity log entry
      await tx.insert(activityLogs).values({
        entityType: 'testbed_task',
        entityId: taskId,
        action: 'started',
        newValue: 'in_progress',
        timestamp: currentTimestamp,
      });

      return updatedTask[0];
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}