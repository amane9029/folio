import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Auth check
    const cookieToken = request.cookies.get('token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string | null = null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('bad jwt');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      userId = payload.sub || null;
      if (!userId) throw new Error('no sub');
    } catch(e: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the title from request body (sent by frontend)
    const body = await request.json().catch(() => ({}));
    const title = body.title;

    if (!title) {
      return NextResponse.json({ error: 'Title is required in request body' }, { status: 400 });
    }

    // Call Groq API directly
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API Error: ${groqRes.status} ${errText}`);
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';
    const m = content.match(/\{[\s\S]*\}/);
    let translation = null;
    
    if (m) {
      translation = JSON.parse(m[0]);
    } else {
      throw new Error('Could not parse AI response: ' + content);
    }

    // Update book with translation using raw SQL to bypass RLS
    const { error: updateError } = await insforge.database
      .from('books')
      .update({ translation })
      .eq('id', id);

    if (updateError) {
      console.error('DB update error:', updateError);
      // Still return the translation even if DB save fails
    }

    return NextResponse.json({ translation });

  } catch (err: any) {
    console.error('Manual translate error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
