import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/auth-client';
import { findUserByEmail, markResetSent } from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const user = await findUserByEmail(email);

    if (!user || user.auth_provider !== 'email') {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const authClient = createAuthServerClient();
    const { error } = await authClient.auth.sendResetPasswordEmail({ email });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to send reset code.' },
        { status: 400 },
      );
    }

    await markResetSent(user.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to send reset code.') },
      { status: 500 },
    );
  }
}
