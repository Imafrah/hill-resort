import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDateRange } from '@/lib/utils';
import { calculateBookingTotalVariableRates } from '@/lib/gst';

/**
 * GET /api/availability?roomTypeId=xxx&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 * 
 * Checks real-time availability against the daily allotment.
 * Returns nightly rates, GST breakdown, and total if available.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const roomTypeId = searchParams.get('roomTypeId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  if (!roomTypeId || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Missing required parameters: roomTypeId, checkIn, checkOut' },
      { status: 400 }
    );
  }

  // Validate dates
  if (checkIn >= checkOut) {
    return NextResponse.json(
      { error: 'Check-out must be after check-in' },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split('T')[0];
  if (checkIn < today) {
    return NextResponse.json(
      { error: 'Check-in date cannot be in the past' },
      { status: 400 }
    );
  }

  try {
    const dates = getDateRange(checkIn, checkOut);
    
    // Fetch inventory for all requested dates
    const inventory = await prisma.dailyInventory.findMany({
      where: {
        roomTypeId,
        date: { in: dates },
        isBlackout: false,
      },
      orderBy: { date: 'asc' },
    });

    // Check all dates have inventory records
    if (inventory.length < dates.length) {
      return NextResponse.json({
        available: false,
        reason: 'Some dates are not available or are blacked out',
      });
    }

    // Check availability: webAllotment - booked > 0 for every night
    const unavailableDates = inventory.filter(
      (inv) => inv.webAllotment - inv.booked <= 0
    );

    if (unavailableDates.length > 0) {
      return NextResponse.json({
        available: false,
        reason: 'Not enough rooms available for all requested dates',
        unavailableDates: unavailableDates.map((d) => d.date),
      });
    }

    // Build pricing
    const nightlyRates = inventory.map((inv) => ({
      date: inv.date,
      rate: inv.rate,
    }));

    const rates = nightlyRates.map((nr) => nr.rate);
    const total = calculateBookingTotalVariableRates(rates);

    return NextResponse.json({
      available: true,
      nights: dates.length,
      nightlyRates,
      totalRoomCharges: total.subtotal,
      gstRate: total.gstRate,
      gstAmount: total.gstAmount,
      totalAmount: total.total,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

