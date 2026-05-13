import { cookies } from 'next/headers';
import DashboardClient from './client';
import { redirect } from 'next/navigation';
import { createUserScopedClient, decodeJwtPayload, resolveUserRole } from '@/lib/server-auth';
import { insforgeAdmin } from '@/lib/insforge';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const payload = decodeJwtPayload(token);
  if (!payload.sub) {
    redirect('/auth');
  }

  const role = await resolveUserRole(payload.sub);
  const query = role === 'admin'
    ? insforgeAdmin.database.from('books').select()
    : createUserScopedClient(token).database.from('books').select().eq('user_id', payload.sub);

  const { data } = await query.order('uploaded_at', { ascending: false });

  const initialBooks = Array.isArray(data)
    ? data.map((b: any) => ({
        id: b.id,
        title: b.title,
        subfolder: b.subfolder || 'Unsorted',
        cover: b.cover_url
          ? (b.cover_url.includes('/objects/') ? `/api/books/${b.id}/cover` : b.cover_url)
          : '',
        fileSizeKb: b.file_size_kb,
        uploadedAt: b.uploaded_at,
        uploadedBy: b.user_id || b.uploaded_by,
        translation: b.translation,
      }))
    : [];

  return <DashboardClient initialBooks={initialBooks} />;
}
