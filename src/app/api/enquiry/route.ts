import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processEnquiry } from '@/lib/ai-router';
import { generateEnquiryId } from '@/lib/utils';

/**
 * POST /api/enquiry
 * 
 * Accepts an enquiry (from web form, simulated email, or simulated WhatsApp),
 * processes it through the AI router, and stores the result.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source = 'web_form',
      guestName = '',
      guestEmail = '',
      guestPhone = '',
      message,
      // Structured event form fields
      eventType,
      eventDateFrom,
      eventDateTo,
      expectedGuests,
      estimatedBudget,
      requirements,
    } = body;

    if (!message && !eventType) {
      return NextResponse.json(
        { error: 'Message or event type is required' },
        { status: 400 }
      );
    }

    // For structured event forms, build a message for AI processing
    const fullMessage = eventType
      ? buildEventMessage(eventType, eventDateFrom, eventDateTo, expectedGuests, estimatedBudget, requirements, message)
      : message;

    // Process through AI router (Dual-mode: Gemini LLM if key present, else local NLP engine)
    const ai = await processEnquiry(fullMessage, source, guestName);

    // Override category for structured event forms
    const finalCategory = eventType
      ? (eventType === 'wedding' ? 'wedding' : eventType === 'corporate_offsite' ? 'corporate_offsite' : ai.classification.category)
      : ai.classification.category;

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryId: generateEnquiryId(),
        source,
        guestName,
        guestEmail,
        guestPhone,
        message: fullMessage,
        eventType: eventType || null,
        eventDateFrom: eventDateFrom || null,
        eventDateTo: eventDateTo || null,
        expectedGuests: expectedGuests ? Number(expectedGuests) : null,
        estimatedBudget: estimatedBudget || null,
        requirements: requirements || null,
        category: finalCategory,
        confidence: ai.classification.confidence,
        isLowConfidence: ai.classification.isLowConfidence,
        extractedDates: JSON.stringify(ai.entities.dates),
        extractedGuests: ai.entities.guestCount,
        extractedBudget: ai.entities.budget,
        assignedTo: ai.assignment.assignedTo,
        alertGM: ai.assignment.alertGM,
        aiDraft: ai.draftReply,
        status: 'new',
      },
    });

    return NextResponse.json({
      success: true,
      enquiryId: enquiry.enquiryId,
      message: 'Thank you for your enquiry. Our team will get back to you shortly.',
    });
  } catch (error) {
    console.error('Enquiry submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit enquiry' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enquiry
 * Fetch enquiries with optional filters (for admin)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const assignedTo = searchParams.get('assignedTo');

  const where: Record<string, unknown> = {};
  if (category && category !== 'all') where.category = category;
  if (status && status !== 'all') where.status = status;
  if (assignedTo) where.assignedTo = assignedTo;

  const enquiries = await prisma.enquiry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ enquiries });
}

/**
 * PATCH /api/enquiry
 * Update an enquiry (re-route, change status, add notes)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Enquiry ID is required' }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, enquiry });
  } catch (error) {
    console.error('Enquiry update error:', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}

function buildEventMessage(
  eventType: string,
  dateFrom?: string,
  dateTo?: string,
  guests?: number,
  budget?: string,
  requirements?: string,
  additionalMessage?: string,
): string {
  const parts: string[] = [];

  if (eventType === 'wedding') parts.push('Wedding enquiry');
  else if (eventType === 'corporate_offsite') parts.push('Corporate offsite enquiry');
  else parts.push(`Event enquiry (${eventType})`);

  if (dateFrom && dateTo) parts.push(`from ${dateFrom} to ${dateTo}`);
  else if (dateFrom) parts.push(`on ${dateFrom}`);

  if (guests) parts.push(`for ${guests} guests`);
  if (budget) parts.push(`budget ${budget}`);
  if (requirements) parts.push(`Requirements: ${requirements}`);
  if (additionalMessage) parts.push(additionalMessage);

  return parts.join('. ');
}

