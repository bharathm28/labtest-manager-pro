import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testbedTasks, testBeds, employees, serviceRequests } from '@/db/schema';
import { eq, and, or, lt, gt, ne, isNotNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testbedId, employeeId, scheduledStartDate, scheduledEndDate, excludeTaskId } = body;

    // Validation: Required fields
    if (!testbedId) {
      return NextResponse.json({
        error: 'testbedId is required',
        code: 'MISSING_TESTBED_ID'
      }, { status: 400 });
    }

    if (!scheduledStartDate) {
      return NextResponse.json({
        error: 'scheduledStartDate is required',
        code: 'MISSING_SCHEDULED_START_DATE'
      }, { status: 400 });
    }

    if (!scheduledEndDate) {
      return NextResponse.json({
        error: 'scheduledEndDate is required',
        code: 'MISSING_SCHEDULED_END_DATE'
      }, { status: 400 });
    }

    // Validation: testbedId is valid integer
    const parsedTestbedId = parseInt(testbedId);
    if (isNaN(parsedTestbedId)) {
      return NextResponse.json({
        error: 'testbedId must be a valid integer',
        code: 'INVALID_TESTBED_ID'
      }, { status: 400 });
    }

    // Validation: employeeId is valid integer (if provided)
    let parsedEmployeeId: number | undefined;
    if (employeeId !== undefined && employeeId !== null) {
      parsedEmployeeId = parseInt(employeeId);
      if (isNaN(parsedEmployeeId)) {
        return NextResponse.json({
          error: 'employeeId must be a valid integer',
          code: 'INVALID_EMPLOYEE_ID'
        }, { status: 400 });
      }
    }

    // Validation: excludeTaskId is valid integer (if provided)
    let parsedExcludeTaskId: number | undefined;
    if (excludeTaskId !== undefined && excludeTaskId !== null) {
      parsedExcludeTaskId = parseInt(excludeTaskId);
      if (isNaN(parsedExcludeTaskId)) {
        return NextResponse.json({
          error: 'excludeTaskId must be a valid integer',
          code: 'INVALID_EXCLUDE_TASK_ID'
        }, { status: 400 });
      }
    }

    // Validation: Valid ISO 8601 date strings
    const startDate = new Date(scheduledStartDate);
    const endDate = new Date(scheduledEndDate);

    if (isNaN(startDate.getTime())) {
      return NextResponse.json({
        error: 'scheduledStartDate must be a valid ISO 8601 date string',
        code: 'INVALID_SCHEDULED_START_DATE'
      }, { status: 400 });
    }

    if (isNaN(endDate.getTime())) {
      return NextResponse.json({
        error: 'scheduledEndDate must be a valid ISO 8601 date string',
        code: 'INVALID_SCHEDULED_END_DATE'
      }, { status: 400 });
    }

    // Validation: scheduledEndDate is after scheduledStartDate
    if (endDate <= startDate) {
      return NextResponse.json({
        error: 'scheduledEndDate must be after scheduledStartDate',
        code: 'INVALID_DATE_RANGE'
      }, { status: 400 });
    }

    // Validation: Check if testbed exists
    const testbed = await db.select()
      .from(testBeds)
      .where(eq(testBeds.id, parsedTestbedId))
      .limit(1);

    if (testbed.length === 0) {
      return NextResponse.json({
        error: 'Test bed not found',
        code: 'TESTBED_NOT_FOUND'
      }, { status: 404 });
    }

    // Validation: Check if employee exists (if provided)
    if (parsedEmployeeId !== undefined) {
      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, parsedEmployeeId))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        }, { status: 404 });
      }
    }

    // Query for test bed conflicts
    // Overlap logic: A_start < B_end AND B_start < A_end
    // Which translates to: scheduledStartDate < task.scheduledEndDate AND task.scheduledStartDate < scheduledEndDate
    let testbedConflictConditions = [
      eq(testbedTasks.testbedId, parsedTestbedId),
      or(
        eq(testbedTasks.status, 'queued'),
        eq(testbedTasks.status, 'in_progress')
      ),
      isNotNull(testbedTasks.scheduledStartDate),
      isNotNull(testbedTasks.scheduledEndDate),
      lt(testbedTasks.scheduledStartDate, scheduledEndDate),
      gt(testbedTasks.scheduledEndDate, scheduledStartDate)
    ];

    if (parsedExcludeTaskId !== undefined) {
      testbedConflictConditions.push(ne(testbedTasks.id, parsedExcludeTaskId));
    }

    const testbedConflictsQuery = await db.select({
      id: testbedTasks.id,
      serviceRequestId: testbedTasks.serviceRequestId,
      testbedId: testbedTasks.testbedId,
      assignedEmployeeId: testbedTasks.assignedEmployeeId,
      status: testbedTasks.status,
      priority: testbedTasks.priority,
      scheduledStartDate: testbedTasks.scheduledStartDate,
      scheduledEndDate: testbedTasks.scheduledEndDate,
      notes: testbedTasks.notes,
      jobCardNumber: serviceRequests.jobCardNumber
    })
      .from(testbedTasks)
      .leftJoin(serviceRequests, eq(testbedTasks.serviceRequestId, serviceRequests.id))
      .where(and(...testbedConflictConditions))
      .orderBy(testbedTasks.scheduledStartDate);

    // Query for employee conflicts (if employeeId is provided)
    let employeeConflictsQuery: typeof testbedConflictsQuery = [];
    
    if (parsedEmployeeId !== undefined) {
      let employeeConflictConditions = [
        eq(testbedTasks.assignedEmployeeId, parsedEmployeeId),
        or(
          eq(testbedTasks.status, 'queued'),
          eq(testbedTasks.status, 'in_progress')
        ),
        isNotNull(testbedTasks.scheduledStartDate),
        isNotNull(testbedTasks.scheduledEndDate),
        lt(testbedTasks.scheduledStartDate, scheduledEndDate),
        gt(testbedTasks.scheduledEndDate, scheduledStartDate)
      ];

      if (parsedExcludeTaskId !== undefined) {
        employeeConflictConditions.push(ne(testbedTasks.id, parsedExcludeTaskId));
      }

      employeeConflictsQuery = await db.select({
        id: testbedTasks.id,
        serviceRequestId: testbedTasks.serviceRequestId,
        testbedId: testbedTasks.testbedId,
        assignedEmployeeId: testbedTasks.assignedEmployeeId,
        status: testbedTasks.status,
        priority: testbedTasks.priority,
        scheduledStartDate: testbedTasks.scheduledStartDate,
        scheduledEndDate: testbedTasks.scheduledEndDate,
        notes: testbedTasks.notes,
        jobCardNumber: serviceRequests.jobCardNumber
      })
        .from(testbedTasks)
        .leftJoin(serviceRequests, eq(testbedTasks.serviceRequestId, serviceRequests.id))
        .where(and(...employeeConflictConditions))
        .orderBy(testbedTasks.scheduledStartDate);
    }

    // Determine if there are conflicts
    const hasTestbedConflicts = testbedConflictsQuery.length > 0;
    const hasEmployeeConflicts = employeeConflictsQuery.length > 0;
    const conflicts = hasTestbedConflicts || hasEmployeeConflicts;

    // Generate message
    let message = 'No scheduling conflicts detected';
    
    if (hasTestbedConflicts && hasEmployeeConflicts) {
      message = `Test bed has ${testbedConflictsQuery.length} conflicting task(s) and employee has ${employeeConflictsQuery.length} conflicting task(s) during this time period`;
    } else if (hasTestbedConflicts) {
      message = `Test bed has ${testbedConflictsQuery.length} conflicting task(s) during this time period`;
    } else if (hasEmployeeConflicts) {
      message = `Employee has ${employeeConflictsQuery.length} conflicting task(s) during this time period`;
    }

    return NextResponse.json({
      conflicts,
      testbedConflicts: testbedConflictsQuery,
      employeeConflicts: employeeConflictsQuery,
      message
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}