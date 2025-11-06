import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testbedTasks, testBeds, serviceRequests, activityLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
          error: "Valid task ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    // Fetch the task from testbedTasks table
    const taskResult = await db.select()
      .from(testbedTasks)
      .where(eq(testbedTasks.id, taskId))
      .limit(1);

    // Validate task exists
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

    // Validate task status is 'in_progress'
    if (task.status !== 'in_progress') {
      return NextResponse.json(
        { 
          error: `Cannot complete task. Task status is '${task.status}', but must be 'in_progress' to complete`,
          code: 'INVALID_STATUS',
          currentStatus: task.status
        },
        { status: 400 }
      );
    }

    // Validate actualStartDate is not null
    if (!task.actualStartDate) {
      return NextResponse.json(
        { 
          error: 'Cannot complete task. Task must have been started (actualStartDate is required)',
          code: 'TASK_NOT_STARTED'
        },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date().toISOString();

    // Execute all updates in a transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Update the task
      const updatedTask = await tx.update(testbedTasks)
        .set({
          status: 'completed',
          actualEndDate: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .where(eq(testbedTasks.id, taskId))
        .returning();

      // Update the testBeds table - set status to 'available'
      await tx.update(testBeds)
        .set({
          status: 'available'
        })
        .where(eq(testBeds.id, task.testbedId));

      // Update serviceRequests table - set testingEndDate if null
      const serviceRequestResult = await tx.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, task.serviceRequestId))
        .limit(1);

      if (serviceRequestResult.length > 0 && !serviceRequestResult[0].testingEndDate) {
        await tx.update(serviceRequests)
          .set({
            testingEndDate: currentTimestamp,
            updatedAt: currentTimestamp
          })
          .where(eq(serviceRequests.id, task.serviceRequestId));
      }

      // Create activity log entry
      await tx.insert(activityLogs)
        .values({
          entityType: 'testbed_task',
          entityId: taskId,
          action: 'completed',
          newValue: 'completed',
          timestamp: currentTimestamp
        });

      return updatedTask[0];
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}