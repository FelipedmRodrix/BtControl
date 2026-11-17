import { readDB, writeDB, Profile, ScreenPermission, SystemScreen, ALL_SYSTEM_SCREENS, DEFAULT_SYSTEM_PROFILES, User } from '../db/store';

export const profileService = {
  getAll(): Profile[] {
    const db = readDB();
    return db.profiles || DEFAULT_SYSTEM_PROFILES;
  },

  getById(id: string): Profile | null {
    const db = readDB();
    return (db.profiles || DEFAULT_SYSTEM_PROFILES).find(p => p.id === id) || null;
  },

  create(data: { name: string; description?: string; permissions?: ScreenPermission[] }): { success: boolean; data?: Profile; error?: string } {
    const db = readDB();
    const name = data.name?.trim();
    if (!name) {
      return { success: false, error: 'O nome do perfil é obrigatório.' };
    }

    const profiles = db.profiles || DEFAULT_SYSTEM_PROFILES;
    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: `Já existe um perfil cadastrado com o nome "${name}".` };
    }

    // Normalizar permissões para todas as telas do sistema
    const permissionsMap = new Map<SystemScreen, ScreenPermission>();
    (data.permissions || []).forEach(p => {
      permissionsMap.set(p.screen, p);
    });

    const fullPermissions: ScreenPermission[] = ALL_SYSTEM_SCREENS.map(s => {
      const existing = permissionsMap.get(s.id);
      return {
        screen: s.id,
        view: existing ? !!existing.view : false,
        create: existing ? !!existing.create : false,
        edit: existing ? !!existing.edit : false,
        delete: existing ? !!existing.delete : false,
      };
    });

    const newProfile: Profile = {
      id: 'prof-' + Math.random().toString(36).substring(2, 11),
      name,
      description: data.description?.trim() || '',
      isSystem: false,
      permissions: fullPermissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.profiles.push(newProfile);
    writeDB(db);

    return { success: true, data: newProfile };
  },

  update(id: string, data: { name?: string; description?: string; permissions?: ScreenPermission[] }): { success: boolean; data?: Profile; error?: string } {
    const db = readDB();
    const index = (db.profiles || []).findIndex(p => p.id === id);

    if (index === -1) {
      return { success: false, error: 'Perfil não encontrado.' };
    }

    const current = db.profiles[index];

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        return { success: false, error: 'O nome do perfil não pode ser vazio.' };
      }
      const duplicate = db.profiles.find(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        return { success: false, error: `Já existe outro perfil com o nome "${name}".` };
      }
      current.name = name;
    }

    if (data.description !== undefined) {
      current.description = data.description.trim();
    }

    if (data.permissions && Array.isArray(data.permissions)) {
      const permissionsMap = new Map<SystemScreen, ScreenPermission>();
      data.permissions.forEach(p => {
        permissionsMap.set(p.screen, p);
      });

      current.permissions = ALL_SYSTEM_SCREENS.map(s => {
        const p = permissionsMap.get(s.id);
        return {
          screen: s.id,
          view: p ? !!p.view : false,
          create: p ? !!p.create : false,
          edit: p ? !!p.edit : false,
          delete: p ? !!p.delete : false,
        };
      });
    }

    current.updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: current };
  },

  delete(id: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = (db.profiles || []).findIndex(p => p.id === id);

    if (index === -1) {
      return { success: false, error: 'Perfil não encontrado.' };
    }

    if (db.profiles[index].isSystem) {
      return { success: false, error: 'Perfis nativos do sistema não podem ser excluídos.' };
    }

    // Verificar se há usuários usando este perfil
    const usersWithProfile = (db.users || []).filter(u => u.profileId === id);
    if (usersWithProfile.length > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir este perfil pois existem ${usersWithProfile.length} usuário(s) vinculados a ele. Reatribua-os antes.` 
      };
    }

    db.profiles.splice(index, 1);
    writeDB(db);

    return { success: true };
  },

  checkUserPermission(user: User | null | undefined, screen: SystemScreen, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    if (!user) return false;
    if (user.status === 'INATIVO') return false;
    if (user.role === 'SUPER_ADMIN') return true; // Super admin sempre tem acesso completo

    const db = readDB();
    const profile = (db.profiles || DEFAULT_SYSTEM_PROFILES).find(p => p.id === user.profileId);
    if (!profile) {
      // Fallback por role legado caso perfil não encontrado
      if (user.role === 'ARENA_ADMIN') {
        const fallback = DEFAULT_SYSTEM_PROFILES.find(p => p.id === 'prof-organizador');
        const perm = fallback?.permissions.find(p => p.screen === screen);
        return perm ? perm[action] : false;
      }
      return false;
    }

    const perm = profile.permissions.find(p => p.screen === screen);
    return perm ? perm[action] : false;
  }
};
