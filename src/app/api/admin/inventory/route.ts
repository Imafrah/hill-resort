import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/inventory?roomTypeId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const roomTypeId = searchParams.get('roomTypeId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!roomTypeId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const inventory = await prisma.dailyInventory.findMany({
    where: {
      roomTypeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({ inventory });
}

/**
 * PATCH /api/admin/inventory
 * Batch update inventory records (rate, webAllotment, isBlackout)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { updates } = await request.json();

    for (const update of updates) {
      const { id, ...data } = update;
      
      // Safety: webAllotment cannot go below booked count
      if (data.webAllotment !== undefined) {
        const current = await prisma.dailyInventory.findUnique({ where: { id } });
        if (current && data.webAllotment < current.booked) {
          return NextResponse.json(
            { error: `Cannot set allotment below booked count (${current.booked}) for ${current.date}` },
            { status: 400 }
          );
        }
      }

      await prisma.dailyInventory.update({
        where: { id },
        data,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

