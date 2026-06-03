import { NextRequest, NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge';
import {
  createUserScopedClient,
  decodeJwtPayload,
  getTokenFromRequest,
} from '@/lib/server-auth';

const NON_LATIN_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0590-\u06FF\u0900-\u097F\u0370-\u03FF\u0E00-\u0E7F]/;

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const userId = payload.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token: no sub' }, { status: 401 });
    }

    const userClient = createUserScopedClient(token);
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

    if (cover && cover.size > 0) {
      try {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { data: uploadData, error: uploadError } = await insforgeAdmin.storage
          .from('covers')
          .upload(path, cover);

        if (uploadError) {
          console.error('Cover upload error:', uploadError);
        } else if (uploadData) {
          coverKey = uploadData.key || path;
          coverUrl = insforgeAdmin.storage.from('covers').getPublicUrl(coverKey);
        }
      } catch (storageErr) {
        console.error('Storage exception:', storageErr);
      }
    }

    let translation = null;

    if (NON_LATIN_RE.test(title)) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
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

Title: ${JSON.stringify(title)}`,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            translation = JSON.parse(match[0]);
          }
        }
      } catch (error: any) {
        console.error('Translation error with Groq:', error.message);
      }
    }

    const id = crypto.randomUUID();
    const { error: insertError } = await userClient.database.from('books').insert([{
      id,
      title,
      subfolder: subfolder || null,
      cover_url: coverUrl,
      file_size_kb: fileSizeKb,
      user_id: userId,
      uploaded_by: userId,
      translation,
    }]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || 'Failed to create book record.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id,
      title,
      subfolder: subfolder || 'Unsorted',
      cover_url: coverUrl,
      file_size_kb: fileSizeKb,
      translation,
      cover_key: coverKey,
      user_id: userId,
      uploaded_by: userId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 },
    );
  }
}
