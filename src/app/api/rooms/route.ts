import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/rooms?slug=xxx
 * Returns a single room type by slug, or all room types if no slug
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (slug) {
    const room = await prisma.roomType.findUnique({ where: { slug } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ room });
  }

  const rooms = await prisma.roomType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ rooms });
}

