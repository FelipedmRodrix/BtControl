import { NextRequest, NextResponse } from 'next/server';
import { arenaService } from '@/lib/services/arenaService';
import { authService } from '@/lib/services/authService';

import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const arena = arenaService.getById(id);
    if (!arena) {
      return NextResponse.json({ error: 'Arena não encontrada.' }, { status: 404 });
    }

    const adminUser = authService.getArenaAdmin(id);

    return NextResponse.json({
      ...arena,
      adminUsername: adminUser?.username || '',
      adminPassword: adminUser?.password || ''
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const body = await req.json();
    const { adminUsername, adminPassword, ...arenaData } = body;

    // 1. Update the Arena Data
    const result = arenaService.update(id, arenaData);
    if (!result.success || !result.data) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    const updatedArena = result.data;

    // 2. Update the associated Administrator Credentials if provided
    if (adminUsername !== undefined || adminPassword !== undefined) {
      // Find existing admin to fallback if one value is omitted
      const currentAdmin = authService.getArenaAdmin(id);
      const targetUsername = adminUsername !== undefined ? adminUsername : (currentAdmin?.username || '');
      const targetPassword = adminPassword !== undefined ? adminPassword : (currentAdmin?.password || '');

      if (targetUsername && targetPassword) {
        const authResult = authService.createOrUpdateArenaAdmin(id, updatedArena.name, targetUsername, targetPassword);
        if (!authResult.success) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.code || 400 });
        }
      }
    }

    const adminUser = authService.getArenaAdmin(id);

    return NextResponse.json({
      ...updatedArena,
      adminUsername: adminUser?.username || '',
      adminPassword: adminUser?.password || ''
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
  await ensureDbInitialized();
    const { id } = await params;
    const result = arenaService.delete(id);
    if (!result.success) {
            await flushWrites();
return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar exclusão da arena.' }, { status: 500 });
  }
}
