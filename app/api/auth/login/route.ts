import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const result = authService.validateLogin(username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar login.' }, { status: 400 });
  }
}
