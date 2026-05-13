import { NextRequest, NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge';
import {
  createUserScopedClient,
  decodeJwtPayload,
  getTokenFromRequest,
  resolveUserRole,
} from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    if (!payload.sub) {
      return NextResponse.json({ error: 'Invalid token: no sub.' }, { status: 401 });
    }

    const role = await resolveUserRole(payload.sub);

    const query = role === 'admin'
      ? insforgeAdmin.database.from('books').select()
      : createUserScopedClient(token).database.from('books').select().eq('user_id', payload.sub);

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch books.' },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 },
    );
  }
}
