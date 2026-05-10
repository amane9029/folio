import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const cover = formData.get('cover') as File | null;
    const title = formData.get('title') as string;
    const subfolder = formData.get('subfolder') as string;
    const fileSizeKb = parseInt(formData.get('file_size_kb') as string, 10) || 0;

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    // Get current user from token
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || null;
    } catch {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    let coverUrl: string | null = null;
    let coverKey: string | null = null;

    // Upload cover to InsForge storage if provided
    if (cover && cover.size > 0) {
      const ext = cover.name?.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { data: uploadData, error: uploadError } = await insforge.storage
        .from('covers')
        .upload(path, cover);

      if (uploadError) {
        console.error('Cover upload error:', uploadError);
      } else if (uploadData) {
        coverUrl = uploadData.url;
        coverKey = uploadData.key;
      }
    }

    // Insert book record
    const { data: book, error: dbError } = await insforge.database
      .from('books')
      .insert({
        title,
        subfolder: subfolder || null,
        cover_url: coverUrl,
        file_size_kb: fileSizeKb,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message || 'Failed to create book record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...book, cover_key: coverKey });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
