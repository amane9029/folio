import { insforge } from '@/lib/insforge';

type SessionPayload = {
  role: 'admin' | 'user';
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export async function setAppSession(accessToken: string) {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(data?.error || 'Failed to store app session.');
  }

  return data as SessionPayload;
}

export async function syncAppSessionFromInsForge() {
  const { data: currentUser, error: currentUserError } = await insforge.auth.getCurrentUser();

  if (currentUserError || !currentUser?.user) {
    return null;
  }

  const { data, error } = await insforge.auth.refreshSession();

  if (error || !data?.accessToken) {
    return null;
  }

  return setAppSession(data.accessToken);
}

export async function clearAppSession() {
  await fetch('/api/auth/logout', { method: 'POST' });
}
