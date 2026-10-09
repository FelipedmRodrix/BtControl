import { NextRequest, NextResponse } from 'next/server';
import { venueService } from '@/lib/services/venueService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const venue = venueService.getById(id);
    if (!venue) {
      return NextResponse.json({ error: 'Arena não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(venue, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const body = await req.json();
    const result = venueService.update(id, body);

    if (!result.success || !result.data) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao atualizar arena.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const result = venueService.delete(id);

    if (!result.success) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir arena.' }, { status: 500 });
  }
}
