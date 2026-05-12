import { cookies } from 'next/headers';
import DashboardClient from './client';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  return <DashboardClient initialBooks={[]} />;
}
