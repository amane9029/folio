import { NextRequest, NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge';

function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('bad jwt');

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
}

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const userId = payload.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token: no sub' }, { status: 401 });
    }

    const { data: profiles, error: profileError } = await insforgeAdmin.database
      .from('profiles')
      .select('role')
      .eq('id', userId);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || 'Failed to read profile.' },
        { status: 500 },
      );
    }

    const existingRole = Array.isArray(profiles) ? profiles[0]?.role : null;

    if (existingRole) {
      return NextResponse.json({ role: existingRole });
    }

    const { error: insertError } = await insforgeAdmin.database
      .from('profiles')
      .insert([{ id: userId, role: 'user' }]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || 'Failed to create profile.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ role: 'user' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 },
    );
  }
}
