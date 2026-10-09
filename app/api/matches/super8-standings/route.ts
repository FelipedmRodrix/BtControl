import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/services/matchService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const categoryId = searchParams.get('categoryId');

    if (!tournamentId || !categoryId) {
      return NextResponse.json({ error: 'tournamentId e categoryId são obrigatórios.' }, { status: 400 });
    }

    const standings = matchService.getSuper8Standings(tournamentId, categoryId);
    return NextResponse.json(standings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
