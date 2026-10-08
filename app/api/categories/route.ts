import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/categoryService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const arenaId = searchParams.get('arenaId') || undefined;

    const categories = categoryService.getAll(arenaId);
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const userRole = req.headers.get('x-user-role') || '';

    if (action === 'reset' || action === 'presets') {
      const resetResult = categoryService.resetToPresets(userRole);
      if (!resetResult.success) {
        return NextResponse.json({ error: resetResult.error }, { status: resetResult.code || 403 });
      }
      return NextResponse.json({ success: true, count: resetResult.count }, { status: 200 });
    }

    const body = await req.json();
    const result = categoryService.create(body, userRole);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
