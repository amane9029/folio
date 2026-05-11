import { NextRequest, NextResponse } from 'next/server';
import { insforge, insforgeAdmin } from '@/lib/insforge';

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

    let translation = null;
    const NON_LATIN_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0590-\u06FF\u0900-\u097F\u0370-\u03FF\u0E00-\u0E7F]/;

    if (NON_LATIN_RE.test(title)) {
      try {
        console.log('Translating title with Groq:', title);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'user',
                content: `You are a precise book-title translator. Return ONLY a single-line minified JSON object, no prose.
Input title may contain Japanese, Chinese, Korean, Cyrillic, Arabic, etc.
Keys: language (BCP-47 like "ja","zh","ko","ru","ar"), romaji (transliteration in Latin script), english (idiomatic English title).
If the input is already English, return {"language":"en","romaji":"${title}","english":"${title}"}.

Title: ${JSON.stringify(title)}`
              }
            ]
          })
        });

        if (!res.ok) {
          throw new Error(`Groq API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
          translation = JSON.parse(m[0]);
        }
      } catch (e: any) {
        console.error('Translation error with Groq:', e.message);
      }
    }

    // Validate UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || '');
    const finalUserId = isUuid ? userId : null;

    const newBookId = crypto.randomUUID();

    // Insert book record without .select() to avoid RLS read policy evaluation
    const { error: dbError } = await insforgeAdmin.database
      .from('books')
      .insert([{
        id: newBookId,
        title,
        subfolder: subfolder || null,
        cover_url: coverUrl,
        file_size_kb: fileSizeKb,
        uploaded_by: finalUserId,
        translation: translation
      }]);

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message || 'Failed to create book record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      id: newBookId,
      title,
      cover_url: coverUrl,
      file_size_kb: fileSizeKb,
      translation,
      cover_key: coverKey 
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
