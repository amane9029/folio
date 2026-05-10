import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    // Try getting token from cookie first, then Authorization header
    const cookieToken = request.cookies.get('token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;
    
    console.log('Cookie token:', !!cookieToken);
    console.log('Header token:', !!headerToken);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    // Decode JWT manually to get userId (don't use getUser yet)
    let userId: string | null = null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('bad jwt');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      userId = payload.sub || null;
      console.log('userId:', userId);
      console.log('token expired:', payload.exp < Math.floor(Date.now()/1000));
      if (!userId) throw new Error('no sub');
    } catch(e: any) {
      console.error('Token decode error:', e.message);
      return NextResponse.json({ error: 'Invalid token: ' + e.message }, { status: 401 });
    }

    const formData = await request.formData();
    const cover = formData.get('cover') as File | null;
    const title = formData.get('title') as string;
    const subfolder = formData.get('subfolder') as string;
    const fileSizeKb = parseInt(formData.get('file_size_kb') as string, 10) || 0;

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    let coverUrl: string | null = null;
    let coverKey: string | null = null;

    // Upload cover to InsForge storage if provided
    if (cover && cover.size > 0) {
      try {
        const ext = 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // SDK expects File | Blob — pass the cover File directly
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('covers')
          .upload(path, cover);

        console.log('Upload result:', JSON.stringify(uploadData), 'Error:', uploadError);

        if (uploadError) {
          console.error('Cover upload error:', uploadError);
        } else if (uploadData) {
          // SDK returns { url, key } directly in the response
          coverUrl = uploadData.url || null;
          coverKey = uploadData.key || path;
          console.log('Cover uploaded successfully, URL:', coverUrl, 'Key:', coverKey);
        }
      } catch (storageErr) {
        console.error('Storage exception:', storageErr);
      }
    } else {
      console.log('No cover received — cover size:', cover?.size);
    }

    // Insert book record
    const { data: book, error: dbError } = await insforge.database
      .from('books')
      .insert([{
        title,
        subfolder: subfolder || null,
        cover_url: coverUrl,
        file_size_kb: fileSizeKb,
        uploaded_by: userId,
      }])
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
