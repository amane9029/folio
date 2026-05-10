import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check auth
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the book first to get cover_url for storage cleanup
    const { data: book, error: fetchError } = await insforge.database
      .from('books')
      .select('id, cover_url')
      .eq('id', id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json(
        { error: 'Book not found.' },
        { status: 404 }
      );
    }

    // Delete cover from storage if it exists
    if (book.cover_url) {
      try {
        // Extract the object key from the URL
        // URL format: .../api/storage/buckets/covers/objects/<key>
        const urlParts = book.cover_url.split('/objects/');
        if (urlParts.length > 1) {
          const objectKey = decodeURIComponent(urlParts[1]);
          await insforge.storage.from('covers').remove(objectKey);
        }
      } catch (storageErr) {
        // Log but don't fail — the DB record should still be deleted
        console.error('Failed to delete cover from storage:', storageErr);
      }
    }

    // Delete the book record
    const { error: deleteError } = await insforge.database
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete book.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
