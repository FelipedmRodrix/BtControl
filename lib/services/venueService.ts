import { readDB, writeDB, ArenaVenue } from '../db/store';

export const venueService = {
  getAll(): ArenaVenue[] {
    const db = readDB();
    return db.venues || [];
  },

  getById(id: string): ArenaVenue | null {
    const db = readDB();
    return (db.venues || []).find(v => v.id === id) || null;
  },

  create(data: Omit<ArenaVenue, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; data?: ArenaVenue; error?: string; code?: number } {
    const db = readDB();
    if (!db.venues) db.venues = [];

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'O nome da arena deve conter no mínimo 3 caracteres.', code: 400 };
    }

    const courts = Number(data.courtsCount);
    if (isNaN(courts) || courts < 1) {
      return { success: false, error: 'A arena deve possuir pelo menos 1 quadra.', code: 400 };
    }

    const newVenue: ArenaVenue = {
      id: 'ven-' + Math.random().toString(36).substring(2, 11),
      name: data.name.trim(),
      city: data.city?.trim() || '',
      state: data.state?.trim() || '',
      address: data.address?.trim() || '',
      courtsCount: Math.floor(courts),
      contactPhone: data.contactPhone?.trim() || '',
      status: data.status || 'ATIVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.venues.push(newVenue);
    writeDB(db);

    return { success: true, data: newVenue };
  },

  update(id: string, data: Partial<Omit<ArenaVenue, 'id' | 'createdAt' | 'updatedAt'>>): { success: boolean; data?: ArenaVenue; error?: string; code?: number } {
    const db = readDB();
    if (!db.venues) db.venues = [];

    const index = db.venues.findIndex(v => v.id === id);
    if (index === -1) {
      return { success: false, error: 'Arena (local) não encontrada.', code: 404 };
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length < 3) {
        return { success: false, error: 'O nome da arena deve conter no mínimo 3 caracteres.', code: 400 };
      }
      db.venues[index].name = data.name.trim();
    }

    if (data.courtsCount !== undefined) {
      const courts = Number(data.courtsCount);
      if (isNaN(courts) || courts < 1) {
        return { success: false, error: 'A quantidade de quadras deve ser no mínimo 1.', code: 400 };
      }
      db.venues[index].courtsCount = Math.floor(courts);
    }

    if (data.city !== undefined) db.venues[index].city = data.city.trim();
    if (data.state !== undefined) db.venues[index].state = data.state.trim();
    if (data.address !== undefined) db.venues[index].address = data.address.trim();
    if (data.contactPhone !== undefined) db.venues[index].contactPhone = data.contactPhone.trim();
    if (data.status !== undefined) db.venues[index].status = data.status;

    db.venues[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: db.venues[index] };
  },

  delete(id: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    if (!db.venues) db.venues = [];

    const index = db.venues.findIndex(v => v.id === id);
    if (index === -1) {
      return { success: false, error: 'Arena não encontrada.', code: 404 };
    }

    // Check if tournaments are linked to this venue
    const linkedTournaments = db.tournaments.filter(t => t.venueId === id);
    if (linkedTournaments.length > 0) {
      return {
        success: false,
        error: `Não é possível excluir esta arena pois ela está selecionada como local de ${linkedTournaments.length} torneio(s). Altere o local dos torneios antes de excluir.`,
        code: 400
      };
    }

    db.venues.splice(index, 1);
    writeDB(db);

    return { success: true };
  }
};
