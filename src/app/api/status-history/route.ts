import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { statusHistory, serviceRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const serviceRequestId = searchParams.get('serviceRequestId');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(statusHistory)
        .where(eq(statusHistory.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Status history entry not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(statusHistory);

    // Filter by serviceRequestId if provided
    if (serviceRequestId) {
      if (isNaN(parseInt(serviceRequestId))) {
        return NextResponse.json(
          { error: 'Valid serviceRequestId is required', code: 'INVALID_SERVICE_REQUEST_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(statusHistory.serviceRequestId, parseInt(serviceRequestId)));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceRequestId, status, notes, changedBy } = body;

    // Validate required fields
    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'serviceRequestId is required', code: 'MISSING_SERVICE_REQUEST_ID' },
        { status: 400 }
      );
    }

    if (typeof serviceRequestId !== 'number' || isNaN(serviceRequestId)) {
      return NextResponse.json(
        { error: 'serviceRequestId must be a valid integer', code: 'INVALID_SERVICE_REQUEST_ID' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'status is required and must be a string', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    // Trim and validate status
    const trimmedStatus = status.trim();
    if (!trimmedStatus) {
      return NextResponse.json(
        { error: 'status cannot be empty', code: 'EMPTY_STATUS' },
        { status: 400 }
      );
    }

    // Verify that the service request exists
    const existingServiceRequest = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, serviceRequestId))
      .limit(1);

    if (existingServiceRequest.length === 0) {
      return NextResponse.json(
        { error: 'Service request not found', code: 'SERVICE_REQUEST_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create new status history entry
    const newRecord = await db
      .insert(statusHistory)
      .values({
        serviceRequestId,
        status: trimmedStatus,
        notes: notes ? (typeof notes === 'string' ? notes.trim() : notes) : null,
        changedBy: changedBy ? (typeof changedBy === 'string' ? changedBy.trim() : changedBy) : null,
        changedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
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

    // Check if record exists
    const existing = await db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Status history entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { serviceRequestId, status, notes, changedBy } = body;

    // Build update object
    const updates: Record<string, any> = {};

    // Validate serviceRequestId if provided
    if (serviceRequestId !== undefined) {
      if (typeof serviceRequestId !== 'number' || isNaN(serviceRequestId)) {
        return NextResponse.json(
          { error: 'serviceRequestId must be a valid integer', code: 'INVALID_SERVICE_REQUEST_ID' },
          { status: 400 }
        );
      }

      // Verify that the service request exists
      const existingServiceRequest = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, serviceRequestId))
        .limit(1);

      if (existingServiceRequest.length === 0) {
        return NextResponse.json(
          { error: 'Service request not found', code: 'SERVICE_REQUEST_NOT_FOUND' },
          { status: 400 }
        );
      }

      updates.serviceRequestId = serviceRequestId;
    }

    // Validate status if provided
    if (status !== undefined) {
      if (typeof status !== 'string') {
        return NextResponse.json(
          { error: 'status must be a string', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }

      const trimmedStatus = status.trim();
      if (!trimmedStatus) {
        return NextResponse.json(
          { error: 'status cannot be empty', code: 'EMPTY_STATUS' },
          { status: 400 }
        );
      }

      updates.status = trimmedStatus;
    }

    if (notes !== undefined) {
      updates.notes = notes ? (typeof notes === 'string' ? notes.trim() : notes) : null;
    }

    if (changedBy !== undefined) {
      updates.changedBy = changedBy ? (typeof changedBy === 'string' ? changedBy.trim() : changedBy) : null;
    }

    // Update the record
    const updated = await db
      .update(statusHistory)
      .set(updates)
      .where(eq(statusHistory.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
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

    // Check if record exists
    const existing = await db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Status history entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the record
    const deleted = await db
      .delete(statusHistory)
      .where(eq(statusHistory.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Status history entry deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}