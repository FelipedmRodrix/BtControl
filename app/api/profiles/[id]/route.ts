import { NextRequest, NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profileService';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'profiles', 'view');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const { id } = await params;
    const profile = profileService.getById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar perfil.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'profiles', 'edit');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = profileService.update(id, body);

    if (!result.success) {
      await flushWrites();
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar perfil.' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'profiles', 'delete');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const { id } = await params;
    const result = profileService.delete(id);

    if (!result.success) {
      await flushWrites();
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Perfil excluído com sucesso.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir perfil.' }, { status: 400 });
  }
}
