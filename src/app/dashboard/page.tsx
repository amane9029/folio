import { cookies } from 'next/headers';
import { createClient } from '@insforge/sdk';
import DashboardClient from './client';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/');
  }

  // Create scoped client to fetch books
  const insforgeUser = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!
  });
  insforgeUser.setAccessToken(token);

  const { data, error } = await insforgeUser.database
    .from('books')
    .select()
    .order('uploaded_at', { ascending: false });

  let mappedBooks = [];
  if (data && !error) {
    mappedBooks = data.map((b: any) => ({
      id: b.id,
      title: b.title,
      subfolder: b.subfolder || 'Unsorted',
      cover: b.cover_url || '',
      fileSizeKb: b.file_size_kb,
      uploadedAt: b.uploaded_at,
      uploadedBy: b.uploaded_by,
      translation: b.translation,
    }));
  } else if (error) {
    console.error('Failed to fetch books in DashboardPage:', error);
  }

  return <DashboardClient initialBooks={mappedBooks} />;
}
