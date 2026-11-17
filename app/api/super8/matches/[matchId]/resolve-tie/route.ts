import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ matchId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const result = super8ManagerService.resolveTiePreview(matchId, Number(body.scoreA), Number(body.scoreB));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({
      winnerTeam: result.winnerTeam,
      tieBreaker: result.tieBreaker
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao resolver empate no Super 8.' }, { status: 400 });
  }
}
