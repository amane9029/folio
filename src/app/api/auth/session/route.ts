import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionResponse,
  decodeJwtPayload,
} from '@/lib/server-auth';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.accessToken;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'accessToken is required.' }, { status: 400 });
    }

    const payload = decodeJwtPayload(token);
    if (!payload.sub) {
      return NextResponse.json({ error: 'Invalid token: no sub.' }, { status: 401 });
    }

    return createSessionResponse(token);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to create session.') },
      { status: 500 },
    );
  }
}
