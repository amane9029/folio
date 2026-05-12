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

export async function GET(request: NextRequest) {
  try {
    // Try getting token from cookie first, then Authorization header
    const cookieToken = request.cookies.get('token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;
    const role = request.cookies.get('role')?.value || 'user';
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    // Decode JWT manually to get userId
    let userId: string | null = null;
    try {
      const payload = decodeJwtPayload(token);
      userId = payload.sub || null;
      if (!userId) throw new Error('no sub');
    } catch(e: any) {
      return NextResponse.json({ error: 'Invalid token: ' + e.message }, { status: 401 });
    }

    let query = insforgeAdmin.database
      .from('books')
      .select();

    if (role !== 'admin') {
      query = query.eq('uploaded_by', userId);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Books API query failed:', {
        message: error.message || 'Failed to fetch books.',
        code: (error as { error?: string } | null)?.error ?? null,
        statusCode: (error as { statusCode?: number } | null)?.statusCode ?? 500,
      });

      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
