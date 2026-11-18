import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const authSuper8 = checkApiPermission(req, 'super8', 'view');
    const authStandings = authSuper8.authorized
      ? authSuper8
      : checkApiPermission(req, 'super8-standings', 'view');
    const auth = authSuper8.authorized ? authSuper8 : authStandings;
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const data = super8ManagerService.getById(id);
    if (!data) {
      return NextResponse.json({ error: 'Super 8 não encontrado.' }, { status: 404 });
    }

    if (auth.user?.role === 'ARENA_ADMIN' && auth.user.arenaId && data.event.arenaId !== auth.user.arenaId) {
      return NextResponse.json({ error: 'Acesso negado a este Super 8.' }, { status: 403 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar Super 8.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
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
    if (auth.user?.role === 'ARENA_ADMIN' && auth.user.arenaId && existing.event.arenaId !== auth.user.arenaId) {
      return NextResponse.json({ error: 'Acesso negado a este Super 8.' }, { status: 403 });
    }

    const body = await req.json();
    const result = super8ManagerService.update(id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar Super 8.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'delete');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const existing = super8ManagerService.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Super 8 não encontrado.' }, { status: 404 });
    }
    if (auth.user?.role === 'ARENA_ADMIN' && auth.user.arenaId && existing.event.arenaId !== auth.user.arenaId) {
      return NextResponse.json({ error: 'Acesso negado a este Super 8.' }, { status: 403 });
    }

    const result = super8ManagerService.delete(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir Super 8.' }, { status: 400 });
  }
}
