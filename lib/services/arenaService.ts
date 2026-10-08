import { readDB, writeDB, Arena, ArenaAthlete, Athlete } from '../db/store';

export const arenaService = {
  getAll(): Arena[] {
    const db = readDB();
    return db.arenas;
  },

  getById(id: string): Arena | null {
    const db = readDB();
    return db.arenas.find(a => a.id === id) || null;
  },

  create(data: Omit<Arena, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; data?: Arena; error?: string; code?: number } {
    const db = readDB();

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'Nome da arena deve conter no mínimo 3 caracteres.', code: 400 };
    }

    const newArena: Arena = {
      id: 'arena-' + Math.random().toString(36).substring(2, 11),
      name: data.name.trim(),
      owner: data.owner || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      status: data.status || 'ATIVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.arenas.push(newArena);
    writeDB(db);

    return { success: true, data: newArena };
  },

  update(id: string, data: Partial<Omit<Arena, 'id' | 'createdAt' | 'updatedAt'>>): { success: boolean; data?: Arena; error?: string; code?: number } {
    const db = readDB();
    const index = db.arenas.findIndex(a => a.id === id);

    if (index === -1) {
      return { success: false, error: 'Arena não encontrada.', code: 404 };
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length < 3) {
        return { success: false, error: 'Nome da arena deve conter no mínimo 3 caracteres.', code: 400 };
      }
      db.arenas[index].name = data.name.trim();
    }

    if (data.owner !== undefined) db.arenas[index].owner = data.owner;
    if (data.email !== undefined) db.arenas[index].email = data.email;
    if (data.phone !== undefined) db.arenas[index].phone = data.phone;
    if (data.city !== undefined) db.arenas[index].city = data.city;
    if (data.state !== undefined) db.arenas[index].state = data.state;
    if (data.status !== undefined) db.arenas[index].status = data.status;

    db.arenas[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: db.arenas[index] };
  },

  delete(id: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const index = db.arenas.findIndex(a => a.id === id);

    if (index === -1) {
      return { success: false, error: 'Arena não encontrada.', code: 404 };
    }

    // 1. Identify all tournaments belonging to this arena
    const tournamentsInArena = db.tournaments.filter(t => t.arenaId === id);
    const tourIds = new Set(tournamentsInArena.map(t => t.id));

    // 2. Identify all categories belonging to these tournaments
    const categoriesInArena = db.categories.filter(c => c.tournamentId !== undefined && tourIds.has(c.tournamentId));
    const categoryIds = new Set(categoriesInArena.map(c => c.id));

    // 3. Remove all registrations linked to these tournaments or categories
    db.registrations = db.registrations.filter(
      r => !tourIds.has(r.tournamentId) && !categoryIds.has(r.categoryId)
    );

    // 4. Remove all duos formed in these tournaments or categories
    db.duos = db.duos.filter(
      d => !tourIds.has(d.tournamentId) && !categoryIds.has(d.categoryId)
    );

    // 5. Remove all matches scheduled in these tournaments or categories
    db.matches = db.matches.filter(
      m => !tourIds.has(m.tournamentId) && !categoryIds.has(m.categoryId)
    );

    // 6. Remove categories linked to these tournaments
    db.categories = db.categories.filter(c => c.tournamentId === undefined || !tourIds.has(c.tournamentId));

    // 7. Remove tournaments linked to this arena
    db.tournaments = db.tournaments.filter(t => t.arenaId !== id);

    // 8. Remove associated arena admin users
    db.users = db.users.filter(u => u.arenaId !== id);

    // 9. Remove associated athlete relationships
    db.arenaAthletes = db.arenaAthletes.filter(rel => rel.arenaId !== id);

    // 10. Remove the arena itself
    db.arenas.splice(index, 1);

    writeDB(db);

    return { success: true };
  },

  // Relationship: Arena Athlete
  getAthletesByArena(arenaId: string): { success: boolean; data?: (Athlete & { arenaStatus: 'ATIVO' | 'BLOQUEADO' })[]; error?: string; code?: number } {
    const db = readDB();
    const arena = db.arenas.find(a => a.id === arenaId);
    if (!arena) {
      return { success: false, error: 'Arena não encontrada.', code: 404 };
    }

    // Find relationships
    const relationships = db.arenaAthletes.filter(rel => rel.arenaId === arenaId);
    
    // Map with Athlete details
    const result = relationships.map(rel => {
      const athlete = db.athletes.find(ath => ath.id === rel.athleteId);
      if (!athlete) return null;
      return {
        ...athlete,
        arenaStatus: rel.status
      };
    }).filter(Boolean) as (Athlete & { arenaStatus: 'ATIVO' | 'BLOQUEADO' })[];

    return { success: true, data: result };
  },

  // Rules:
  // - uma arena não pode associar o mesmo atleta duas vezes (409)
  // - arena inexistente deve retornar 404
  // - atleta inexistente deve retornar 404
  associateAthlete(arenaId: string, athleteId: string, status: 'ATIVO' | 'BLOQUEADO' = 'ATIVO'): { success: boolean; data?: ArenaAthlete; error?: string; code?: number } {
    const db = readDB();

    // Verify arena exists
    const arena = db.arenas.find(a => a.id === arenaId);
    if (!arena) {
      return { success: false, error: 'Arena não encontrada.', code: 404 };
    }

    // Verify athlete exists
    const athlete = db.athletes.find(a => a.id === athleteId);
    if (!athlete) {
      return { success: false, error: 'Atleta não encontrado.', code: 404 };
    }

    // Check duplicate relationship
    const duplicate = db.arenaAthletes.find(rel => rel.arenaId === arenaId && rel.athleteId === athleteId);
    if (duplicate) {
      return { success: false, error: 'O atleta já está associado a esta arena.', code: 409 };
    }

    const newRel: ArenaAthlete = {
      id: 'aa-' + Math.random().toString(36).substring(2, 11),
      arenaId,
      athleteId,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.arenaAthletes.push(newRel);
    writeDB(db);

    return { success: true, data: newRel };
  },

  updateAssociation(arenaId: string, athleteId: string, active: boolean): { success: boolean; data?: ArenaAthlete; error?: string; code?: number } {
    const db = readDB();

    const relIndex = db.arenaAthletes.findIndex(rel => rel.arenaId === arenaId && rel.athleteId === athleteId);
    if (relIndex === -1) {
      return { success: false, error: 'Relacionamento entre atleta e arena não encontrado.', code: 404 };
    }

    const newStatus = active ? 'ATIVO' : 'BLOQUEADO';
    db.arenaAthletes[relIndex].status = newStatus;
    db.arenaAthletes[relIndex].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: db.arenaAthletes[relIndex] };
  },

  removeAssociation(arenaId: string, athleteId: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const relIndex = db.arenaAthletes.findIndex(rel => rel.arenaId === arenaId && rel.athleteId === athleteId);
    if (relIndex === -1) {
      return { success: false, error: 'Relacionamento entre atleta e arena não encontrado.', code: 404 };
    }

    db.arenaAthletes.splice(relIndex, 1);
    writeDB(db);
    return { success: true };
  }
};


