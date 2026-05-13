import { insforgeAdmin } from '@/lib/insforge';

const OTP_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export type AppUser = {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string | null;
  password_hash: string | null;
  is_verified: boolean;
  auth_provider: 'email' | 'google';
  google_sub: string | null;
  verify_code_sent_at: string | null;
  verify_expires_at: string | null;
  verify_attempt_count: number;
  reset_code_sent_at: string | null;
  reset_expires_at: string | null;
  reset_attempt_count: number;
  created_at: string;
  updated_at: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function otpWindowIso() {
  return new Date(Date.now() + OTP_WINDOW_MS).toISOString();
}

async function updateUserById(id: string, patch: Partial<AppUser>) {
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update user.');
  }

  return data as AppUser;
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .select()
    .eq('email', normalized)
    .limit(1);

  if (error) {
    throw new Error(error.message || 'Failed to read users table.');
  }

  return (Array.isArray(data) ? data[0] : null) as AppUser | null;
}

export async function findUserByAuthUserId(authUserId: string) {
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .select()
    .eq('auth_user_id', authUserId)
    .limit(1);

  if (error) {
    throw new Error(error.message || 'Failed to read users table.');
  }

  return (Array.isArray(data) ? data[0] : null) as AppUser | null;
}

export async function recoverUserFromAuth(email: string) {
  const normalized = normalizeEmail(email);
  const { data, error } = await insforgeAdmin.database
    .rpc('ensure_public_user_from_auth', { target_email: normalized });

  if (error) {
    throw new Error(error.message || 'Failed to recover auth user.');
  }

  return data as AppUser;
}

export async function createEmailUser(params: {
  authUserId: string;
  email: string;
  passwordHash: string;
}) {
  const normalized = normalizeEmail(params.email);
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .insert([{
      auth_user_id: params.authUserId,
      email: normalized,
      name: normalized.split('@')[0],
      password_hash: params.passwordHash,
      is_verified: false,
      auth_provider: 'email',
      verify_code_sent_at: new Date().toISOString(),
      verify_expires_at: otpWindowIso(),
      verify_attempt_count: 0,
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create user.');
  }

  return data as AppUser;
}

export async function createGoogleUser(params: {
  authUserId: string;
  email: string;
  name?: string | null;
  googleSub?: string | null;
}) {
  const normalized = normalizeEmail(params.email);
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .insert([{
      auth_user_id: params.authUserId,
      email: normalized,
      name: params.name || normalized.split('@')[0],
      password_hash: null,
      is_verified: true,
      auth_provider: 'google',
      google_sub: params.googleSub || params.authUserId,
      verify_code_sent_at: null,
      verify_expires_at: null,
      verify_attempt_count: 0,
      reset_code_sent_at: null,
      reset_expires_at: null,
      reset_attempt_count: 0,
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create Google user.');
  }

  return data as AppUser;
}

export async function markVerificationSent(id: string) {
  return updateUserById(id, {
    verify_code_sent_at: new Date().toISOString(),
    verify_expires_at: otpWindowIso(),
    verify_attempt_count: 0,
  });
}

export async function incrementVerifyAttempts(user: AppUser) {
  return updateUserById(user.id, {
    verify_attempt_count: (user.verify_attempt_count || 0) + 1,
  });
}

export async function markVerified(user: AppUser, authUserId?: string) {
  return updateUserById(user.id, {
    auth_user_id: authUserId || user.auth_user_id,
    is_verified: true,
    verify_code_sent_at: null,
    verify_expires_at: null,
    verify_attempt_count: 0,
  });
}

export async function markResetSent(id: string) {
  return updateUserById(id, {
    reset_code_sent_at: new Date().toISOString(),
    reset_expires_at: otpWindowIso(),
    reset_attempt_count: 0,
  });
}

export async function incrementResetAttempts(user: AppUser) {
  return updateUserById(user.id, {
    reset_attempt_count: (user.reset_attempt_count || 0) + 1,
  });
}

export async function updatePasswordHash(user: AppUser, passwordHash: string) {
  return updateUserById(user.id, {
    password_hash: passwordHash,
    reset_code_sent_at: null,
    reset_expires_at: null,
    reset_attempt_count: 0,
  });
}

export async function prepareEmailVerification(user: AppUser, passwordHash: string) {
  return updateUserById(user.id, {
    password_hash: passwordHash,
    auth_provider: 'email',
    is_verified: false,
    verify_code_sent_at: new Date().toISOString(),
    verify_expires_at: otpWindowIso(),
    verify_attempt_count: 0,
  });
}

export async function syncGoogleUser(user: AppUser, patch: {
  authUserId: string;
  name?: string | null;
  googleSub?: string | null;
}) {
  return updateUserById(user.id, {
    auth_user_id: patch.authUserId,
    name: patch.name || user.name,
    google_sub: patch.googleSub || user.google_sub || patch.authUserId,
    is_verified: true,
    auth_provider: 'google',
  });
}

function isExpired(value: string | null) {
  return !value || new Date(value).getTime() < Date.now();
}

export function getOtpPolicyError(user: AppUser, kind: 'verify' | 'reset') {
  const attempts = kind === 'verify' ? user.verify_attempt_count : user.reset_attempt_count;
  const expiresAt = kind === 'verify' ? user.verify_expires_at : user.reset_expires_at;

  if (attempts >= OTP_MAX_ATTEMPTS) {
    return 'Too many attempts. Please request a new code.';
  }

  if (isExpired(expiresAt)) {
    return 'This code has expired. Please request a new one.';
  }

  return null;
}

export function getOtpWindowMs() {
  return OTP_WINDOW_MS;
}
