import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/auth-client';
import {
  findUserByEmail,
  markVerificationSent,
  recoverUserFromAuth,
} from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    let user = await findUserByEmail(email);
    if (!user) {
      user = await recoverUserFromAuth(email).catch(() => null);
    }

    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const authClient = createAuthServerClient();
    const { error } = await authClient.auth.resendVerificationEmail({ email });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to resend verification code.' },
        { status: 400 },
      );
    }

    await markVerificationSent(user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to resend verification code.') },
      { status: 500 },
    );
  }
}
