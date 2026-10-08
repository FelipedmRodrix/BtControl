import { NextRequest, NextResponse } from 'next/server';
import { duoService } from '@/lib/services/duoService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const res = duoService.delete(id);

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
