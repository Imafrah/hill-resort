import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ promos });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const promo = await prisma.promoCode.create({ data: body });
    return NextResponse.json({ success: true, promo });
  } catch (error) {
    console.error('Promo create error:', error);
    return NextResponse.json({ error: 'Failed to create promo' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const promo = await prisma.promoCode.update({ where: { id }, data });
    return NextResponse.json({ success: true, promo });
  } catch (error) {
    console.error('Promo update error:', error);
    return NextResponse.json({ error: 'Failed to update promo' }, { status: 500 });
  }
}

