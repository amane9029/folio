import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/auth-client';
import {
  findUserByEmail,
  getOtpPolicyError,
  incrementVerifyAttempts,
  markVerified,
} from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';
import { createSessionResponse } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const otp = String(body.otp || '').trim();

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const policyError = getOtpPolicyError(user, 'verify');
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const authClient = createAuthServerClient();
    const { data, error } = await authClient.auth.verifyEmail({ email, otp });

    if (error || !data?.accessToken) {
      await incrementVerifyAttempts(user);
      return NextResponse.json(
        { error: error?.message || 'Invalid verification code.' },
        { status: 400 },
      );
    }

    await markVerified(user, data.user?.id);
    return createSessionResponse(data.accessToken);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to verify code.') },
      { status: 500 },
    );
  }
}
