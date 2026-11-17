import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ matchId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { matchId } = await params;
    const body = await req.json();

    let result;
    if (body.court !== undefined) {
      result = super8ManagerService.updateMatchCourt(matchId, body.court);
    } else if (body.isWO) {
      result = super8ManagerService.toggleMatchWO(matchId, body.winnerTeam || 'TEAM_A');
    } else {
      result = super8ManagerService.updateMatchResult(matchId, body);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar partida do Super 8.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'delete');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { matchId } = await params;
    const result = super8ManagerService.deleteMatch(matchId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir partida do Super 8.' }, { status: 400 });
  }
}
