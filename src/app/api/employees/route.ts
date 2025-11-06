import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(id)))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ 
          error: 'Employee not found',
          code: "EMPLOYEE_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(employee[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    let query = db.select().from(employees);

    // Build conditions array
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(employees.name, `%${search}%`),
          like(employees.email, `%${search}%`),
          like(employees.employeeCode, `%${search}%`)
        )
      );
    }

    if (department) {
      conditions.push(eq(employees.department, department));
    }

    if (status) {
      conditions.push(eq(employees.status, status));
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query
      .orderBy(desc(employees.createdAt))
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
    const { name, designation, email, phone, department, employeeCode, status } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: "Email is required and must be a non-empty string",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Prepare insert data with sanitized inputs
    const insertData = {
      name: name.trim(),
      designation: designation ? designation.trim() : null,
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      department: department ? department.trim() : null,
      employeeCode: employeeCode ? employeeCode.trim() : null,
      status: status || 'available',
      createdAt: new Date().toISOString()
    };

    const newEmployee = await db.insert(employees)
      .values(insertData)
      .returning();

    return NextResponse.json(newEmployee[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation for employee_code
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Employee code already exists',
        code: 'DUPLICATE_EMPLOYEE_CODE'
      }, { status: 400 });
    }
    
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

    const body = await request.json();
    const { name, designation, email, phone, department, employeeCode, status } = body;

    // Check if employee exists
    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.id, parseInt(id)))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json({ 
        error: 'Employee not found',
        code: "EMPLOYEE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ 
          error: "Name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        return NextResponse.json({ 
          error: "Email must be a non-empty string",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT" 
        }, { status: 400 });
      }
    }

    // Prepare update data with only provided fields
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (designation !== undefined) {
      updateData.designation = designation ? designation.trim() : null;
    }
    if (email !== undefined) {
      updateData.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }
    if (department !== undefined) {
      updateData.department = department ? department.trim() : null;
    }
    if (employeeCode !== undefined) {
      updateData.employeeCode = employeeCode ? employeeCode.trim() : null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const updated = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    
    // Handle unique constraint violation for employee_code
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Employee code already exists',
        code: 'DUPLICATE_EMPLOYEE_CODE'
      }, { status: 400 });
    }
    
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

    // Check if employee exists
    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.id, parseInt(id)))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json({ 
        error: 'Employee not found',
        code: "EMPLOYEE_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(employees)
      .where(eq(employees.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Employee deleted successfully',
      employee: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}