import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = super8ManagerService.setAthletes(id, Array.isArray(body.athleteIds) ? body.athleteIds : []);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar participantes.' }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    if (!body.athleteId) {
      return NextResponse.json({ error: 'athleteId é obrigatório.' }, { status: 400 });
    }

    const result = super8ManagerService.addAthlete(id, body.athleteId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao adicionar atleta.' }, { status: 400 });
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
    let athleteId = searchParams.get('athleteId') || '';
    if (!athleteId) {
      try {
        const body = await req.json();
        athleteId = body?.athleteId || '';
      } catch {}
    }

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId é obrigatório.' }, { status: 400 });
    }

    const result = super8ManagerService.removeAthlete(id, athleteId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao remover atleta.' }, { status: 400 });
  }
}
