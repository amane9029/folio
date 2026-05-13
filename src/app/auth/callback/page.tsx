import { OAuthCallbackPage } from '@/components/auth-ui';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  return <OAuthCallbackPage mode={params.mode === 'register' ? 'register' : 'login'} />;
}
