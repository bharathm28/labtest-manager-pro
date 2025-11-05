import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventory } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_STATUSES = ['available', 'assigned', 'maintenance', 'retired'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(inventory)
        .where(eq(inventory.id, parsedId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Inventory item not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const assignedToEmployeeId = searchParams.get('assignedToEmployeeId');

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate assignedToEmployeeId if provided
    if (assignedToEmployeeId && isNaN(parseInt(assignedToEmployeeId))) {
      return NextResponse.json(
        { error: 'Invalid employee ID', code: 'INVALID_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    const conditions = [];

    // Search across name, serialNumber, and description
    if (search) {
      conditions.push(
        or(
          like(inventory.name, `%${search}%`),
          like(inventory.serialNumber, `%${search}%`),
          like(inventory.description, `%${search}%`)
        )
      );
    }

    // Filter by status
    if (status) {
      conditions.push(eq(inventory.status, status));
    }

    // Filter by type
    if (type) {
      conditions.push(eq(inventory.type, type));
    }

    // Filter by assigned employee
    if (assignedToEmployeeId) {
      conditions.push(eq(inventory.assignedToEmployeeId, parseInt(assignedToEmployeeId)));
    }

    let query = db.select().from(inventory);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(inventory.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      serialNumber,
      description,
      status,
      currentLocation,
      assignedToEmployeeId,
      assignedDate,
      assignedReason
    } = body;

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate assignedToEmployeeId if provided
    if (assignedToEmployeeId !== undefined && assignedToEmployeeId !== null) {
      if (isNaN(parseInt(assignedToEmployeeId))) {
        return NextResponse.json(
          { error: 'Invalid employee ID', code: 'INVALID_EMPLOYEE_ID' },
          { status: 400 }
        );
      }
    }

    // Prepare sanitized data
    const timestamp = new Date().toISOString();
    const insertData = {
      name: name.trim(),
      type: type ? type.trim() : null,
      serialNumber: serialNumber ? serialNumber.trim() : null,
      description: description ? description.trim() : null,
      status: status || 'available',
      currentLocation: currentLocation ? currentLocation.trim() : null,
      assignedToEmployeeId: assignedToEmployeeId ? parseInt(assignedToEmployeeId) : null,
      assignedDate: assignedDate || null,
      assignedReason: assignedReason ? assignedReason.trim() : null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const newRecord = await db
      .insert(inventory)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation for serialNumber
    if ((error as Error).message.includes('UNIQUE constraint failed') || 
        (error as Error).message.includes('unique')) {
      return NextResponse.json(
        { error: 'Serial number already exists', code: 'DUPLICATE_SERIAL_NUMBER' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, parsedId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Inventory item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      type,
      serialNumber,
      description,
      status,
      currentLocation,
      assignedToEmployeeId,
      assignedDate,
      assignedReason
    } = body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate assignedToEmployeeId if provided
    if (assignedToEmployeeId !== undefined && assignedToEmployeeId !== null) {
      if (isNaN(parseInt(assignedToEmployeeId))) {
        return NextResponse.json(
          { error: 'Invalid employee ID', code: 'INVALID_EMPLOYEE_ID' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name.trim();
    if (type !== undefined) updates.type = type ? type.trim() : null;
    if (serialNumber !== undefined) updates.serialNumber = serialNumber ? serialNumber.trim() : null;
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) updates.status = status;
    if (currentLocation !== undefined) updates.currentLocation = currentLocation ? currentLocation.trim() : null;
    if (assignedToEmployeeId !== undefined) updates.assignedToEmployeeId = assignedToEmployeeId ? parseInt(assignedToEmployeeId) : null;
    if (assignedDate !== undefined) updates.assignedDate = assignedDate;
    if (assignedReason !== undefined) updates.assignedReason = assignedReason ? assignedReason.trim() : null;

    const updated = await db
      .update(inventory)
      .set(updates)
      .where(eq(inventory.id, parsedId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    
    // Handle unique constraint violation for serialNumber
    if ((error as Error).message.includes('UNIQUE constraint failed') || 
        (error as Error).message.includes('unique')) {
      return NextResponse.json(
        { error: 'Serial number already exists', code: 'DUPLICATE_SERIAL_NUMBER' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, parsedId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Inventory item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(inventory)
      .where(eq(inventory.id, parsedId))
      .returning();

    return NextResponse.json(
      {
        message: 'Inventory item deleted successfully',
        deleted: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}