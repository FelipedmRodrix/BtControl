import { NextRequest, NextResponse } from 'next/server';
import { registrationService } from '@/lib/services/registrationService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const arenaId = searchParams.get('arenaId') || undefined;

    const list = registrationService.getAll(arenaId);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, categoryId, athleteId, status } = body;

    const res = registrationService.create({ tournamentId, categoryId, athleteId, status });
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res.data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
