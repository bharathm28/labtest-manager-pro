import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testbedTasks, serviceRequests, testBeds, employees } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

const VALID_STATUSES = ['queued', 'in_progress', 'completed', 'cancelled', 'transferred'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const task = await db.select({
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
        .where(eq(testbedTasks.id, parseInt(id)))
        .limit(1);

      if (task.length === 0) {
        return NextResponse.json({ 
          error: 'Task not found',
          code: 'TASK_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(task[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const testbedId = searchParams.get('testbedId');
    const serviceRequestId = searchParams.get('serviceRequestId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query = db.select({
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
      .leftJoin(serviceRequests, eq(testbedTasks.serviceRequestId, serviceRequests.id));

    const conditions = [];
    if (testbedId) {
      conditions.push(eq(testbedTasks.testbedId, parseInt(testbedId)));
    }
    if (serviceRequestId) {
      conditions.push(eq(testbedTasks.serviceRequestId, parseInt(serviceRequestId)));
    }
    if (status) {
      conditions.push(eq(testbedTasks.status, status));
    }
    if (priority) {
      conditions.push(eq(testbedTasks.priority, priority));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(asc(testbedTasks.queuePosition), desc(testbedTasks.createdAt))
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
      serviceRequestId, 
      testbedId, 
      assignedEmployeeId, 
      priority, 
      scheduledStartDate, 
      scheduledEndDate, 
      notes 
    } = body;

    if (!serviceRequestId) {
      return NextResponse.json({ 
        error: "serviceRequestId is required",
        code: "MISSING_SERVICE_REQUEST_ID" 
      }, { status: 400 });
    }

    if (!testbedId) {
      return NextResponse.json({ 
        error: "testbedId is required",
        code: "MISSING_TESTBED_ID" 
      }, { status: 400 });
    }

    const serviceRequest = await db.select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, parseInt(serviceRequestId)))
      .limit(1);

    if (serviceRequest.length === 0) {
      return NextResponse.json({ 
        error: "Service request not found",
        code: "INVALID_SERVICE_REQUEST_ID" 
      }, { status: 400 });
    }

    const testbed = await db.select()
      .from(testBeds)
      .where(eq(testBeds.id, parseInt(testbedId)))
      .limit(1);

    if (testbed.length === 0) {
      return NextResponse.json({ 
        error: "Testbed not found",
        code: "INVALID_TESTBED_ID" 
      }, { status: 400 });
    }

    if (assignedEmployeeId) {
      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(assignedEmployeeId)))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ 
          error: "Employee not found",
          code: "INVALID_EMPLOYEE_ID" 
        }, { status: 400 });
      }
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: "INVALID_PRIORITY" 
      }, { status: 400 });
    }

    if (scheduledStartDate && scheduledEndDate) {
      const startDate = new Date(scheduledStartDate);
      const endDate = new Date(scheduledEndDate);
      
      if (endDate <= startDate) {
        return NextResponse.json({ 
          error: "scheduledEndDate must be after scheduledStartDate",
          code: "INVALID_DATE_RANGE" 
        }, { status: 400 });
      }
    }

    const queuedTasksCount = await db.select({ count: sql<number>`count(*)` })
      .from(testbedTasks)
      .where(and(
        eq(testbedTasks.testbedId, parseInt(testbedId)),
        eq(testbedTasks.status, 'queued')
      ));

    const queuePosition = (queuedTasksCount[0]?.count || 0) + 1;

    const now = new Date().toISOString();
    const newTask = await db.insert(testbedTasks)
      .values({
        serviceRequestId: parseInt(serviceRequestId),
        testbedId: parseInt(testbedId),
        assignedEmployeeId: assignedEmployeeId ? parseInt(assignedEmployeeId) : null,
        status: 'queued',
        priority: priority || 'normal',
        scheduledStartDate: scheduledStartDate || null,
        scheduledEndDate: scheduledEndDate || null,
        queuePosition,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const taskWithJobCard = await db.select({
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
      .where(eq(testbedTasks.id, newTask[0].id))
      .limit(1);

    return NextResponse.json(taskWithJobCard[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingTask = await db.select()
      .from(testbedTasks)
      .where(eq(testbedTasks.id, parseInt(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found',
        code: 'TASK_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      assignedEmployeeId, 
      priority, 
      scheduledStartDate, 
      scheduledEndDate, 
      queuePosition, 
      notes,
      status 
    } = body;

    if (assignedEmployeeId !== undefined && assignedEmployeeId !== null) {
      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(assignedEmployeeId)))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ 
          error: "Employee not found",
          code: "INVALID_EMPLOYEE_ID" 
        }, { status: 400 });
      }
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: "INVALID_PRIORITY" 
      }, { status: 400 });
    }

    const finalScheduledStartDate = scheduledStartDate !== undefined ? scheduledStartDate : existingTask[0].scheduledStartDate;
    const finalScheduledEndDate = scheduledEndDate !== undefined ? scheduledEndDate : existingTask[0].scheduledEndDate;

    if (finalScheduledStartDate && finalScheduledEndDate) {
      const startDate = new Date(finalScheduledStartDate);
      const endDate = new Date(finalScheduledEndDate);
      
      if (endDate <= startDate) {
        return NextResponse.json({ 
          error: "scheduledEndDate must be after scheduledStartDate",
          code: "INVALID_DATE_RANGE" 
        }, { status: 400 });
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (assignedEmployeeId !== undefined) {
      updates.assignedEmployeeId = assignedEmployeeId ? parseInt(assignedEmployeeId) : null;
    }
    if (priority !== undefined) {
      updates.priority = priority;
    }
    if (scheduledStartDate !== undefined) {
      updates.scheduledStartDate = scheduledStartDate;
    }
    if (scheduledEndDate !== undefined) {
      updates.scheduledEndDate = scheduledEndDate;
    }
    if (queuePosition !== undefined) {
      updates.queuePosition = parseInt(queuePosition);
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }
    if (status !== undefined) {
      updates.status = status;
    }

    const updated = await db.update(testbedTasks)
      .set(updates)
      .where(eq(testbedTasks.id, parseInt(id)))
      .returning();

    const taskWithJobCard = await db.select({
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
      .where(eq(testbedTasks.id, parseInt(id)))
      .limit(1);

    return NextResponse.json(taskWithJobCard[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingTask = await db.select({
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
      .where(eq(testbedTasks.id, parseInt(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found',
        code: 'TASK_NOT_FOUND' 
      }, { status: 404 });
    }

    await db.delete(testbedTasks)
      .where(eq(testbedTasks.id, parseInt(id)));

    return NextResponse.json({ 
      message: 'Task deleted successfully',
      task: existingTask[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}