import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!staff || staff.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionData = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      title: staff.title,
    };

    const response = NextResponse.json({
      success: true,
      staff: sessionData,
    });

    // Set simple HTTP-only cookie for session
    response.cookies.set('misty_staff_session', JSON.stringify(sessionData), {
      httpOnly: false, // Accessible to client components for display
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('misty_staff_session');
  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const staff = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, staff });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('misty_staff_session');
  return response;
}
