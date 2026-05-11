import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import { insforge } from '@/lib/insforge';

export async function GET(request: NextRequest) {
  try {
    // Try getting token from cookie first, then Authorization header
    const cookieToken = request.cookies.get('token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    // Decode JWT manually to get userId
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('bad jwt');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (!payload.sub) throw new Error('no sub');
    } catch(e: any) {
      return NextResponse.json({ error: 'Invalid token: ' + e.message }, { status: 401 });
    }

    const insforgeUser = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!
    });
    insforgeUser.setAccessToken(token);

    const { data, error } = await insforgeUser.database
      .from('books')
      .select()
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch books.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
