import { NextRequest, NextResponse } from 'next/server';
import { athleteService } from '@/lib/services/athleteService';

export async function GET(req: NextRequest) {
  try {
    const athletes = athleteService.getAll();
    return NextResponse.json(athletes, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = athleteService.create(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
