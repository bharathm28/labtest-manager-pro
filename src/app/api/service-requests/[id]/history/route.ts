import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { statusHistory, serviceRequests } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid service request ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const serviceRequestId = parseInt(id);

    // Verify service request exists
    const serviceRequest = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, serviceRequestId))
      .limit(1);

    if (serviceRequest.length === 0) {
      return NextResponse.json(
        { 
          error: 'Service request not found',
          code: 'SERVICE_REQUEST_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Query all status history entries for this service request
    const history = await db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.serviceRequestId, serviceRequestId))
      .orderBy(asc(statusHistory.changedAt));

    return NextResponse.json(history, { status: 200 });

  } catch (error) {
    console.error('GET status history error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}