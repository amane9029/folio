import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import { insforgeAdmin } from '@/lib/insforge';

export type AppRole = 'admin' | 'user';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type JwtPayload = {
  sub?: string;
  email?: string;
  exp?: number;
  user_metadata?: {
    name?: string;
    [key: string]: unknown;
  };
};

export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('bad jwt');
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
}

export function getTokenFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get('token')?.value;
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  return cookieToken || headerToken || null;
}

export async function ensureUserProfile(userId: string, email?: string) {
  const { data: profiles, error: profileError } = await insforgeAdmin.database
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .limit(1);

  if (profileError) {
    throw new Error(profileError.message || 'Failed to read profile.');
  }

  const existingRole = Array.isArray(profiles) ? profiles[0]?.role : null;
  if (existingRole === 'admin' || existingRole === 'user') {
    return existingRole as AppRole;
  }

  const initialRole = email === 'admin@folio.com' ? 'admin' : 'user';

  const { error: insertError } = await insforgeAdmin.database
    .from('profiles')
    .insert([{ id: userId, role: initialRole }]);

  if (insertError) {
    throw new Error(insertError.message || 'Failed to create profile.');
  }

  return initialRole as AppRole;
}

export async function resolveUserRole(userId: string) {
  const { data: profiles, error } = await insforgeAdmin.database
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .limit(1);

  if (error) {
    throw new Error(error.message || 'Failed to read profile role.');
  }

  return Array.isArray(profiles) && profiles[0]?.role === 'admin' ? 'admin' : 'user';
}

export function setAuthCookies(response: NextResponse, token: string, role: AppRole) {
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: COOKIE_MAX_AGE,
  });

  response.cookies.set('role', role, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: new Date(0),
  });

  response.cookies.set('role', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: new Date(0),
  });
}

export function getSessionUserFromToken(token: string, role: AppRole) {
  const payload = decodeJwtPayload(token);

  if (!payload.sub || !payload.email) {
    throw new Error('Invalid token payload.');
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Session expired.');
  }

  const email = payload.email;
  const name = payload.user_metadata?.name || email.split('@')[0];

  return {
    role,
    user: {
      id: payload.sub,
      email,
      name,
    },
  };
}

export async function createSessionResponse(token: string) {
  const payload = decodeJwtPayload(token);

  if (!payload.sub) {
    throw new Error('Invalid token: no sub.');
  }

  const role = await ensureUserProfile(payload.sub, payload.email);
  const session = getSessionUserFromToken(token, role);
  const response = NextResponse.json(session);
  setAuthCookies(response, token, role);
  return response;
}

export function createUserScopedClient(token: string) {
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });

  client.setAccessToken(token);
  return client;
}
