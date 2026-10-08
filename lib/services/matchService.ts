import { readDB, writeDB, Match, Duo } from '../db/store';

export const matchService = {
  getAll(arenaId?: string) {
    const db = readDB();

    const enriched = db.matches.map(m => {
      const d1 = db.duos.find(d => d.id === m.duo1Id);
      const d2 = db.duos.find(d => d.id === m.duo2Id);
      
      const p1_a = d1 ? db.athletes.find(a => a.id === d1.player1Id) : null;
      const p1_b = d1 ? db.athletes.find(a => a.id === d1.player2Id) : null;
      
      const p2_a = d2 ? db.athletes.find(a => a.id === d2.player1Id) : null;
      const p2_b = d2 ? db.athletes.find(a => a.id === d2.player2Id) : null;

      const category = db.categories.find(c => c.id === m.categoryId);
      const tournament = db.tournaments.find(t => t.id === m.tournamentId);

      return {
        ...m,
        duo1Name: d1 ? `${p1_a?.name || 'Atleta A'} / ${p1_b?.name || 'Atleta B'}` : 'Dupla A',
        duo2Name: d2 ? `${p2_a?.name || 'Atleta A'} / ${p2_b?.name || 'Atleta B'}` : 'Dupla B',
        categoryName: category ? `${category.type} - ${category.level}` : 'Categoria Desconhecida',
        tournamentName: tournament?.name || 'Torneio Desconhecido',
        arenaId: tournament?.arenaId || ''
      };
    });

    if (arenaId) {
      return enriched.filter(m => m.arenaId === arenaId);
    }

    return enriched;
  },

  create(data: Omit<Match, 'id' | 'status' | 'createdAt' | 'updatedAt'>): { success: boolean; data?: Match; error?: string } {
    const db = readDB();

    if (data.duo1Id === data.duo2Id) {
      return { success: false, error: 'As duas duplas de um jogo devem ser diferentes.' };
    }

    // Verify duos belong to category
    const d1 = db.duos.find(d => d.id === data.duo1Id && d.categoryId === data.categoryId);
    const d2 = db.duos.find(d => d.id === data.duo2Id && d.categoryId === data.categoryId);

    if (!d1 || !d2) {
      return { success: false, error: 'Ambas as duplas devem estar cadastradas na categoria deste jogo.' };
    }

    const newMatch: Match = {
      ...data,
      id: 'mat-' + Math.random().toString(36).substring(2, 11),
      status: 'PENDENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.matches.push(newMatch);
    writeDB(db);

    return { success: true, data: newMatch };
  },

  updateResult(id: string, score: string, winnerDuoId: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    const m = db.matches[index];
    if (winnerDuoId !== m.duo1Id && winnerDuoId !== m.duo2Id) {
      return { success: false, error: 'A dupla vencedora deve fazer parte do jogo.' };
    }

    db.matches[index].score = score;
    db.matches[index].winnerDuoId = winnerDuoId;
    db.matches[index].status = 'FINALIZADA';
    db.matches[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true };
  },

  toggleWO(id: string, winnerDuoId: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    const m = db.matches[index];
    if (winnerDuoId !== m.duo1Id && winnerDuoId !== m.duo2Id) {
      return { success: false, error: 'A dupla vencedora do WO deve fazer parte do jogo.' };
    }

    db.matches[index].score = 'W.O. (6/0 6/0)';
    db.matches[index].winnerDuoId = winnerDuoId;
    db.matches[index].status = 'WO';
    db.matches[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true };
  },

  updateCourt(id: string, court: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    db.matches[index].court = court.trim();
    db.matches[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true };
  },

  delete(id: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    db.matches.splice(index, 1);
    writeDB(db);

    return { success: true };
  },

  generateMatchesForCategory(tournamentId: string, categoryId: string, date: string, court?: string): { success: boolean; error?: string; count?: number } {
    const db = readDB();

    // 1. Find tournament to retrieve courts selected for the event
    const tournament = db.tournaments.find(t => t.id === tournamentId);
    const availableCourts = tournament?.courtsUsed && tournament.courtsUsed >= 1 ? tournament.courtsUsed : 4;

    // 2. Find all duos in category
    const duos = db.duos.filter(d => d.categoryId === categoryId && d.tournamentId === tournamentId);
    if (duos.length < 2) {
      return { success: false, error: 'É necessário pelo menos 2 duplas cadastradas na categoria para gerar jogos.' };
    }

    // 3. Remove any pending matches in this category first to avoid duplication
    db.matches = db.matches.filter(m => !(m.categoryId === categoryId && m.tournamentId === tournamentId && m.status === 'PENDENTE'));

    // 4. Generate matches: everyone plays everyone once (Round Robin)
    let count = 0;
    for (let i = 0; i < duos.length; i++) {
      for (let j = i + 1; j < duos.length; j++) {
        const d1 = duos[i];
        const d2 = duos[j];

        const courtNumber = (count % availableCourts) + 1;
        const courtName = court && !court.includes('Quadra') ? `${court} ${courtNumber}` : `Quadra ${courtNumber}`;
        const hour = 14 + Math.floor(count / availableCourts);
        const minutes = (Math.floor(count / availableCourts) * 35) % 60;
        const matchTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const newMatch: Match = {
          id: 'mat-' + Math.random().toString(36).substring(2, 11),
          tournamentId,
          categoryId,
          stage: 'Fase de Grupos',
          groupName: 'Grupo Único',
          duo1Id: d1.id,
          duo2Id: d2.id,
          date: date || new Date().toISOString().split('T')[0],
          time: matchTime,
          court: courtName,
          status: 'PENDENTE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.matches.push(newMatch);
        count++;
      }
    }

    writeDB(db);
    return { success: true, count };
  }
};
