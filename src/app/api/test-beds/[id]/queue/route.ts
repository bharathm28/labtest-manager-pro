import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testBeds, testbedTasks, serviceRequests } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

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

    const testbedId = parseInt(id);

    // Validate test bed exists
    const testBed = await db
      .select()
      .from(testBeds)
      .where(eq(testBeds.id, testbedId))
      .limit(1);

    if (testBed.length === 0) {
      return NextResponse.json(
        { 
          error: 'Test bed not found',
          code: 'TESTBED_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Query queued tasks with job card number
    const queuedTasks = await db
      .select({
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
      .leftJoin(
        serviceRequests,
        eq(testbedTasks.serviceRequestId, serviceRequests.id)
      )
      .where(
        and(
          eq(testbedTasks.testbedId, testbedId),
          eq(testbedTasks.status, 'queued')
        )
      )
      .orderBy(
        asc(testbedTasks.queuePosition),
        sql`CASE ${testbedTasks.priority}
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END`,
        asc(testbedTasks.createdAt)
      );

    return NextResponse.json(queuedTasks, { status: 200 });

  } catch (error) {
    console.error('GET test bed queue error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}