import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAuthServerClient } from '@/lib/auth-client';
import { createEmailUser, findUserByEmail, prepareEmailVerification, recoverUserFromAuth } from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';

function isAlreadyRegisteredError(message: string) {
  const value = message.toLowerCase();
  return value.includes('already') || value.includes('exists') || value.includes('registered');
}

function isOtpCooldownError(message: string) {
  const value = message.toLowerCase();
  return value.includes('please wait') || value.includes('before requesting another code');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let existingUser = await findUserByEmail(email);
    if (!existingUser) {
      existingUser = await recoverUserFromAuth(email).catch(() => null);
    }
    if (existingUser) {
      if (existingUser.auth_provider !== 'email') {
        return NextResponse.json(
          { error: 'Account already exists. Please continue with Google.' },
          { status: 409 },
        );
      }

      if (existingUser.is_verified) {
        return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
      }

      const authClient = createAuthServerClient();
      const { error: resendError } = await authClient.auth.resendVerificationEmail({ email });
      if (resendError) {
        if (!isOtpCooldownError(resendError.message || '')) {
          return NextResponse.json(
            { error: resendError.message || 'Failed to send verification code.' },
            { status: 400 },
          );
        }
      }

      await prepareEmailVerification(existingUser, passwordHash);
      return NextResponse.json({
        email,
        requiresVerification: true,
      });
    }

    const authClient = createAuthServerClient();
    const { data, error } = await authClient.auth.signUp({ email, password });

    if (error || !data?.user?.id) {
      if (error && isAlreadyRegisteredError(error.message || '')) {
        let userAfterError = await findUserByEmail(email);
        if (!userAfterError) {
          userAfterError = await recoverUserFromAuth(email).catch(() => null);
        }
        if (userAfterError && !userAfterError.is_verified && userAfterError.auth_provider === 'email') {
          const { error: resendError } = await authClient.auth.resendVerificationEmail({ email });
          if (resendError) {
            if (!isOtpCooldownError(resendError.message || '')) {
              return NextResponse.json(
                { error: resendError.message || 'Failed to send verification code.' },
                { status: 400 },
              );
            }
          }

          await prepareEmailVerification(userAfterError, passwordHash);
          return NextResponse.json({
            email,
            requiresVerification: true,
          });
        }
      }

      return NextResponse.json(
        { error: error?.message || 'Failed to register account.' },
        { status: 400 },
      );
    }

    try {
      await createEmailUser({
        authUserId: data.user.id,
        email,
        passwordHash,
      });
    } catch {
      const recoveredUser = await findUserByEmail(email) || await recoverUserFromAuth(email).catch(() => null);
      if (!recoveredUser) {
        throw new Error('Failed to create verification record.');
      }
    }

    return NextResponse.json({
      email,
      requiresVerification: true,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to register account.') },
      { status: 500 },
    );
  }
}
