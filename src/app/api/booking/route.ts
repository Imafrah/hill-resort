import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDateRange, generateBookingId } from '@/lib/utils';
import { calculateBookingTotalVariableRates } from '@/lib/gst';

/**
 * POST /api/booking
 * 
 * Creates a booking with optimistic locking to prevent overbooking.
 * Inside a serialized transaction:
 *   1. Re-checks availability for all nights
 *   2. Applies promo code if provided
 *   3. Calculates final pricing with GST
 *   4. Creates the booking record
 *   5. Increments booked count for each night
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomTypeId,
      checkIn,
      checkOut,
      guestName,
      email,
      phone,
      adults = 2,
      children = 0,
      specialReq = '',
      promoCode,
    } = body;

    // Validate required fields
    if (!roomTypeId || !checkIn || !checkOut || !guestName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dates = getDateRange(checkIn, checkOut);
    if (dates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    // ─── Serialized Transaction (Optimistic Lock) ───
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-check availability for all nights (inside transaction)
      const inventory = await tx.dailyInventory.findMany({
        where: {
          roomTypeId,
          date: { in: dates },
          isBlackout: false,
        },
      });

      if (inventory.length < dates.length) {
        throw new Error('UNAVAILABLE: Some dates are blacked out or not configured');
      }

      const overbooked = inventory.filter((inv) => inv.webAllotment - inv.booked <= 0);
      if (overbooked.length > 0) {
        throw new Error(
          `UNAVAILABLE: No availability on ${overbooked.map((d) => d.date).join(', ')}`
        );
      }

      // 2. Apply promo code if provided
      let discountAmount = 0;
      let promoCodeId: string | undefined;

      if (promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: promoCode.toUpperCase() },
        });

        if (!promo) throw new Error('PROMO_INVALID: Promo code not found');
        if (!promo.isActive) throw new Error('PROMO_INVALID: Promo code is inactive');

        const today = new Date().toISOString().split('T')[0];
        if (today < promo.validFrom || today > promo.validTo) {
          throw new Error('PROMO_INVALID: Promo code is expired or not yet valid');
        }
        if (promo.usedCount >= promo.maxUses) {
          throw new Error('PROMO_INVALID: Promo code usage limit reached');
        }
        if (promo.roomTypeId && promo.roomTypeId !== roomTypeId) {
          throw new Error('PROMO_INVALID: Promo code not valid for this room type');
        }

        const rates = inventory.map((inv) => inv.rate);
        const subtotal = rates.reduce((sum, r) => sum + r, 0);

        if (promo.discountType === 'percentage') {
          discountAmount = Math.round(subtotal * (promo.discountValue / 100));
        } else {
          discountAmount = promo.discountValue;
        }

        promoCodeId = promo.id;

        // Increment usage
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 3. Calculate pricing
      const rates = inventory.map((inv) => inv.rate);
      const pricing = calculateBookingTotalVariableRates(rates, discountAmount);

      // 4. Generate simulated payment ID
      const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // 5. Create booking
      const booking = await tx.booking.create({
        data: {
          bookingId: generateBookingId(),
          guestName,
          email,
          phone,
          roomTypeId,
          checkIn,
          checkOut,
          nights: dates.length,
          adults,
          children,
          specialReq,
          roomCharges: pricing.subtotal,
          discount: pricing.discount,
          taxableAmount: pricing.taxableAmount,
          gstRate: pricing.gstRate,
          gstAmount: pricing.gstAmount,
          totalAmount: pricing.total,
          promoCodeId,
          paymentId,
          paymentStatus: 'paid',
          status: 'confirmed',
        },
      });

      // 6. Increment booked count for each night
      for (const date of dates) {
        await tx.dailyInventory.updateMany({
          where: { roomTypeId, date },
          data: { booked: { increment: 1 } },
        });
      }

      return booking;
    });

    return NextResponse.json({
      success: true,
      booking: {
        bookingId: result.bookingId,
        guestName: result.guestName,
        checkIn: result.checkIn,
        checkOut: result.checkOut,
        nights: result.nights,
        roomCharges: result.roomCharges,
        discount: result.discount,
        gstRate: result.gstRate,
        gstAmount: result.gstAmount,
        totalAmount: result.totalAmount,
        paymentId: result.paymentId,
        status: result.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('UNAVAILABLE:')) {
      return NextResponse.json(
        { error: message.replace('UNAVAILABLE: ', '') },
        { status: 409 }
      );
    }
    if (message.startsWith('PROMO_INVALID:')) {
      return NextResponse.json(
        { error: message.replace('PROMO_INVALID: ', '') },
        { status: 400 }
      );
    }

    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/booking?id=xxx
 * Fetch a booking by bookingId
 */
export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get('id');
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingId },
    include: { roomType: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

