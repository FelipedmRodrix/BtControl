import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db/store';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const { id } = await params;
    const data = super8ManagerService.getById(id);

    if (!data) {
      return NextResponse.json({ error: 'Campeonato Super 8 não encontrado.' }, { status: 404 });
    }

    const publicEvent = {
      id: data.event.id,
      name: data.event.name,
      seriesName: data.event.seriesName,
      arenaName: data.event.arenaName || 'Organizador',
      venueName: data.event.venueName || '',
      courtsUsed: data.event.courtsUsed,
      startDate: data.event.startDate,
      endDate: data.event.endDate,
      status: data.event.status,
      categoryName: data.event.categoryName,
      level: data.event.level,
      games: data.event.games,
      thaiBreak: data.event.thaiBreak,
      athleteIds: data.event.athleteIds || [],
      createdAt: data.event.createdAt
    };

    const publicAthletes = data.athletes.map(a => ({
      id: a.id,
      name: a.name,
      gender: a.gender
    }));

    return NextResponse.json(
      {
        event: publicEvent,
        athletes: publicAthletes,
        matches: data.matches,
        standings: data.standings
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar classificação pública.' },
      { status: 500 }
    );
  }
}
