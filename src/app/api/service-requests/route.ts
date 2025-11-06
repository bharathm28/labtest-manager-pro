import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceRequests, activityLogs, statusHistory, testBeds } from '@/db/schema';
import { eq, like, and, or, desc, ne } from 'drizzle-orm';

const VALID_STATUSES = [
  'requested',
  'replied',
  'srf_filled',
  'agreed',
  'material_received',
  'testing',
  'completed',
  'reported'
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Service request not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');

    let query = db.select().from(serviceRequests);

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(serviceRequests.jobCardNumber, `%${search}%`),
          like(serviceRequests.productName, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(serviceRequests.status, status));
    }

    if (companyId) {
      const companyIdInt = parseInt(companyId);
      if (!isNaN(companyIdInt)) {
        conditions.push(eq(serviceRequests.companyId, companyIdInt));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(serviceRequests.createdAt))
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

    // Validate required fields
    if (!body.jobCardNumber || typeof body.jobCardNumber !== 'string' || !body.jobCardNumber.trim()) {
      return NextResponse.json(
        { error: 'Job card number is required', code: 'MISSING_JOB_CARD_NUMBER' },
        { status: 400 }
      );
    }

    if (!body.companyId || isNaN(parseInt(body.companyId))) {
      return NextResponse.json(
        { error: 'Valid company ID is required', code: 'INVALID_COMPANY_ID' },
        { status: 400 }
      );
    }

    if (!body.productName || typeof body.productName !== 'string' || !body.productName.trim()) {
      return NextResponse.json(
        { error: 'Product name is required', code: 'MISSING_PRODUCT_NAME' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const status = body.status || 'requested';
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults and sanitization
    const insertData: any = {
      jobCardNumber: body.jobCardNumber.trim(),
      companyId: parseInt(body.companyId),
      productName: body.productName.trim(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optional fields
    if (body.contactPersonId !== undefined && body.contactPersonId !== null) {
      insertData.contactPersonId = parseInt(body.contactPersonId);
    }
    if (body.productDescription) {
      insertData.productDescription = body.productDescription.trim();
    }
    if (body.quantity !== undefined && body.quantity !== null) {
      insertData.quantity = parseInt(body.quantity);
    }
    if (body.testType) {
      insertData.testType = body.testType.trim();
    }
    if (body.specialRequirements) {
      insertData.specialRequirements = body.specialRequirements.trim();
    }
    if (body.requestedDate) {
      insertData.requestedDate = body.requestedDate;
    }
    if (body.agreedDate) {
      insertData.agreedDate = body.agreedDate;
    }
    if (body.materialReceivedDate) {
      insertData.materialReceivedDate = body.materialReceivedDate;
    }
    if (body.testingStartDate) {
      insertData.testingStartDate = body.testingStartDate;
    }
    if (body.testingEndDate) {
      insertData.testingEndDate = body.testingEndDate;
    }
    if (body.completionDate) {
      insertData.completionDate = body.completionDate;
    }
    if (body.assignedEmployeeId !== undefined && body.assignedEmployeeId !== null) {
      insertData.assignedEmployeeId = parseInt(body.assignedEmployeeId);
    }
    if (body.assignedTestbedId !== undefined && body.assignedTestbedId !== null) {
      insertData.assignedTestbedId = parseInt(body.assignedTestbedId);
    }
    if (body.dcNumber) {
      insertData.dcNumber = body.dcNumber.trim();
    }
    if (body.dcVerified !== undefined) {
      insertData.dcVerified = Boolean(body.dcVerified);
    }
    if (body.notes) {
      insertData.notes = body.notes.trim();
    }

    const newRecord = await db
      .insert(serviceRequests)
      .values(insertData)
      .returning();

    // Log the creation
    await db.insert(activityLogs).values({
      entityType: 'service_request',
      entityId: newRecord[0].id,
      action: 'created',
      newValue: status,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify({
        jobCardNumber: newRecord[0].jobCardNumber,
        productName: newRecord[0].productName
      })
    });

    // Create initial status history entry
    await db.insert(statusHistory).values({
      serviceRequestId: newRecord[0].id,
      status: status,
      notes: `Service request created with status: ${status}`,
      changedBy: 'System',
      changedAt: new Date().toISOString(),
    });

    return NextResponse.json(newRecord[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Job card number already exists', code: 'DUPLICATE_JOB_CARD_NUMBER' },
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
    const searchParams = request.nextUrl.searchParams;
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
      .from(serviceRequests)
      .where(eq(serviceRequests.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Service request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate fields if provided
    if (body.jobCardNumber !== undefined) {
      if (!body.jobCardNumber || typeof body.jobCardNumber !== 'string' || !body.jobCardNumber.trim()) {
        return NextResponse.json(
          { error: 'Job card number cannot be empty', code: 'INVALID_JOB_CARD_NUMBER' },
          { status: 400 }
        );
      }
    }

    if (body.companyId !== undefined) {
      if (!body.companyId || isNaN(parseInt(body.companyId))) {
        return NextResponse.json(
          { error: 'Valid company ID is required', code: 'INVALID_COMPANY_ID' },
          { status: 400 }
        );
      }
    }

    if (body.productName !== undefined) {
      if (!body.productName || typeof body.productName !== 'string' || !body.productName.trim()) {
        return NextResponse.json(
          { error: 'Product name cannot be empty', code: 'INVALID_PRODUCT_NAME' },
          { status: 400 }
        );
      }
    }

    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Track changes for activity logging and status history
    const changes: Array<{fieldName: string, oldValue: any, newValue: any}> = [];
    const currentTimestamp = new Date().toISOString();
    let statusChanged = false;
    let testbedChanged = false;
    let oldTestbedId = existing[0].assignedTestbedId;

    if (body.jobCardNumber !== undefined) {
      updateData.jobCardNumber = body.jobCardNumber.trim();
      if (updateData.jobCardNumber !== existing[0].jobCardNumber) {
        changes.push({ fieldName: 'jobCardNumber', oldValue: existing[0].jobCardNumber, newValue: updateData.jobCardNumber });
      }
    }
    if (body.companyId !== undefined) {
      updateData.companyId = parseInt(body.companyId);
      if (updateData.companyId !== existing[0].companyId) {
        changes.push({ fieldName: 'companyId', oldValue: String(existing[0].companyId), newValue: String(updateData.companyId) });
      }
    }
    if (body.contactPersonId !== undefined) {
      updateData.contactPersonId = body.contactPersonId === null ? null : parseInt(body.contactPersonId);
      if (updateData.contactPersonId !== existing[0].contactPersonId) {
        changes.push({ fieldName: 'contactPersonId', oldValue: String(existing[0].contactPersonId), newValue: String(updateData.contactPersonId) });
      }
    }
    if (body.productName !== undefined) {
      updateData.productName = body.productName.trim();
      if (updateData.productName !== existing[0].productName) {
        changes.push({ fieldName: 'productName', oldValue: existing[0].productName, newValue: updateData.productName });
      }
    }
    if (body.productDescription !== undefined) {
      updateData.productDescription = body.productDescription ? body.productDescription.trim() : null;
    }
    if (body.quantity !== undefined) {
      updateData.quantity = body.quantity === null ? null : parseInt(body.quantity);
    }
    if (body.testType !== undefined) {
      updateData.testType = body.testType ? body.testType.trim() : null;
    }
    if (body.specialRequirements !== undefined) {
      updateData.specialRequirements = body.specialRequirements ? body.specialRequirements.trim() : null;
    }
    
    // Status change handling with automatic completion timestamp
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (updateData.status !== existing[0].status) {
        statusChanged = true;
        changes.push({ fieldName: 'status', oldValue: existing[0].status, newValue: updateData.status });
        
        // Automatic completion timestamp capture
        if (updateData.status === 'completed' && !existing[0].completionDate) {
          updateData.completionDate = currentTimestamp;
          changes.push({ fieldName: 'completionDate', oldValue: null, newValue: currentTimestamp });
        }
        
        // Automatic testing start date capture
        if (updateData.status === 'testing' && !existing[0].testingStartDate) {
          updateData.testingStartDate = currentTimestamp;
          changes.push({ fieldName: 'testingStartDate', oldValue: null, newValue: currentTimestamp });
        }
      }
    }
    
    if (body.requestedDate !== undefined) {
      updateData.requestedDate = body.requestedDate;
    }
    if (body.agreedDate !== undefined) {
      updateData.agreedDate = body.agreedDate;
    }
    if (body.materialReceivedDate !== undefined) {
      updateData.materialReceivedDate = body.materialReceivedDate;
    }
    if (body.testingStartDate !== undefined) {
      updateData.testingStartDate = body.testingStartDate;
    }
    if (body.testingEndDate !== undefined) {
      updateData.testingEndDate = body.testingEndDate;
    }
    if (body.completionDate !== undefined) {
      updateData.completionDate = body.completionDate;
    }
    if (body.assignedEmployeeId !== undefined) {
      updateData.assignedEmployeeId = body.assignedEmployeeId === null ? null : parseInt(body.assignedEmployeeId);
      if (updateData.assignedEmployeeId !== existing[0].assignedEmployeeId) {
        changes.push({ fieldName: 'assignedEmployeeId', oldValue: String(existing[0].assignedEmployeeId), newValue: String(updateData.assignedEmployeeId) });
      }
    }
    
    // Test bed assignment change detection
    if (body.assignedTestbedId !== undefined) {
      updateData.assignedTestbedId = body.assignedTestbedId === null ? null : parseInt(body.assignedTestbedId);
      if (updateData.assignedTestbedId !== existing[0].assignedTestbedId) {
        testbedChanged = true;
        oldTestbedId = existing[0].assignedTestbedId;
        changes.push({ fieldName: 'assignedTestbedId', oldValue: String(existing[0].assignedTestbedId), newValue: String(updateData.assignedTestbedId) });
      }
    }
    
    if (body.dcNumber !== undefined) {
      updateData.dcNumber = body.dcNumber ? body.dcNumber.trim() : null;
    }
    if (body.dcVerified !== undefined) {
      updateData.dcVerified = Boolean(body.dcVerified);
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes ? body.notes.trim() : null;
    }

    // Perform update in a transaction to handle test bed synchronization
    const updated = await db.transaction(async (tx) => {
      // Update the service request
      const updatedRecord = await tx
        .update(serviceRequests)
        .set(updateData)
        .where(eq(serviceRequests.id, parseInt(id)))
        .returning();

      // Handle test bed status synchronization
      if (statusChanged || testbedChanged) {
        const currentStatus = updateData.status || existing[0].status;
        const currentTestbedId = updateData.assignedTestbedId !== undefined ? updateData.assignedTestbedId : existing[0].assignedTestbedId;

        // Status changed to "testing" - set test bed to "in_use"
        if (statusChanged && currentStatus === 'testing' && currentTestbedId) {
          await tx.update(testBeds)
            .set({ status: 'in_use' })
            .where(eq(testBeds.id, currentTestbedId));
        }

        // Status changed to "completed" - check if test bed should be set to "available"
        if (statusChanged && currentStatus === 'completed' && currentTestbedId) {
          // Check if there are other jobs using this test bed
          const otherActiveJobs = await tx
            .select()
            .from(serviceRequests)
            .where(
              and(
                eq(serviceRequests.assignedTestbedId, currentTestbedId),
                eq(serviceRequests.status, 'testing'),
                ne(serviceRequests.id, parseInt(id))
              )
            )
            .limit(1);

          // If no other active jobs, set test bed to available
          if (otherActiveJobs.length === 0) {
            await tx.update(testBeds)
              .set({ status: 'available' })
              .where(eq(testBeds.id, currentTestbedId));
          }
        }

        // Test bed reassignment - update both old and new test beds
        if (testbedChanged) {
          // Update old test bed if it exists
          if (oldTestbedId) {
            // Check if there are other jobs using the old test bed
            const otherJobsOnOldTestbed = await tx
              .select()
              .from(serviceRequests)
              .where(
                and(
                  eq(serviceRequests.assignedTestbedId, oldTestbedId),
                  eq(serviceRequests.status, 'testing'),
                  ne(serviceRequests.id, parseInt(id))
                )
              )
              .limit(1);

            // If no other active jobs on old test bed, set it to available
            if (otherJobsOnOldTestbed.length === 0) {
              await tx.update(testBeds)
                .set({ status: 'available' })
                .where(eq(testBeds.id, oldTestbedId));
            }
          }

          // Update new test bed if it exists and job is in testing status
          if (currentTestbedId && currentStatus === 'testing') {
            await tx.update(testBeds)
              .set({ status: 'in_use' })
              .where(eq(testBeds.id, currentTestbedId));
          }
        }
      }

      return updatedRecord;
    });

    // Log significant changes
    for (const change of changes) {
      await db.insert(activityLogs).values({
        entityType: 'service_request',
        entityId: parseInt(id),
        action: 'updated',
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        timestamp: currentTimestamp,
        metadata: JSON.stringify({ jobCardNumber: updated[0].jobCardNumber })
      });
    }

    // Create status history entry if status changed
    if (statusChanged) {
      await db.insert(statusHistory).values({
        serviceRequestId: parseInt(id),
        status: updateData.status,
        notes: `Status changed from ${existing[0].status} to ${updateData.status}`,
        changedBy: 'System',
        changedAt: currentTimestamp,
      });
    }

    // Create status history entry for test bed assignment change
    if (testbedChanged) {
      await db.insert(statusHistory).values({
        serviceRequestId: parseInt(id),
        status: updateData.status || existing[0].status,
        notes: `Test bed assignment changed from ${oldTestbedId || 'None'} to ${updateData.assignedTestbedId || 'None'}`,
        changedBy: 'System',
        changedAt: currentTimestamp,
      });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);

    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Job card number already exists', code: 'DUPLICATE_JOB_CARD_NUMBER' },
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
    const searchParams = request.nextUrl.searchParams;
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
      .from(serviceRequests)
      .where(eq(serviceRequests.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Service request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(serviceRequests)
      .where(eq(serviceRequests.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Service request deleted successfully',
        deletedRecord: deleted[0]
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