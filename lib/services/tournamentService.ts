import { readDB, writeDB, Tournament, Category } from '../db/store';

export interface CategoryInput {
  type: 'SUPER 8' | 'MISTA' | 'MASCULINO' | 'FEMININO';
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  maxParticipants?: number;
  enabled: boolean;
}

export const tournamentService = {
  getAll(arenaId?: string): Tournament[] {
    const db = readDB();
    if (arenaId) {
      return db.tournaments.filter(t => t.arenaId === arenaId);
    }
    return db.tournaments;
  },

  getById(id: string): Tournament | null {
    const db = readDB();
    return db.tournaments.find(t => t.id === id) || null;
  },

  create(data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'> & { enabledCategories?: CategoryInput[] }): { success: boolean; data?: Tournament; error?: string; code?: number } {
    const db = readDB();

    // 1. Validations
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'O nome da edição do torneio deve conter pelo menos 3 caracteres.', code: 400 };
    }
    if (!data.seriesName || data.seriesName.trim().length < 3) {
      return { success: false, error: 'O nome da série deve conter pelo menos 3 caracteres.', code: 400 };
    }
    if (!data.arenaId) {
      return { success: false, error: 'A arena do torneio é obrigatória.', code: 400 };
    }

    // Verify arena exists
    const arenaExists = db.arenas.some(a => a.id === data.arenaId);
    if (!arenaExists) {
      return { success: false, error: 'Arena especificada não encontrada.', code: 404 };
    }

    // Date validations
    if (!data.startDate || !data.endDate) {
      return { success: false, error: 'As datas de início e término são obrigatórias.', code: 400 };
    }
    if (new Date(data.endDate) < new Date(data.startDate)) {
      return { success: false, error: 'A data de término não pode ser anterior à data de início.', code: 400 };
    }

    const newTournamentId = 't-' + Math.random().toString(36).substring(2, 11);

    // Resolve Physical Arena (Venue) and courtsUsed
    let venueId = data.venueId;
    let venueName = data.venueName;
    let courtsUsed = data.courtsUsed;

    if (venueId && db.venues) {
      const v = db.venues.find(venue => venue.id === venueId);
      if (v) {
        venueName = v.name;
        if (!courtsUsed || courtsUsed < 1) {
          courtsUsed = Math.min(4, v.courtsCount);
        } else if (courtsUsed > v.courtsCount) {
          courtsUsed = v.courtsCount;
        }
      }
    } else if (db.venues && db.venues.length > 0) {
      const defaultV = db.venues[0];
      venueId = defaultV.id;
      venueName = defaultV.name;
      courtsUsed = courtsUsed ? Math.min(courtsUsed, defaultV.courtsCount) : Math.min(4, defaultV.courtsCount);
    }

    const newTournament: Tournament = {
      id: newTournamentId,
      name: data.name.trim(),
      arenaId: data.arenaId,
      organizerId: data.arenaId,
      venueId,
      venueName,
      courtsUsed: courtsUsed || 4,
      seriesName: data.seriesName.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || 'INSCRICOES_ABERTAS',
      isDuo: data.isDuo !== undefined ? data.isDuo : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.tournaments.push(newTournament);

    // Synchronize enabled categories (Requested Feature!)
    if (data.enabledCategories && Array.isArray(data.enabledCategories)) {
      const activeCategories = data.enabledCategories.filter(c => c.enabled);
      
      activeCategories.forEach(c => {
        const newCat: Category = {
          id: 'c-' + Math.random().toString(36).substring(2, 11),
          tournamentId: newTournamentId,
          masterCategoryId: (c as any).masterCategoryId || (c as any).id,
          name: (c as any).name || `${c.type} ${c.level}`,
          type: c.type,
          level: c.level,
          price: c.price || 0,
          maxParticipants: c.maxParticipants !== undefined ? c.maxParticipants : 16,
          status: 'ATIVA',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.categories.push(newCat);
      });
    }

    writeDB(db);

    return { success: true, data: newTournament };
  },

  update(id: string, data: Partial<Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>> & { enabledCategories?: CategoryInput[] }): { success: boolean; data?: Tournament; error?: string; code?: number } {
    const db = readDB();
    const index = db.tournaments.findIndex(t => t.id === id);

    if (index === -1) {
      return { success: false, error: 'Torneio não encontrado.', code: 404 };
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length < 3) {
        return { success: false, error: 'O nome do torneio deve conter pelo menos 3 caracteres.', code: 400 };
      }
      db.tournaments[index].name = data.name.trim();
    }

    if (data.seriesName !== undefined) {
      if (!data.seriesName || data.seriesName.trim().length < 3) {
        return { success: false, error: 'O nome da série deve conter pelo menos 3 caracteres.', code: 400 };
      }
      db.tournaments[index].seriesName = data.seriesName.trim();
    }

    if (data.arenaId !== undefined) {
      const arenaExists = db.arenas.some(a => a.id === data.arenaId);
      if (!arenaExists) {
        return { success: false, error: 'Organizador especificado não encontrado.', code: 404 };
      }
      db.tournaments[index].arenaId = data.arenaId;
      db.tournaments[index].organizerId = data.arenaId;
    }

    if (data.venueId !== undefined) {
      db.tournaments[index].venueId = data.venueId;
      const v = db.venues?.find(venue => venue.id === data.venueId);
      if (v) {
        db.tournaments[index].venueName = v.name;
        if (db.tournaments[index].courtsUsed && db.tournaments[index].courtsUsed! > v.courtsCount) {
          db.tournaments[index].courtsUsed = v.courtsCount;
        }
      }
    }

    if (data.courtsUsed !== undefined) {
      const courts = Number(data.courtsUsed);
      if (!isNaN(courts) && courts >= 1) {
        db.tournaments[index].courtsUsed = Math.floor(courts);
      }
    }

    // Date changes validations
    const start = data.startDate !== undefined ? data.startDate : db.tournaments[index].startDate;
    const end = data.endDate !== undefined ? data.endDate : db.tournaments[index].endDate;

    if (new Date(end) < new Date(start)) {
      return { success: false, error: 'A data de término não pode ser anterior à data de início.', code: 400 };
    }

    if (data.startDate !== undefined) db.tournaments[index].startDate = data.startDate;
    if (data.endDate !== undefined) db.tournaments[index].endDate = data.endDate;
    if (data.status !== undefined) db.tournaments[index].status = data.status;
    if (data.isDuo !== undefined) db.tournaments[index].isDuo = data.isDuo;

    // Synchronize enabled categories (Requested Feature!)
    if (data.enabledCategories && Array.isArray(data.enabledCategories)) {
      // 1. Remove existing categories for this tournament first
      db.categories = db.categories.filter(c => c.tournamentId !== id);

      // 2. Add currently checked ones
      const activeCategories = data.enabledCategories.filter(c => c.enabled);
      activeCategories.forEach(c => {
        const newCat: Category = {
          id: 'c-' + Math.random().toString(36).substring(2, 11),
          tournamentId: id,
          masterCategoryId: (c as any).masterCategoryId || (c as any).id,
          name: (c as any).name || `${c.type} ${c.level}`,
          type: c.type,
          level: c.level,
          price: c.price || 0,
          maxParticipants: c.maxParticipants !== undefined ? c.maxParticipants : 16,
          status: 'ATIVA',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.categories.push(newCat);
      });
    }

    db.tournaments[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: db.tournaments[index] };
  },

  delete(id: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const index = db.tournaments.findIndex(t => t.id === id);

    if (index === -1) {
      return { success: false, error: 'Torneio não encontrado.', code: 404 };
    }

    // Delete associated categories too
    db.categories = db.categories.filter(c => c.tournamentId !== id);

    db.tournaments.splice(index, 1);
    writeDB(db);

    return { success: true };
  }
};
