import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionUserFromToken,
  getTokenFromRequest,
  resolveUserRole,
} from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseSession = getSessionUserFromToken(token, 'user');
    const roleCookie = request.cookies.get('role')?.value;
    const role = roleCookie === 'admin' ? 'admin' : await resolveUserRole(baseSession.user.id);

    return NextResponse.json(getSessionUserFromToken(token, role));
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unauthorized' },
      { status: 401 },
    );
  }
}
