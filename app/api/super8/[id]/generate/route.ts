import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await ensureDbInitialized();
    const auth = checkApiPermission(req, 'super8', 'edit');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const result = super8ManagerService.generateMatches(id, body.date, body.courtPrefix || body.court);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    await flushWrites();
    return NextResponse.json({ success: true, count: result.count, matches: result.data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao gerar rodadas do Super 8.' }, { status: 400 });
  }
}
