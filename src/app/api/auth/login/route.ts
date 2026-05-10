import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Authenticate with InsForge
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Fetch role from profiles table
    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'user';

    // Build response with role cookie
    const response = NextResponse.json({
      token: data.accessToken,
      role,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.profile?.name || email.split('@')[0],
      },
    });

    // Set cookies for middleware route protection
    response.cookies.set('role', role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('token', data.accessToken, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
