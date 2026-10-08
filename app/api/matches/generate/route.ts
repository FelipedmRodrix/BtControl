import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/services/matchService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, categoryId, date, court } = body;

    if (!tournamentId || !categoryId) {
      return NextResponse.json({ error: 'Os campos tournamentId e categoryId são obrigatórios.' }, { status: 400 });
    }

    const res = matchService.generateMatchesForCategory(tournamentId, categoryId, date, court);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: res.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
