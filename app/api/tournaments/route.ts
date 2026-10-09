import { NextRequest, NextResponse } from 'next/server';
import { tournamentService } from '@/lib/services/tournamentService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
export async function GET(req: NextRequest) {
  try {
  await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const arenaId = searchParams.get('arenaId') || undefined;

    const tournaments = tournamentService.getAll(arenaId);
    return NextResponse.json(tournaments, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  await ensureDbInitialized();
    const body = await req.json();
    const result = tournamentService.create(body);

    if (!result.success) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
