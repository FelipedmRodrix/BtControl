import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db/store';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

export async function GET() {
  try {
    await ensureDbInitialized();
    const events = super8ManagerService.getAll();

    const publicEvents = events.map(ev => ({
      id: ev.id,
      name: ev.name,
      seriesName: ev.seriesName,
      arenaName: ev.arenaName || 'Organizador',
      venueName: ev.venueName || '',
      courtsUsed: ev.courtsUsed,
      startDate: ev.startDate,
      endDate: ev.endDate,
      status: ev.status,
      categoryName: ev.categoryName,
      level: ev.level,
      games: ev.games,
      thaiBreak: ev.thaiBreak,
      athletesCount: ev.athletesCount,
      matchesCount: ev.matchesCount,
      playedMatchesCount: ev.playedMatchesCount,
      pendingMatchesCount: ev.pendingMatchesCount,
      createdAt: ev.createdAt
    }));

    return NextResponse.json(publicEvents, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar campeonatos públicos.' },
      { status: 500 }
    );
  }
}
