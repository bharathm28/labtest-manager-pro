import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactPersons, companies } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const contactPerson = await db
        .select()
        .from(contactPersons)
        .where(eq(contactPersons.id, parseInt(id)))
        .limit(1);

      if (contactPerson.length === 0) {
        return NextResponse.json(
          { error: 'Contact person not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(contactPerson[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');

    let query = db.select().from(contactPersons);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(contactPersons.name, `%${search}%`),
          like(contactPersons.email, `%${search}%`)
        )
      );
    }

    if (companyId) {
      if (isNaN(parseInt(companyId))) {
        return NextResponse.json(
          { error: 'Valid company ID is required', code: 'INVALID_COMPANY_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(contactPersons.companyId, parseInt(companyId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

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
    const { companyId, name, designation, phone, email } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required', code: 'MISSING_COMPANY_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(companyId))) {
      return NextResponse.json(
        { error: 'Valid company ID is required', code: 'INVALID_COMPANY_ID' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, parseInt(companyId)))
      .limit(1);

    if (company.length === 0) {
      return NextResponse.json(
        { error: 'Company not found', code: 'COMPANY_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedDesignation = designation?.trim() || null;
    const sanitizedPhone = phone?.trim() || null;

    // Create contact person
    const newContactPerson = await db
      .insert(contactPersons)
      .values({
        companyId: parseInt(companyId),
        name: sanitizedName,
        designation: sanitizedDesignation,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newContactPerson[0], { status: 201 });
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

    // Check if record exists
    const existing = await db
      .select()
      .from(contactPersons)
      .where(eq(contactPersons.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Contact person not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { companyId, name, designation, phone, email } = body;

    // Build update object with only provided fields
    const updates: {
      companyId?: number;
      name?: string;
      designation?: string | null;
      phone?: string | null;
      email?: string;
    } = {};

    // Validate and sanitize provided fields
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (!email || email.trim() === '') {
        return NextResponse.json(
          { error: 'Email cannot be empty', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }
      updates.email = email.trim().toLowerCase();
    }

    if (companyId !== undefined) {
      if (isNaN(parseInt(companyId))) {
        return NextResponse.json(
          { error: 'Valid company ID is required', code: 'INVALID_COMPANY_ID' },
          { status: 400 }
        );
      }

      // Verify company exists
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(companyId)))
        .limit(1);

      if (company.length === 0) {
        return NextResponse.json(
          { error: 'Company not found', code: 'COMPANY_NOT_FOUND' },
          { status: 400 }
        );
      }

      updates.companyId = parseInt(companyId);
    }

    if (designation !== undefined) {
      updates.designation = designation?.trim() || null;
    }

    if (phone !== undefined) {
      updates.phone = phone?.trim() || null;
    }

    // Perform update
    const updated = await db
      .update(contactPersons)
      .set(updates)
      .where(eq(contactPersons.id, parseInt(id)))
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

    // Check if record exists
    const existing = await db
      .select()
      .from(contactPersons)
      .where(eq(contactPersons.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Contact person not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete record
    const deleted = await db
      .delete(contactPersons)
      .where(eq(contactPersons.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Contact person deleted successfully',
        deletedRecord: deleted[0],
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