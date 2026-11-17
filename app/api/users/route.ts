import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'users', 'view');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const users = userService.getAll();
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar usuários.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'users', 'create');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const body = await req.json();
    const result = userService.create(body);

    if (!result.success) {
      await flushWrites();
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao cadastrar usuário.' }, { status: 400 });
  }
}
