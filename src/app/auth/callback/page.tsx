import { OAuthCallbackFullPage } from '@/components/oauth-callback-page';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  return <OAuthCallbackFullPage mode={params.mode === 'register' ? 'register' : 'login'} />;
}
