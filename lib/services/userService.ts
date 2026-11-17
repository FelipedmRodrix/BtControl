import { readDB, writeDB, User, Profile } from '../db/store';
import { profileService } from './profileService';

export const userService = {
  getAll(): (Omit<User, 'password'> & { profileName?: string })[] {
    const db = readDB();
    const profiles = db.profiles || [];

    return db.users.map(u => {
      const { password, ...userWithoutPassword } = u;
      const profile = profiles.find(p => p.id === u.profileId);
      return {
        ...userWithoutPassword,
        profileName: profile?.name || (u.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Organizador')
      };
    });
  },

  getById(id: string): (Omit<User, 'password'> & { profile?: Profile }) | null {
    const db = readDB();
    const user = db.users.find(u => u.id === id);
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    const profile = (db.profiles || []).find(p => p.id === user.profileId);

    return {
      ...userWithoutPassword,
      profile
    };
  },

  create(data: {
    username: string;
    password?: string;
    name: string;
    email?: string;
    phone?: string;
    role?: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
    profileId?: string;
    arenaId?: string | null;
    status?: 'ATIVO' | 'INATIVO';
    source?: 'SISTEMA' | 'ORGANIZADOR' | 'ATLETA' | 'IMPORTACAO';
  }): { success: boolean; data?: Omit<User, 'password'>; error?: string } {
    const db = readDB();
    const username = data.username?.trim().toLowerCase();
    const name = data.name?.trim();

    if (!username) {
      return { success: false, error: 'O nome de usuário (login) é obrigatório.' };
    }
    if (!name) {
      return { success: false, error: 'O nome do usuário é obrigatório.' };
    }

    const existing = db.users.find(u => u.username.toLowerCase() === username);
    if (existing) {
      return { success: false, error: `O nome de usuário "${username}" já está cadastrado.` };
    }

    // Validar se o perfil existe
    const targetProfileId = data.profileId || (data.role === 'SUPER_ADMIN' ? 'prof-super-admin' : 'prof-organizador');
    const profile = (db.profiles || []).find(p => p.id === targetProfileId);
    if (!profile && targetProfileId) {
      return { success: false, error: 'Perfil de acesso informado não existe.' };
    }

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 11),
      username,
      password: data.password || '123456',
      name,
      email: data.email?.trim() || '',
      phone: data.phone?.replace(/\D/g, '') || '',
      role: data.role || (targetProfileId === 'prof-super-admin' ? 'SUPER_ADMIN' : data.arenaId ? 'ARENA_ADMIN' : 'CUSTOM'),
      arenaId: data.arenaId || null,
      status: data.status || 'ATIVO',
      profileId: targetProfileId,
      source: data.source || 'SISTEMA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    const { password, ...createdWithoutPassword } = newUser;
    return { success: true, data: createdWithoutPassword };
  },

  update(id: string, data: {
    username?: string;
    password?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
    profileId?: string;
    arenaId?: string | null;
    status?: 'ATIVO' | 'INATIVO';
  }): { success: boolean; data?: Omit<User, 'password'>; error?: string } {
    const db = readDB();
    const index = db.users.findIndex(u => u.id === id);

    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const current = db.users[index];

    if (data.username !== undefined) {
      const username = data.username.trim().toLowerCase();
      if (!username) {
        return { success: false, error: 'Nome de usuário não pode ser vazio.' };
      }
      const duplicate = db.users.find(u => u.id !== id && u.username.toLowerCase() === username);
      if (duplicate) {
        return { success: false, error: `Já existe outro usuário com o login "${username}".` };
      }
      current.username = username;
    }

    if (data.password !== undefined && data.password.trim() !== '') {
      current.password = data.password;
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        return { success: false, error: 'Nome não pode ser vazio.' };
      }
      current.name = name;
    }

    if (data.email !== undefined) current.email = data.email.trim();
    if (data.phone !== undefined) current.phone = data.phone.replace(/\D/g, '');
    if (data.arenaId !== undefined) current.arenaId = data.arenaId;

    if (data.profileId !== undefined) {
      const profile = (db.profiles || []).find(p => p.id === data.profileId);
      if (!profile) {
        return { success: false, error: 'Perfil de acesso não encontrado.' };
      }
      current.profileId = data.profileId;
      if (data.profileId === 'prof-super-admin') {
        current.role = 'SUPER_ADMIN';
      } else if (data.profileId === 'prof-organizador') {
        current.role = current.arenaId ? 'ARENA_ADMIN' : 'CUSTOM';
      }
    }

    if (data.status !== undefined) {
      current.status = data.status;
    }

    if (data.role !== undefined) {
      current.role = data.role;
    }

    current.updatedAt = new Date().toISOString();
    writeDB(db);

    const { password, ...updatedWithoutPassword } = current;
    return { success: true, data: updatedWithoutPassword };
  },

  delete(id: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.users.findIndex(u => u.id === id);

    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    // Não permitir deletar o super admin principal
    if (db.users[index].username === 'admin') {
      return { success: false, error: 'O usuário principal admin do sistema não pode ser removido.' };
    }

    db.users.splice(index, 1);
    writeDB(db);

    return { success: true };
  },

  syncUserFromAthlete(athlete: { id: string; name: string; cpf: string; email?: string; phone?: string; status: 'ATIVO' | 'INATIVO' }) {
    const db = readDB();
    const cleanCPF = (athlete.cpf || '').replace(/\D/g, '');
    const candidateUsername = cleanCPF || (athlete.email ? athlete.email.toLowerCase().trim() : `ath_${athlete.id}`);

    // Procurar usuário existente por athleteId, username ou CPF
    let existingIndex = db.users.findIndex(u => 
      (u.athleteId && u.athleteId === athlete.id) ||
      (u.username && u.username.toLowerCase() === candidateUsername.toLowerCase()) ||
      (cleanCPF && u.username === cleanCPF)
    );

    if (existingIndex !== -1) {
      // Atualizar dados cadastrais mantendo o perfil e credenciais
      db.users[existingIndex].name = athlete.name;
      db.users[existingIndex].athleteId = athlete.id;
      if (athlete.email) db.users[existingIndex].email = athlete.email;
      if (athlete.phone) db.users[existingIndex].phone = athlete.phone;
      if (athlete.status === 'INATIVO') db.users[existingIndex].status = 'INATIVO';
      db.users[existingIndex].updatedAt = new Date().toISOString();
    } else {
      // Criar novo usuário associado
      const newUser: User = {
        id: `usr-ath-${athlete.id}`,
        username: candidateUsername,
        password: '123',
        role: 'CUSTOM',
        arenaId: null,
        name: athlete.name,
        email: athlete.email || '',
        phone: athlete.phone || '',
        status: athlete.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
        profileId: 'prof-visualizador',
        athleteId: athlete.id,
        source: 'ATLETA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newUser);
    }

    writeDB(db);
  }
};
