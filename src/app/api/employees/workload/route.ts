import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, testbedTasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // If specific employeeId requested
    if (employeeId) {
      const id = parseInt(employeeId);
      if (isNaN(id)) {
        return NextResponse.json({ 
          error: 'Invalid employee ID',
          code: 'INVALID_EMPLOYEE_ID' 
        }, { status: 400 });
      }

      // Fetch the employee
      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, id))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ 
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND' 
        }, { status: 404 });
      }

      const workload = await getEmployeeWorkload(id);

      return NextResponse.json({
        employee: {
          id: employee[0].id,
          name: employee[0].name,
          email: employee[0].email,
          designation: employee[0].designation,
          department: employee[0].department,
          status: 'available'
        },
        workload
      });
    }

    // Fetch all employees with pagination
    const allEmployees = await db.select()
      .from(employees)
      .limit(limit)
      .offset(offset);

    // Get workload for each employee
    const results = await Promise.all(
      allEmployees.map(async (employee) => {
        const workload = await getEmployeeWorkload(employee.id);
        return {
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            designation: employee.designation,
            department: employee.department,
            status: 'available'
          },
          workload
        };
      })
    );

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

async function getEmployeeWorkload(employeeId: number) {
  // Get current tasks (in_progress)
  const currentTasks = await db.select({
    id: testbedTasks.id,
    serviceRequestId: testbedTasks.serviceRequestId,
    testbedId: testbedTasks.testbedId,
    status: testbedTasks.status,
    priority: testbedTasks.priority,
    scheduledStartDate: testbedTasks.scheduledStartDate,
    scheduledEndDate: testbedTasks.scheduledEndDate,
    actualStartDate: testbedTasks.actualStartDate,
    notes: testbedTasks.notes
  })
    .from(testbedTasks)
    .where(
      and(
        eq(testbedTasks.assignedEmployeeId, employeeId),
        eq(testbedTasks.status, 'in_progress')
      )
    );

  // Get queued tasks
  const queuedTasks = await db.select({
    id: testbedTasks.id,
    serviceRequestId: testbedTasks.serviceRequestId,
    testbedId: testbedTasks.testbedId,
    status: testbedTasks.status,
    priority: testbedTasks.priority,
    scheduledStartDate: testbedTasks.scheduledStartDate,
    scheduledEndDate: testbedTasks.scheduledEndDate,
    queuePosition: testbedTasks.queuePosition,
    notes: testbedTasks.notes
  })
    .from(testbedTasks)
    .where(
      and(
        eq(testbedTasks.assignedEmployeeId, employeeId),
        eq(testbedTasks.status, 'queued')
      )
    );

  // Get completed tasks for counting and time calculation
  const completedTasks = await db.select({
    id: testbedTasks.id,
    actualStartDate: testbedTasks.actualStartDate,
    actualEndDate: testbedTasks.actualEndDate
  })
    .from(testbedTasks)
    .where(
      and(
        eq(testbedTasks.assignedEmployeeId, employeeId),
        eq(testbedTasks.status, 'completed')
      )
    );

  const completedTasksCount = completedTasks.length;

  // Calculate total time spent
  let totalTimeSpent = 0;
  for (const task of completedTasks) {
    if (task.actualStartDate && task.actualEndDate) {
      const startTime = new Date(task.actualStartDate).getTime();
      const endTime = new Date(task.actualEndDate).getTime();
      const duration = endTime - startTime;
      if (duration > 0) {
        totalTimeSpent += duration;
      }
    }
  }

  const totalTimeSpentHours = Math.round((totalTimeSpent / (1000 * 60 * 60)) * 100) / 100;

  return {
    currentTasks,
    queuedTasks,
    completedTasksCount,
    totalTimeSpent,
    totalTimeSpentHours
  };
}