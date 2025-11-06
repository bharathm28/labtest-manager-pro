import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testBeds, testbedTasks, serviceRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid test bed ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const testBedId = parseInt(id);

    // Validate test bed exists
    const testBed = await db.select()
      .from(testBeds)
      .where(eq(testBeds.id, testBedId))
      .limit(1);

    if (testBed.length === 0) {
      return NextResponse.json(
        { 
          error: 'Test bed not found',
          code: 'TEST_BED_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Query for in-progress task with job card number
    const result = await db.select({
      id: testbedTasks.id,
      serviceRequestId: testbedTasks.serviceRequestId,
      testbedId: testbedTasks.testbedId,
      assignedEmployeeId: testbedTasks.assignedEmployeeId,
      status: testbedTasks.status,
      priority: testbedTasks.priority,
      scheduledStartDate: testbedTasks.scheduledStartDate,
      scheduledEndDate: testbedTasks.scheduledEndDate,
      actualStartDate: testbedTasks.actualStartDate,
      actualEndDate: testbedTasks.actualEndDate,
      queuePosition: testbedTasks.queuePosition,
      notes: testbedTasks.notes,
      createdAt: testbedTasks.createdAt,
      updatedAt: testbedTasks.updatedAt,
      jobCardNumber: serviceRequests.jobCardNumber,
    })
      .from(testbedTasks)
      .leftJoin(serviceRequests, eq(testbedTasks.serviceRequestId, serviceRequests.id))
      .where(
        and(
          eq(testbedTasks.testbedId, testBedId),
          eq(testbedTasks.status, 'in_progress')
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { 
          error: 'No task currently in progress for this test bed',
          code: 'NO_TASK_IN_PROGRESS' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0], { status: 200 });

  } catch (error) {
    console.error('GET current task error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}