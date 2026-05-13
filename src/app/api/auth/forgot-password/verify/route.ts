import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/auth-client';
import {
  findUserByEmail,
  getOtpPolicyError,
  incrementResetAttempts,
} from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const policyError = getOtpPolicyError(user, 'reset');
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const authClient = createAuthServerClient();
    const { data, error } = await authClient.auth.exchangeResetPasswordToken({ email, code });

    if (error || !data?.token) {
      await incrementResetAttempts(user);
      return NextResponse.json(
        { error: error?.message || 'Invalid reset code.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ token: data.token });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to verify reset code.') },
      { status: 500 },
    );
  }
}
