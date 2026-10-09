import { NextRequest, NextResponse } from 'next/server';
import { resolveSuper8Tie } from '@/lib/services/super8Service';
import { matchService } from '@/lib/services/matchService';
import { readDB } from '@/lib/db/store';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { scoreA, scoreB } = body;

    const db = readDB();
    const matchIndex = db.matches.findIndex(m => m.id === id);

    if (matchIndex === -1) {
      return NextResponse.json({ error: 'Partida não encontrada.' }, { status: 404 });
    }

    const match = db.matches[matchIndex];
    const athletes = db.athletes.filter(a => {
      const ids = [
        match.teamA?.player1Id, match.teamA?.player2Id,
        match.teamB?.player1Id, match.teamB?.player2Id
      ];
      return ids.includes(a.id);
    });

    const result = resolveSuper8Tie(
      { ...match, scoreA, scoreB },
      db.matches,
      athletes
    );

    if (!result) {
      return NextResponse.json({ error: 'Não foi possível resolver o empate.' }, { status: 400 });
    }

    return NextResponse.json({
      winnerTeam: result.winnerTeam,
      tieBreaker: result.reason
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
