import { VerifyPage } from '@/components/auth-ui';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return <VerifyPage email={params.email} />;
}
