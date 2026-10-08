import { NextRequest, NextResponse } from 'next/server';
import { tournamentService } from '@/lib/services/tournamentService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tournament = tournamentService.getById(id);
    if (!tournament) {
      return NextResponse.json({ error: 'Torneio não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(tournament, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = tournamentService.update(id, body);

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
    const { id } = await params;
    const result = tournamentService.delete(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({ success: true, message: 'Torneio excluído com sucesso.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
