import { createClient } from '@insforge/sdk';

// Public client — for frontend use (anon key)
export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// Admin client — for server-side API routes (service role key)
export const insforgeAdmin = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  edgeFunctionToken: process.env.INSFORGE_SERVICE_KEY!,
  isServerMode: true,
});
