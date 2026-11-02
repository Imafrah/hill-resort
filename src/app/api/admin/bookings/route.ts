import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { roomType: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ bookings });
}

