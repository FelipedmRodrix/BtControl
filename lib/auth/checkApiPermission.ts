import { NextRequest } from 'next/server';
import { profileService } from '@/lib/services/profileService';
import { readDB, SystemScreen } from '@/lib/db/store';

// Helper to authenticate and check permissions
export function checkApiPermission(
  req: NextRequest,
  screen: SystemScreen,
  action: 'view' | 'create' | 'edit' | 'delete'
): { authorized: boolean; error?: string; user?: any } {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  const db = readDB();

  // If no user headers passed, check if SUPER_ADMIN was supplied
  if (userRole === 'SUPER_ADMIN') {
    return { authorized: true };
  }

  if (!userId) {
    return { authorized: false, error: 'Acesso não autorizado. Identificação de usuário ausente.' };
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return { authorized: false, error: 'Usuário não encontrado.' };
  }

  if (user.status === 'INATIVO') {
    return { authorized: false, error: 'Usuário inativo ou desativado.' };
  }

  if (user.role === 'SUPER_ADMIN') {
    return { authorized: true, user };
  }

  const isAllowed = profileService.checkUserPermission(user, screen, action);
  if (!isAllowed) {
    return {
      authorized: false,
      error: `Acesso negado: seu perfil não possui permissão para ${
        action === 'view' ? 'visualizar' : action === 'create' ? 'cadastrar' : action === 'edit' ? 'editar' : 'excluir'
      } na tela "${screen}".`,
      user,
    };
  }

  return { authorized: true, user };
}
