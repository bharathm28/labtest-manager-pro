import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceRequests, statusHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_STATUSES = [
  'requested',
  'replied',
  'srf_filled',
  'agreed',
  'material_received',
  'testing',
  'completed',
  'reported'
] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const serviceRequestId = parseInt(id);

    // Check if service request exists
    const existingRequest = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, serviceRequestId))
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json(
        { 
          error: 'Service request not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { status, notes, changedBy } = body;

    // Validate status is provided
    if (!status || typeof status !== 'string' || status.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Status is required',
          code: 'MISSING_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate status is one of the allowed values
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Sanitize optional fields
    const sanitizedNotes = notes ? notes.trim() : null;
    const sanitizedChangedBy = changedBy ? changedBy.trim() : null;

    // Update service request status
    const updatedRequest = await db
      .update(serviceRequests)
      .set({
        status: status.trim(),
        updatedAt: now
      })
      .where(eq(serviceRequests.id, serviceRequestId))
      .returning();

    // Create status history entry
    await db
      .insert(statusHistory)
      .values({
        serviceRequestId,
        status: status.trim(),
        notes: sanitizedNotes,
        changedBy: sanitizedChangedBy,
        changedAt: now
      });

    // Return the updated service request
    return NextResponse.json(updatedRequest[0], { status: 200 });

  } catch (error) {
    console.error('POST status update error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}