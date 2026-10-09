import { NextRequest, NextResponse } from 'next/server';
import { duoService } from '@/lib/services/duoService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
export async function GET(req: NextRequest) {
  try {
  await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const arenaId = searchParams.get('arenaId') || undefined;
    const tournamentId = searchParams.get('tournamentId') || undefined;

    const list = duoService.getAll(arenaId, tournamentId);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  await ensureDbInitialized();
    const body = await req.json();
    const { tournamentId, categoryId, player1Id, player2Id } = body;

    const res = duoService.create({ tournamentId, categoryId, player1Id, player2Id });
    if (!res.success) {
            await flushWrites();
return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res.data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
