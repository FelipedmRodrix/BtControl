import { readDB, writeDB, Registration } from '../db/store';

export const registrationService = {
  getAll(arenaId?: string) {
    const db = readDB();
    
    const enriched = db.registrations.map(r => {
      const athlete = db.athletes.find(a => a.id === r.athleteId);
      const category = db.categories.find(c => c.id === r.categoryId);
      const tournament = db.tournaments.find(t => t.id === r.tournamentId);
      
      return {
        ...r,
        athleteName: athlete?.name || 'Atleta Desconhecido',
        categoryName: category ? `${category.type} - ${category.level}` : 'Categoria Desconhecida',
        tournamentName: tournament?.name || 'Torneio Desconhecido',
        arenaId: tournament?.arenaId || ''
      };
    });

    if (arenaId) {
      return enriched.filter(r => r.arenaId === arenaId);
    }

    return enriched;
  },

  create(data: { tournamentId: string; categoryId: string; athleteId: string; status?: 'PENDENTE_PAGAMENTO' | 'CONFIRMADA' }): { success: boolean; data?: Registration; error?: string } {
    const db = readDB();

    // 1. Verify if tournament exists
    const tour = db.tournaments.find(t => t.id === data.tournamentId);
    if (!tour) {
      return { success: false, error: 'O torneio especificado não existe.' };
    }

    // 2. Verify category
    const cat = db.categories.find(c => c.id === data.categoryId && c.tournamentId === data.tournamentId);
    if (!cat) {
      return { success: false, error: 'A categoria especificada não pertence a este torneio.' };
    }

    // 3. Verify athlete is active globally
    const athlete = db.athletes.find(a => a.id === data.athleteId);
    if (!athlete || athlete.status !== 'ATIVO') {
      return { success: false, error: 'O atleta não está cadastrado ou está inativo no sistema.' };
    }

    // 4. Verify athlete has active association to tournament's arena
    const assoc = db.arenaAthletes.find(aa => aa.arenaId === tour.arenaId && aa.athleteId === data.athleteId);
    if (!assoc || assoc.status !== 'ATIVO') {
      return { success: false, error: 'O atleta precisa estar ATIVO na arena deste torneio para ser inscrito.' };
    }

    // 5. Check limit of participants
    const activeRegsCount = db.registrations.filter(
      r => r.categoryId === data.categoryId && r.status !== 'CANCELADA'
    ).length;
    
    const limit = tour.isDuo 
      ? (cat.maxParticipants ? cat.maxParticipants * 2 : 32)
      : (cat.maxParticipants ? cat.maxParticipants : 16);

    if (activeRegsCount >= limit) {
      return { 
        success: false, 
        error: tour.isDuo 
          ? `O limite máximo de duplas (${cat.maxParticipants || 16} duplas) para esta categoria já foi atingido.` 
          : `O limite máximo de atletas (${cat.maxParticipants || 16} atletas) para esta categoria já foi atingido.` 
      };
    }

    // 6. Check if already registered
    const duplicate = db.registrations.find(
      r => r.tournamentId === data.tournamentId && r.categoryId === data.categoryId && r.athleteId === data.athleteId && r.status !== 'CANCELADA'
    );
    if (duplicate) {
      return { success: false, error: 'Este atleta já está inscrito nesta categoria para este torneio.' };
    }

    const newReg: Registration = {
      id: 'reg-' + Math.random().toString(36).substring(2, 11),
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      athleteId: data.athleteId,
      status: data.status || 'PENDENTE_PAGAMENTO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.registrations.push(newReg);
    writeDB(db);

    return { success: true, data: newReg };
  },

  cancel(id: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.registrations.findIndex(r => r.id === id);

    if (index === -1) {
      return { success: false, error: 'Inscrição não encontrada.' };
    }

    db.registrations[index].status = 'CANCELADA';
    db.registrations[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true };
  },

  updateStatus(id: string, status: 'PENDENTE_PAGAMENTO' | 'CONFIRMADA' | 'CANCELADA'): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.registrations.findIndex(r => r.id === id);

    if (index === -1) {
      return { success: false, error: 'Inscrição não encontrada.' };
    }

    db.registrations[index].status = status;
    db.registrations[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true };
  }
};
