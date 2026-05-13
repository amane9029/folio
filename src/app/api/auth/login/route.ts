import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAuthServerClient } from '@/lib/auth-client';
import { findUserByEmail } from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';
import { createSessionResponse } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const user = await findUserByEmail(email);
    if (!user || !user.is_verified || user.auth_provider !== 'email' || !user.password_hash) {
      return NextResponse.json(
        { error: 'Account not found or not verified. Please register.' },
        { status: 404 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const authClient = createAuthServerClient();
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data?.accessToken) {
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password.' },
        { status: 401 },
      );
    }

    return createSessionResponse(data.accessToken);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to sign in.') },
      { status: 500 },
    );
  }
}
