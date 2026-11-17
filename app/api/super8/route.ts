import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'view');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const queryArenaId = searchParams.get('arenaId') || undefined;
    const effectiveArenaId =
      auth.user?.role === 'ARENA_ADMIN' && auth.user.arenaId
        ? auth.user.arenaId
        : queryArenaId;

    const events = super8ManagerService.getAll(effectiveArenaId);
    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const body = await req.json();
    if (auth.user?.role === 'ARENA_ADMIN' && auth.user.arenaId) {
      body.arenaId = auth.user.arenaId;
    }

    const result = super8ManagerService.create(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao criar Super 8.' }, { status: 400 });
  }
}
