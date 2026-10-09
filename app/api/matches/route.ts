import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/services/matchService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const arenaId = searchParams.get('arenaId') || undefined;
    const tournamentId = searchParams.get('tournamentId') || undefined;

    const list = matchService.getAll(arenaId, tournamentId);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, categoryId, stage, groupName, duo1Id, duo2Id, date, time, court } = body;

    const res = matchService.create({
      tournamentId,
      categoryId,
      stage,
      groupName,
      duo1Id,
      duo2Id,
      date,
      time,
      court
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res.data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
