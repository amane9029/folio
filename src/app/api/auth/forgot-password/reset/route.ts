import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAuthServerClient } from '@/lib/auth-client';
import { findUserByEmail, updatePasswordHash } from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const authClient = createAuthServerClient();
    const { data, error } = await authClient.auth.resetPassword({
      otp: token,
      newPassword: password,
    });

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Failed to reset password.' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await updatePasswordHash(user, passwordHash);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to reset password.') },
      { status: 500 },
    );
  }
}
