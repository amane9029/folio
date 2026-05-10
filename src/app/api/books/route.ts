import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await insforge.database
      .from('books')
      .select()
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch books.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
