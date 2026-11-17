import { readDB, writeDB, Match } from '../db/store';
import { conventionalTournamentService } from './conventionalTournamentService';

export const matchService = {
  getAll(arenaId?: string, tournamentId?: string) {
    const db = readDB();

    let enriched = db.matches.map(m => {
      const category = db.categories.find(c => c.id === m.categoryId);
      const tournament = db.tournaments.find(t => t.id === m.tournamentId);

      // Traditional duo match
      const d1 = db.duos.find(d => d.id === m.duo1Id);
      const d2 = db.duos.find(d => d.id === m.duo2Id);
      
      const p1_a = d1 ? db.athletes.find(a => a.id === d1.player1Id) : null;
      const p1_b = d1 ? db.athletes.find(a => a.id === d1.player2Id) : null;
      
      const p2_a = d2 ? db.athletes.find(a => a.id === d2.player1Id) : null;
      const p2_b = d2 ? db.athletes.find(a => a.id === d2.player2Id) : null;

      return {
        ...m,
        games: m.games !== undefined ? m.games : (category?.games || 4),
        thaiBreak: m.thaiBreak !== undefined ? m.thaiBreak : (category?.thaiBreak || false),
        duo1Name: d1 ? `${p1_a?.name || 'Atleta A'} / ${p1_b?.name || 'Atleta B'}` : 'Dupla A',
        duo2Name: d2 ? `${p2_a?.name || 'Atleta A'} / ${p2_b?.name || 'Atleta B'}` : 'Dupla B',
        categoryName: category ? (category.name || `${category.type} - ${category.level}`) : 'Categoria Desconhecida',
        tournamentName: tournament?.name || 'Torneio Desconhecido',
         arenaId: tournament?.arenaId || '',
        isSuper8: false,
        isDraw: m.isDraw || false,
        tieBreaker: m.tieBreaker
       };
    });

    if (arenaId) {
      enriched = enriched.filter(m => m.arenaId === arenaId);
    }
    if (tournamentId) {
      enriched = enriched.filter(m => m.tournamentId === tournamentId);
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

  updateResult(
    id: string,
    score: string,
    winnerDuoId?: string,
    scoreA?: number,
    scoreB?: number,
    winnerTeam?: 'TEAM_A' | 'TEAM_B',
    isDraw?: boolean,
    tieBreaker?: string
  ): { success: boolean; error?: string; tieBreaker?: string; freedCourt?: string; nextMatchSuggestion?: any } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    const m = db.matches[index];

    // Partida tradicional de duplas
    if (winnerDuoId && winnerDuoId !== m.duo1Id && winnerDuoId !== m.duo2Id) {
      return { success: false, error: 'A dupla vencedora deve fazer parte do jogo.' };
    }

    // Try parsing numeric scores if score is provided (e.g. "6 x 4" or "7 x 6 (TB)")
    let sA = scoreA;
    let sB = scoreB;
    if ((sA === undefined || sB === undefined) && score) {
      const parts = score.match(/(\d+)\s*[xX/-]\s*(\d+)/);
      if (parts) {
        sA = parseInt(parts[1], 10);
        sB = parseInt(parts[2], 10);
      }
    }

    db.matches[index].score = score;
    if (sA !== undefined) db.matches[index].scoreA = sA;
    if (sB !== undefined) db.matches[index].scoreB = sB;

    if (isDraw) {
      db.matches[index].isDraw = true;
      db.matches[index].winnerDuoId = undefined;
      db.matches[index].status = 'FINALIZADA';
      db.matches[index].updatedAt = new Date().toISOString();
      const freedCourt = db.matches[index].court;
      writeDB(db);

      const nextPendingMatch = db.matches.find(nextM => 
        nextM.id !== id && 
        nextM.tournamentId === m.tournamentId && 
        nextM.status === 'PENDENTE'
      );

      return { 
        success: true,
        freedCourt,
        nextMatchSuggestion: nextPendingMatch ? {
          id: nextPendingMatch.id,
          stage: nextPendingMatch.stage,
          court: freedCourt
        } : null
      };
    }

    db.matches[index].isDraw = false;
    if (winnerDuoId) {
      db.matches[index].winnerDuoId = winnerDuoId;
    } else if (sA !== undefined && sB !== undefined && sA !== sB) {
      db.matches[index].winnerDuoId = sA > sB ? m.duo1Id : m.duo2Id;
    }

    db.matches[index].status = 'FINALIZADA';
    db.matches[index].updatedAt = new Date().toISOString();
    const freedCourt = db.matches[index].court;
    writeDB(db);

    // If it's an elimination match, automatically advance the winner into the next bracket node!
    const effectiveWinner = db.matches[index].winnerDuoId;
    if (effectiveWinner && m.stage !== 'Fase de Grupos') {
      conventionalTournamentService.advanceWinnerInBracket(id, effectiveWinner);
    }

    // Sugerir próximo jogo a entrar na quadra liberada
    const nextPendingMatch = db.matches.find(nextM => 
      nextM.id !== id && 
      nextM.tournamentId === m.tournamentId && 
      nextM.status === 'PENDENTE'
    );

    let nextMatchDetails = null;
    if (nextPendingMatch) {
      const d1 = db.duos.find(d => d.id === nextPendingMatch.duo1Id);
      const d2 = db.duos.find(d => d.id === nextPendingMatch.duo2Id);
      const p1a = d1 ? db.athletes.find(a => a.id === d1.player1Id) : null;
      const p1b = d1 ? db.athletes.find(a => a.id === d1.player2Id) : null;
      const p2a = d2 ? db.athletes.find(a => a.id === d2.player1Id) : null;
      const p2b = d2 ? db.athletes.find(a => a.id === d2.player2Id) : null;
      const cat = db.categories.find(c => c.id === nextPendingMatch.categoryId);

      nextMatchDetails = {
        id: nextPendingMatch.id,
        stage: nextPendingMatch.stage,
        groupName: nextPendingMatch.groupName,
        categoryName: cat?.name || `${cat?.type} ${cat?.level}`,
        duo1Name: d1 ? `${p1a?.name || 'Atleta A'} / ${p1b?.name || 'Atleta B'}` : 'A definir',
        duo2Name: d2 ? `${p2a?.name || 'Atleta C'} / ${p2b?.name || 'Atleta D'}` : 'A definir',
        court: freedCourt,
        time: nextPendingMatch.time
      };
    }

    return { 
      success: true, 
      freedCourt,
      nextMatchSuggestion: nextMatchDetails 
    };
  },

  toggleWO(id: string, winnerDuoId?: string, winnerTeam?: 'TEAM_A' | 'TEAM_B'): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    const m = db.matches[index];

    // Tradicional
    if (winnerDuoId && winnerDuoId !== m.duo1Id && winnerDuoId !== m.duo2Id) {
      return { success: false, error: 'A dupla vencedora do WO deve fazer parte do jogo.' };
    }

    const woGames = db.matches[index].games !== undefined ? db.matches[index].games : 6;
    db.matches[index].score = `W.O. (${woGames}x0)`;
    db.matches[index].winnerDuoId = winnerDuoId;
    db.matches[index].scoreA = winnerDuoId === m.duo1Id ? woGames : 0;
    db.matches[index].scoreB = winnerDuoId === m.duo2Id ? woGames : 0;
    db.matches[index].status = 'WO';
    db.matches[index].updatedAt = new Date().toISOString();
    writeDB(db);

    if (winnerDuoId && m.stage !== 'Fase de Grupos') {
      conventionalTournamentService.advanceWinnerInBracket(id, winnerDuoId);
    }

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

  generateMatchesForCategory(tournamentId: string, categoryId: string, date: string, court?: string): { success: boolean; error?: string; count?: number; format?: string } {
    const db = readDB();

    const tournament = db.tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return { success: false, error: 'Torneio não encontrado.' };
    }

    const category = db.categories.find(c => c.id === categoryId);
    if (!category) {
      return { success: false, error: 'Categoria não encontrada.' };
    }

    const courtPrefix = court && !court.includes('Quadra') ? court : 'Quadra';
    const matchDate = date || new Date().toISOString().split('T')[0];

    // Formato de Jogos Convencionais (Fase de Grupos balanceada + Eliminatórias)
    return conventionalTournamentService.generateGroupStage(tournamentId, categoryId, matchDate, courtPrefix);
  },

  generateEliminationBracket(tournamentId: string, categoryId: string, date?: string, courtPrefix?: string) {
    return conventionalTournamentService.generateEliminationBracket(
      tournamentId,
      categoryId,
      date || new Date().toISOString().split('T')[0],
      courtPrefix || 'Quadra'
    );
  },

  getConventionalData(tournamentId: string, categoryId: string) {
    return conventionalTournamentService.getTournamentData(tournamentId, categoryId);
  }
};
