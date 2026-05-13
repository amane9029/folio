import { NextRequest, NextResponse } from 'next/server';
import {
  createUserScopedClient,
  decodeJwtPayload,
  getTokenFromRequest,
} from '@/lib/server-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    if (!payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const title = body.title;

    if (!title) {
      return NextResponse.json({ error: 'Title is required in request body' }, { status: 400 });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API Error: ${groqRes.status} ${errText}`);
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error(`Could not parse AI response: ${content}`);
    }

    const translation = JSON.parse(match[0]);
    const userClient = createUserScopedClient(token);
    const { error: updateError } = await userClient.database
      .from('books')
      .update({ translation })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to save translation.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ translation });
  } catch (err: any) {
    console.error('Manual translate error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 },
    );
  }
}
