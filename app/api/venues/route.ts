import { NextRequest, NextResponse } from 'next/server';
import { venueService } from '@/lib/services/venueService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
export async function GET() {
  try {
  await ensureDbInitialized();
    const venues = venueService.getAll();
    return NextResponse.json(venues, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar arenas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  await ensureDbInitialized();
    const body = await req.json();
    const result = venueService.create(body);

    if (!result.success || !result.data) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar criação de arena.' }, { status: 400 });
  }
}
