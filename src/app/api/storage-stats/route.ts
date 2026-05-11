import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function GET() {
  try {
    // Call the Postgres function via SDK RPC
    const { data, error } = await insforge.database
      .rpc('get_storage_stats');

    if (error) {
      console.error('Storage stats RPC error:', error);
      return NextResponse.json({ usedBytes: 0, objectCount: 0 });
    }

    return NextResponse.json({
      usedBytes: data?.usedBytes || 0,
      objectCount: data?.objectCount || 0,
    });
  } catch (err: any) {
    console.error('Storage stats error:', err);
    return NextResponse.json({ usedBytes: 0, objectCount: 0 });
  }
}
