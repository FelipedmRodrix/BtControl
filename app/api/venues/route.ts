import { NextRequest, NextResponse } from 'next/server';
import { venueService } from '@/lib/services/venueService';

export async function GET() {
  try {
    const venues = venueService.getAll();
    return NextResponse.json(venues, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar arenas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = venueService.create(body);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar criação de arena.' }, { status: 400 });
  }
}
