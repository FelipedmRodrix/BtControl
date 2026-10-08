import { readDB, writeDB, User } from '../db/store';

export const authService = {
  validateLogin(username: string, passwordInput: string): { success: boolean; user?: Omit<User, 'password'>; error?: string } {
    const db = readDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (user.password !== passwordInput) {
      return { success: false, error: 'Senha incorreta.' };
    }

    // Return user details without password
    const { password, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
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
      return { success: false, error: `Nome de usuário "${usernameInput}" já está em uso por outra arena.`, code: 409 };
    }

    // Find if relationship user already exists for this arena
    const adminIndex = db.users.findIndex(u => u.arenaId === arenaId && u.role === 'ARENA_ADMIN');

    if (adminIndex !== -1) {
      // Update existing admin
      db.users[adminIndex].username = username;
      db.users[adminIndex].password = passwordInput;
      db.users[adminIndex].name = `${arenaName} Admin`;
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newAdmin);
    }

    writeDB(db);
    return { success: true };
  }
};
