import { NextRequest, NextResponse } from 'next/server';
import { conventionalTournamentService } from '@/lib/services/conventionalTournamentService';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const categoryId = searchParams.get('categoryId');

    if (!tournamentId || !categoryId) {
      return NextResponse.json(
        { error: 'Os parâmetros tournamentId e categoryId são obrigatórios.' },
        { status: 400 }
      );
    }

    const data = conventionalTournamentService.getTournamentData(tournamentId, categoryId);
    if (!data) {
      return NextResponse.json({ error: 'Torneio ou categoria não encontrados.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { tournamentId, categoryId, action, date, court } = body;

    if (!tournamentId || !categoryId) {
      return NextResponse.json(
        { error: 'Os campos tournamentId e categoryId são obrigatórios.' },
        { status: 400 }
      );
    }

    if (action === 'generate-elimination') {
      const res = conventionalTournamentService.generateEliminationBracket(
        tournamentId,
        categoryId,
        date,
        court
      );
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      await flushWrites();
      return NextResponse.json({ success: true, count: res.count, stage: 'elimination' });
    }

    // Default to generate groups
    const res = conventionalTournamentService.generateGroupStage(
      tournamentId,
      categoryId,
      date,
      court
    );
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    await flushWrites();
    return NextResponse.json({ success: true, count: res.count, stage: 'groups' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
