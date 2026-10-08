import { NextRequest, NextResponse } from 'next/server';
import { athleteService } from '@/lib/services/athleteService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const athlete = athleteService.getById(id);
    if (!athlete) {
      return NextResponse.json({ error: 'Atleta não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(athlete, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = athleteService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }
    
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
