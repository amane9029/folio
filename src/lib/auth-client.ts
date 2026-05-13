import { createClient } from '@insforge/sdk';

export function createAuthServerClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    isServerMode: true,
  });
}
