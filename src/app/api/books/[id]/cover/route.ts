import { NextRequest, NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge';
import { createUserScopedClient, getTokenFromRequest } from '@/lib/server-auth';

function extractObjectKey(coverUrl: string) {
  try {
    const url = new URL(coverUrl);
    const match = url.pathname.match(/\/objects\/(.+)$/);
    if (!match) {
      return null;
    }

    return decodeURIComponent(match[1]);
  } catch {
    const parts = coverUrl.split('/objects/');
    if (parts.length < 2) {
      return null;
    }

    return decodeURIComponent(parts[1].split('?')[0]);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userClient = createUserScopedClient(token);

    const { data: book, error: fetchError } = await userClient.database
      .from('books')
      .select('id, cover_url')
      .eq('id', id)
      .single();

    if (fetchError || !book?.cover_url) {
      return NextResponse.json({ error: 'Cover not found.' }, { status: 404 });
    }

    if (!book.cover_url.includes('/objects/')) {
      return NextResponse.redirect(book.cover_url, { status: 307 });
    }

    const objectKey = extractObjectKey(book.cover_url);
    if (!objectKey) {
      return NextResponse.json({ error: 'Invalid cover path.' }, { status: 404 });
    }

    const { data: blob, error: downloadError } = await insforgeAdmin.storage
      .from('covers')
      .download(objectKey);

    if (downloadError || !blob) {
      return NextResponse.json(
        { error: downloadError?.message || 'Failed to load cover.' },
        { status: 404 },
      );
    }

    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 },
    );
  }
}
