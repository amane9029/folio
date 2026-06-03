import { NextRequest, NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge';
import { createUserScopedClient, getTokenFromRequest } from '@/lib/server-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    const { id } = await params;
    const userClient = createUserScopedClient(token);

    const { data: book, error: fetchError } = await userClient.database
      .from('books')
      .select('id, cover_url')
      .eq('id', id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    if (book.cover_url) {
      try {
        const objectUrl = new URL(book.cover_url);
        const match = objectUrl.pathname.match(/\/objects\/(.+)$/);
        if (match?.[1]) {
          const objectKey = decodeURIComponent(match[1]);
          await insforgeAdmin.storage.from('covers').remove(objectKey);
        }
      } catch (storageErr) {
        console.error('Failed to delete cover from storage:', storageErr);
      }
    }

    const { error: deleteError } = await userClient.database
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete book.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 },
    );
  }
}
