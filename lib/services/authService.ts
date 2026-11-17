import { readDB, writeDB, User, Profile } from '../db/store';

export const authService = {
  validateLogin(username: string, passwordInput: string): { 
    success: boolean; 
    user?: Omit<User, 'password'> & { profile?: Profile }; 
    error?: string 
  } {
    const db = readDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (user.status === 'INATIVO') {
      return { success: false, error: 'Este usuário está inativo ou desativado. Entre em contato com o administrador.' };
    }

    if (user.password !== passwordInput) {
      return { success: false, error: 'Senha incorreta.' };
    }

    // Obter perfil e permissões completas
    const profile = (db.profiles || []).find(p => p.id === user.profileId);

    // Return user details without password
    const { password, ...userWithoutPassword } = user;
    return { 
      success: true, 
      user: {
        ...userWithoutPassword,
        profile
      }
    };
  },

  getArenaAdmin(arenaId: string): User | null {
    const db = readDB();
    return db.users.find(u => u.arenaId === arenaId && u.role === 'ARENA_ADMIN') || null;
  },

  createOrUpdateArenaAdmin(arenaId: string, arenaName: string, usernameInput: string, passwordInput: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const username = usernameInput.trim().toLowerCase();
    
    if (!username || !passwordInput) {
      return { success: false, error: 'Usuário e senha do administrador são obrigatórios.', code: 400 };
    }

    // Check if username is taken by ANY other user
    const existing = db.users.find(u => u.username.toLowerCase() === username && u.arenaId !== arenaId);
    if (existing) {
      return { success: false, error: `Nome de usuário "${usernameInput}" já está em uso.`, code: 409 };
    }

    // Find if relationship user already exists for this arena
    const adminIndex = db.users.findIndex(u => u.arenaId === arenaId && u.role === 'ARENA_ADMIN');

    if (adminIndex !== -1) {
      // Update existing admin
      db.users[adminIndex].username = username;
      db.users[adminIndex].password = passwordInput;
      db.users[adminIndex].name = `${arenaName} Admin`;
      db.users[adminIndex].profileId = db.users[adminIndex].profileId || 'prof-organizador';
      db.users[adminIndex].status = 'ATIVO';
      db.users[adminIndex].source = 'ORGANIZADOR';
      db.users[adminIndex].updatedAt = new Date().toISOString();
    } else {
      // Create new admin user
      const newAdmin: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 11),
        username,
        password: passwordInput,
        role: 'ARENA_ADMIN',
        arenaId,
        name: `${arenaName} Admin`,
        status: 'ATIVO',
        profileId: 'prof-organizador',
        source: 'ORGANIZADOR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newAdmin);
    }

    writeDB(db);
    return { success: true };
  }
};

