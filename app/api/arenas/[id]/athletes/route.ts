import { NextRequest, NextResponse } from 'next/server';
import { arenaService } from '@/lib/services/arenaService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const result = arenaService.getAthletesByArena(id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }
    
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id: arenaId } = await params;
    const body = await req.json();
    const { athleteId, status } = body;

    const result = arenaService.associateAthlete(arenaId, athleteId, status || 'ATIVO');
    
    if (!result.success) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}

// Interface expects:
// - backend receives ativo = true / false
// - relationship becomes ATIVO / BLOQUEADO
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id: arenaId } = await params;
    const body = await req.json();
    const { athleteId, ativo } = body;

    if (athleteId === undefined || ativo === undefined) {
            await flushWrites();
return NextResponse.json({ error: 'Parâmetros athleteId e ativo são obrigatórios.' }, { status: 400 });
    }

    const result = arenaService.updateAssociation(arenaId, athleteId, ativo);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }
    
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id: arenaId } = await params;
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
            await flushWrites();
return NextResponse.json({ error: 'O parâmetro athleteId é obrigatório na URL.' }, { status: 400 });
    }

    const result = arenaService.removeAssociation(arenaId, athleteId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({ success: true, message: 'Associação removida com sucesso.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
