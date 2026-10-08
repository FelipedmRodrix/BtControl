import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/categoryService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const category = categoryService.getById(id);
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(category, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userRole = req.headers.get('x-user-role') || '';

    const result = categoryService.update(id, body, userRole);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userRole = req.headers.get('x-user-role') || '';

    const result = categoryService.delete(id, userRole);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({ success: true, message: 'Categoria excluída com sucesso.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar requisição.' }, { status: 400 });
  }
}
