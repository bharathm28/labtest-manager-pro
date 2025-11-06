import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskNotifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_NOTIFICATION_TYPES = ['1_day', '6_hours', '1_hour'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const notification = await db
        .select()
        .from(taskNotifications)
        .where(eq(taskNotifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(notification[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const taskId = searchParams.get('taskId');
    const employeeId = searchParams.get('employeeId');
    const sent = searchParams.get('sent');
    const notificationType = searchParams.get('notificationType');

    // Build WHERE conditions
    const conditions = [];

    if (taskId) {
      if (isNaN(parseInt(taskId))) {
        return NextResponse.json(
          { error: 'Valid taskId is required', code: 'INVALID_TASK_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(taskNotifications.taskId, parseInt(taskId)));
    }

    if (employeeId) {
      if (isNaN(parseInt(employeeId))) {
        return NextResponse.json(
          { error: 'Valid employeeId is required', code: 'INVALID_EMPLOYEE_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(taskNotifications.employeeId, parseInt(employeeId)));
    }

    if (sent !== null) {
      if (sent === 'true') {
        conditions.push(eq(taskNotifications.sent, true));
      } else if (sent === 'false') {
        conditions.push(eq(taskNotifications.sent, false));
      }
    }

    if (notificationType) {
      if (!VALID_NOTIFICATION_TYPES.includes(notificationType as any)) {
        return NextResponse.json(
          { 
            error: 'Invalid notification type. Must be one of: 1_day, 6_hours, 1_hour', 
            code: 'INVALID_NOTIFICATION_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(taskNotifications.notificationType, notificationType));
    }

    let query = db.select().from(taskNotifications);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const notifications = await query
      .orderBy(desc(taskNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(notifications, { status: 200 });
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
    const { taskId, notificationType, scheduledFor, employeeId, message } = body;

    // Validate taskId
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required', code: 'MISSING_TASK_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(taskId))) {
      return NextResponse.json(
        { error: 'Valid taskId is required', code: 'INVALID_TASK_ID' },
        { status: 400 }
      );
    }

    // Validate notificationType
    if (!notificationType) {
      return NextResponse.json(
        { error: 'notificationType is required', code: 'MISSING_NOTIFICATION_TYPE' },
        { status: 400 }
      );
    }

    if (!VALID_NOTIFICATION_TYPES.includes(notificationType)) {
      return NextResponse.json(
        { 
          error: 'Invalid notification type. Must be one of: 1_day, 6_hours, 1_hour', 
          code: 'INVALID_NOTIFICATION_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate scheduledFor
    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor is required', code: 'MISSING_SCHEDULED_FOR' },
        { status: 400 }
      );
    }

    // Validate employeeId
    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId is required', code: 'MISSING_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(employeeId))) {
      return NextResponse.json(
        { error: 'Valid employeeId is required', code: 'INVALID_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Validate message
    if (!message) {
      return NextResponse.json(
        { error: 'message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message must be a non-empty string', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }

    // Create notification
    const newNotification = await db
      .insert(taskNotifications)
      .values({
        taskId: parseInt(taskId),
        notificationType,
        scheduledFor,
        employeeId: parseInt(employeeId),
        message: message.trim(),
        sent: false,
        sentAt: null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
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

    // Check if notification exists
    const existing = await db
      .select()
      .from(taskNotifications)
      .where(eq(taskNotifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if ('sent' in body) {
      if (typeof body.sent !== 'boolean') {
        return NextResponse.json(
          { error: 'sent must be a boolean', code: 'INVALID_SENT' },
          { status: 400 }
        );
      }
      updates.sent = body.sent;
    }

    if ('sentAt' in body) {
      updates.sentAt = body.sentAt;
    }

    if ('message' in body) {
      if (typeof body.message !== 'string' || body.message.trim().length === 0) {
        return NextResponse.json(
          { error: 'message must be a non-empty string', code: 'INVALID_MESSAGE' },
          { status: 400 }
        );
      }
      updates.message = body.message.trim();
    }

    if ('scheduledFor' in body) {
      updates.scheduledFor = body.scheduledFor;
    }

    if ('notificationType' in body) {
      if (!VALID_NOTIFICATION_TYPES.includes(body.notificationType)) {
        return NextResponse.json(
          { 
            error: 'Invalid notification type. Must be one of: 1_day, 6_hours, 1_hour', 
            code: 'INVALID_NOTIFICATION_TYPE' 
          },
          { status: 400 }
        );
      }
      updates.notificationType = body.notificationType;
    }

    // Update notification
    const updated = await db
      .update(taskNotifications)
      .set(updates)
      .where(eq(taskNotifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
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

    // Check if notification exists
    const existing = await db
      .select()
      .from(taskNotifications)
      .where(eq(taskNotifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete notification
    const deleted = await db
      .delete(taskNotifications)
      .where(eq(taskNotifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Notification deleted successfully',
        notification: deleted[0]
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