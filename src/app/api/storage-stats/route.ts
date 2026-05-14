import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge';

export async function GET() {
  try {
    // Call the Postgres function via SDK RPC
    const { data, error } = await insforgeAdmin.database
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
