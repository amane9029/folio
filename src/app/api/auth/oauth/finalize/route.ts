import { NextRequest, NextResponse } from 'next/server';
import { findUserByAuthUserId, findUserByEmail, createGoogleUser, syncGoogleUser } from '@/lib/app-users';
import { getErrorMessage } from '@/lib/errors';
import { createSessionResponse, decodeJwtPayload } from '@/lib/server-auth';

type OAuthPayload = ReturnType<typeof decodeJwtPayload> & {
  app_metadata?: Record<string, unknown>;
};

function getGoogleSub(payload: OAuthPayload) {
  return (
    (typeof payload?.user_metadata?.google_sub === 'string' ? payload.user_metadata.google_sub : null) ||
    (typeof payload?.user_metadata?.provider_sub === 'string' ? payload.user_metadata.provider_sub : null) ||
    (typeof payload?.app_metadata?.provider_sub === 'string' ? payload.app_metadata.provider_sub : null) ||
    payload?.sub ||
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = String(body.accessToken || '');
    const mode = body.mode === 'register' ? 'register' : 'login';
    const displayName = body.name ? String(body.name) : null;

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token.' }, { status: 400 });
    }

    const payload = decodeJwtPayload(accessToken) as OAuthPayload;
    const authUserId = payload.sub;
    const email = String(payload.email || '').trim().toLowerCase();

    if (!authUserId || !email) {
      return NextResponse.json({ error: 'Invalid Google session.' }, { status: 400 });
    }

    const googleSub = getGoogleSub(payload);
    const existingByAuth = await findUserByAuthUserId(authUserId);
    const existingByEmail = existingByAuth || await findUserByEmail(email);

    if (mode === 'login') {
      if (!existingByEmail || existingByEmail.auth_provider !== 'google') {
        return NextResponse.json(
          {
            error: 'No Google account registered. Please register first.',
            code: 'GOOGLE_NOT_REGISTERED',
          },
          { status: 404 },
        );
      }

      await syncGoogleUser(existingByEmail, {
        authUserId,
        name: displayName,
        googleSub,
      });

      return createSessionResponse(accessToken);
    }

    if (!existingByEmail) {
      await createGoogleUser({
        authUserId,
        email,
        name: displayName,
        googleSub,
      });
      return createSessionResponse(accessToken);
    }

    if (existingByEmail.auth_provider !== 'google') {
      return NextResponse.json(
        { error: 'Account already exists. Please sign in with email and password.' },
        { status: 409 },
      );
    }

    await syncGoogleUser(existingByEmail, {
      authUserId,
      name: displayName,
      googleSub,
    });

    return createSessionResponse(accessToken);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to finish Google sign-in.') },
      { status: 500 },
    );
  }
}
