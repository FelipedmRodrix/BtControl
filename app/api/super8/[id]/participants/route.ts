import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const existing = super8ManagerService.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Super 8 não encontrado.' }, { status: 404 });
    }
    if (auth.user && auth.user.role === 'ARENA_ADMIN' && auth.user.arenaId && existing.event.arenaId !== auth.user.arenaId) {
      return NextResponse.json({ error: 'Acesso negado a este evento Super 8.' }, { status: 403 });
    }

    const body = await req.json();
    const athleteIds: string[] = Array.isArray(body.athleteIds)
      ? body.athleteIds
      : body.athleteId
        ? [body.athleteId]
        : [];

    if (athleteIds.length === 0) {
      return NextResponse.json({ error: 'Selecione pelo menos um atleta para inscrever no Super 8.' }, { status: 400 });
    }

    const res = super8ManagerService.addParticipants(id, athleteIds, body.status || 'CONFIRMADA');
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: res.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(res.data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao adicionar atletas ao Super 8.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    if (!athleteId) {
      return NextResponse.json({ error: 'O parâmetro athleteId é obrigatório.' }, { status: 400 });
    }

    const existing = super8ManagerService.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Super 8 não encontrado.' }, { status: 404 });
    }
    if (auth.user && auth.user.role === 'ARENA_ADMIN' && auth.user.arenaId && existing.event.arenaId !== auth.user.arenaId) {
      return NextResponse.json({ error: 'Acesso negado a este evento Super 8.' }, { status: 403 });
    }

    const res = super8ManagerService.removeParticipant(id, athleteId);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: res.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(res.data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao remover atleta do Super 8.' }, { status: 400 });
  }
}
