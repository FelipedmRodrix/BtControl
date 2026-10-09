import { NextRequest, NextResponse } from 'next/server';
import { duoService } from '@/lib/services/duoService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const res = duoService.delete(id);

    if (!res.success) {
            await flushWrites();
return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
