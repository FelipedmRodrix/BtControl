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

    const body = await req.json().catch(() => ({}));
    const action = body.action === 'reopen' ? 'reopen' : 'finish';
    const res = super8ManagerService.finishEvent(id, action);

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: res.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(res.data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao encerrar Super 8.' }, { status: 400 });
  }
}
