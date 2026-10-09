import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/services/matchService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { score, winnerDuoId, isWO, court, scoreA, scoreB, winnerTeam, isDraw, tieBreaker } = body;

    let res;
    if (court !== undefined) {
      res = matchService.updateCourt(id, court);
    } else if (isWO) {
      res = matchService.toggleWO(id, winnerDuoId, winnerTeam);
    } else {
      res = matchService.updateResult(id, score, winnerDuoId, scoreA, scoreB, winnerTeam, isDraw, tieBreaker);
    }

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, tieBreaker: (res as any).tieBreaker });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const res = matchService.delete(id);

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
