import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/export
 * Generates a CSV export of all bookings for the reservation system.
 * This is the daily export mentioned in the requirements.
 */
export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { roomType: true, promoCode: true },
    orderBy: { checkIn: 'asc' },
  });

  // CSV headers
  const headers = [
    'Booking ID',
    'Guest Name',
    'Email',
    'Phone',
    'Room Type',
    'Check-in',
    'Check-out',
    'Nights',
    'Adults',
    'Children',
    'Room Charges',
    'Discount',
    'GST Rate',
    'GST Amount',
    'Total Amount',
    'Promo Code',
    'Payment ID',
    'Payment Status',
    'Booking Status',
    'Booked On',
  ];

  const rows = bookings.map((b) => [
    b.bookingId,
    `"${b.guestName}"`,
    b.email,
    b.phone,
    `"${b.roomType.name}"`,
    b.checkIn,
    b.checkOut,
    b.nights,
    b.adults,
    b.children,
    b.roomCharges,
    b.discount,
    b.gstRate === 0.12 ? '12%' : '18%',
    b.gstAmount,
    b.totalAmount,
    b.promoCode?.code || '',
    b.paymentId || '',
    b.paymentStatus,
    b.status,
    new Date(b.createdAt).toISOString().split('T')[0],
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bookings-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

