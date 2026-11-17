import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'view');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const standings = super8ManagerService.getStandings(id);
    return NextResponse.json(standings, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao calcular classificação do Super 8.' }, { status: 500 });
  }
}
