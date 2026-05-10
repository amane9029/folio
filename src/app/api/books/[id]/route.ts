import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try getting token from cookie first, then Authorization header
    const cookieToken = request.cookies.get('token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    // Decode JWT manually to get userId
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('bad jwt');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (!payload.sub) throw new Error('no sub');
    } catch(e: any) {
      return NextResponse.json({ error: 'Invalid token: ' + e.message }, { status: 401 });
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
