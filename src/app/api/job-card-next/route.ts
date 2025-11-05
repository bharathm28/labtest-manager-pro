import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceRequests } from '@/db/schema';
import { like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get current date in YYMMDD format
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Build the date prefix for today's job cards
    const datePrefix = `ARTL-RF-${dateStr}-`;

    // Query all job card numbers that start with today's prefix
    const existingJobCards = await db
      .select({
        jobCardNumber: serviceRequests.jobCardNumber
      })
      .from(serviceRequests)
      .where(like(serviceRequests.jobCardNumber, `${datePrefix}%`));

    // Extract sequence numbers from existing job cards
    let maxSequence = 0;

    if (existingJobCards.length > 0) {
      for (const record of existingJobCards) {
        // Extract the sequence number (XX part) from ARTL-RF-YYMMDD-XX-01-01
        const parts = record.jobCardNumber.split('-');
        if (parts.length >= 4) {
          const sequenceStr = parts[3];
          const sequence = parseInt(sequenceStr, 10);
          if (!isNaN(sequence) && sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      }
    }

    // Calculate next sequence number
    const nextSequence = maxSequence + 1;

    // Validate sequence number doesn't exceed 99
    if (nextSequence > 99) {
      return NextResponse.json(
        { 
          error: 'Maximum job cards per day (99) exceeded',
          code: 'MAX_DAILY_LIMIT_REACHED'
        },
        { status: 400 }
      );
    }

    // Pad sequence number with leading zero if needed
    const paddedSequence = nextSequence.toString().padStart(2, '0');

    // Build complete job card number
    const nextJobCardNumber = `${datePrefix}${paddedSequence}-01-01`;

    // Return the next available job card number
    return NextResponse.json({
      nextJobCardNumber,
      date: dateStr,
      sequenceNumber: nextSequence
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}