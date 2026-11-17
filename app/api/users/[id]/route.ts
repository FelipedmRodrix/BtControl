import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'users', 'view');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const { id } = await params;
    const user = userService.getById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar usuário.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'users', 'edit');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = userService.update(id, body);

    if (!result.success) {
      await flushWrites();
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar usuário.' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'users', 'delete');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const { id } = await params;
    const result = userService.delete(id);

    if (!result.success) {
      await flushWrites();
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir usuário.' }, { status: 400 });
  }
}
