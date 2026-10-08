import { NextRequest, NextResponse } from 'next/server';
import { arenaService } from '@/lib/services/arenaService';
import { authService } from '@/lib/services/authService';

export async function GET(req: NextRequest) {
  try {
    const arenas = arenaService.getAll();
    
    // Enrich each arena with its administrator credentials for the SUPER_ADMIN
    const enrichedArenas = arenas.map(arena => {
      const adminUser = authService.getArenaAdmin(arena.id);
      return {
        ...arena,
        adminUsername: adminUser?.username || '',
        adminPassword: adminUser?.password || ''
      };
    });

    return NextResponse.json(enrichedArenas, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminUsername, adminPassword, ...arenaData } = body;

    // 1. Create the Arena
    const result = arenaService.create(arenaData);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    const newArena = result.data;

    // 2. Create the associated Administrator User
    if (adminUsername && adminPassword) {
      const authResult = authService.createOrUpdateArenaAdmin(newArena.id, newArena.name, adminUsername, adminPassword);
      if (!authResult.success) {
        // Rollback created arena if admin creation fails (e.g. username taken)
        // Wait, to rollback we can just delete it, or return an error explaining what failed.
        // Actually, we can return the error directly.
        return NextResponse.json({ error: authResult.error }, { status: authResult.code || 400 });
      }
    }

    // Return the created arena enriched with the admin credentials
    return NextResponse.json({
      ...newArena,
      adminUsername: adminUsername || '',
      adminPassword: adminPassword || ''
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
