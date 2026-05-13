import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminPageClient from './client';
import {
  createUserScopedClient,
  decodeJwtPayload,
  resolveUserRole,
} from '@/lib/server-auth';
import { insforgeAdmin } from '@/lib/insforge';

const toCoverSrc = (book: { id: string; cover_url?: string | null }) => {
  if (!book.cover_url) return '';
  return book.cover_url.includes('/objects/')
    ? `/api/books/${book.id}/cover`
    : book.cover_url;
};

export default async function AdminPage() {
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
  if (role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: profileData } = await createUserScopedClient(token).auth.getCurrentUser();
  const currentUser = profileData?.user;
  const email = currentUser?.email || '';
  const profileName = typeof currentUser?.profile?.name === 'string' ? currentUser.profile.name : null;
  const metadataName = typeof currentUser?.metadata?.name === 'string' ? currentUser.metadata.name : null;
  const name = profileName || metadataName || email.split('@')[0] || 'Administrator';
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';

  const { data } = await insforgeAdmin.database
    .from('books')
    .select()
    .order('uploaded_at', { ascending: false });

  const initialBooks = Array.isArray(data)
    ? data.map((b: any) => ({
        id: b.id,
        title: b.title,
        subfolder: b.subfolder || 'Unsorted',
        cover: toCoverSrc(b),
        fileSizeKb: b.file_size_kb,
        uploadedAt: b.uploaded_at,
        uploadedBy: b.user_id || b.uploaded_by,
      }))
    : [];

  return (
    <AdminPageClient
      initialUser={{
        id: currentUser?.id,
        role: 'admin',
        email,
        name,
        initials,
      }}
      initialBooks={initialBooks}
    />
  );
}
