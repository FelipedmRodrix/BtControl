import { NextRequest, NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profileService';
import { ensureDbInitialized, flushWrites } from '@/lib/db/store';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'profiles', 'view');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const profiles = profileService.getAll();
    return NextResponse.json(profiles, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar perfis.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const perm = checkApiPermission(req, 'profiles', 'create');
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const body = await req.json();
    const result = profileService.create(body);
    if (!result.success) {
      await flushWrites();
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao criar perfil.' }, { status: 400 });
  }
}
