import { readDB, writeDB, Match, Duo } from '../db/store';
import { SUPER_8_ROUNDS_TEMPLATE, validateSuper8Schedule, validateSuper8Score, calculateSuper8Standings } from './super8Service';

export const matchService = {
  getAll(arenaId?: string, tournamentId?: string) {
    const db = readDB();

    let enriched = db.matches.map(m => {
      const category = db.categories.find(c => c.id === m.categoryId);
      const tournament = db.tournaments.find(t => t.id === m.tournamentId);

      // Super 8 resolution
      if (m.format === 'SUPER_8' || m.teamA || m.teamB) {
        const teamA = m.teamA;
        const teamB = m.teamB;
        const a1 = teamA ? db.athletes.find(a => a.id === teamA.player1Id) : null;
        const a2 = teamA ? db.athletes.find(a => a.id === teamA.player2Id) : null;
        const b1 = teamB ? db.athletes.find(a => a.id === teamB.player1Id) : null;
        const b2 = teamB ? db.athletes.find(a => a.id === teamB.player2Id) : null;

        const teamAName = `${a1?.name || 'Atleta 1'} + ${a2?.name || 'Atleta 2'}`;
        const teamBName = `${b1?.name || 'Atleta 3'} + ${b2?.name || 'Atleta 4'}`;

        return {
          ...m,
          duo1Name: teamAName,
          duo2Name: teamBName,
          teamA: teamA ? {
            ...teamA,
            player1Name: a1?.name || 'Atleta 1',
            player2Name: a2?.name || 'Atleta 2'
          } : undefined,
          teamB: teamB ? {
            ...teamB,
            player1Name: b1?.name || 'Atleta 3',
            player2Name: b2?.name || 'Atleta 4'
          } : undefined,
          categoryName: category ? (category.name || `${category.type} - ${category.level}`) : 'Super 8',
          tournamentName: tournament?.name || 'Torneio Desconhecido',
          arenaId: tournament?.arenaId || '',
          isSuper8: true
        };
      }

      // Traditional duo match
      const d1 = db.duos.find(d => d.id === m.duo1Id);
      const d2 = db.duos.find(d => d.id === m.duo2Id);
      
      const p1_a = d1 ? db.athletes.find(a => a.id === d1.player1Id) : null;
      const p1_b = d1 ? db.athletes.find(a => a.id === d1.player2Id) : null;
      
      const p2_a = d2 ? db.athletes.find(a => a.id === d2.player1Id) : null;
      const p2_b = d2 ? db.athletes.find(a => a.id === d2.player2Id) : null;

      return {
        ...m,
        duo1Name: d1 ? `${p1_a?.name || 'Atleta A'} / ${p1_b?.name || 'Atleta B'}` : 'Dupla A',
        duo2Name: d2 ? `${p2_a?.name || 'Atleta A'} / ${p2_b?.name || 'Atleta B'}` : 'Dupla B',
        categoryName: category ? (category.name || `${category.type} - ${category.level}`) : 'Categoria Desconhecida',
        tournamentName: tournament?.name || 'Torneio Desconhecido',
        arenaId: tournament?.arenaId || '',
        isSuper8: false
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

    if (data.format === 'SUPER_8' || data.teamA) {
      if (!data.teamA || !data.teamB) {
        return { success: false, error: 'Ambos os times devem ser informados no Super 8.' };
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
    }

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
    winnerTeam?: 'TEAM_A' | 'TEAM_B'
  ): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    const m = db.matches[index];

    // Se a partida for do formato Super 8
    if (m.format === 'SUPER_8' || m.teamA) {
      // Se scoreA e scoreB foram enviados
      let sA = scoreA;
      let sB = scoreB;

      if ((sA === undefined || sB === undefined) && score) {
        const parts = score.match(/(\d+)\s*[xX/-]\s*(\d+)/);
        if (parts) {
          sA = parseInt(parts[1], 10);
          sB = parseInt(parts[2], 10);
        }
      }

      if (sA !== undefined && sB !== undefined) {
        const validation = validateSuper8Score(sA, sB);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        db.matches[index].scoreA = sA;
        db.matches[index].scoreB = sB;
        db.matches[index].score = `${sA} x ${sB}`;
        db.matches[index].winnerTeam = sA > sB ? 'TEAM_A' : 'TEAM_B';
      } else {
        db.matches[index].score = score;
        if (winnerTeam) {
          db.matches[index].winnerTeam = winnerTeam;
        }
      }

      db.matches[index].status = 'FINALIZADA';
      db.matches[index].updatedAt = new Date().toISOString();
      writeDB(db);
      return { success: true };
    }

    // Partida tradicional de duplas
    if (winnerDuoId && winnerDuoId !== m.duo1Id && winnerDuoId !== m.duo2Id) {
      return { success: false, error: 'A dupla vencedora deve fazer parte do jogo.' };
    }

    db.matches[index].score = score;
    if (winnerDuoId) {
      db.matches[index].winnerDuoId = winnerDuoId;
    }
    db.matches[index].status = 'FINALIZADA';
    db.matches[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true };
  },

  toggleWO(id: string, winnerDuoId?: string, winnerTeam?: 'TEAM_A' | 'TEAM_B'): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.matches.findIndex(m => m.id === id);

    if (index === -1) {
      return { success: false, error: 'Partida não encontrada.' };
    }

    const m = db.matches[index];

    // Se Super 8
    if (m.format === 'SUPER_8' || m.teamA) {
      const selectedWinner = winnerTeam || (winnerDuoId === 'TEAM_A' || winnerDuoId === 'teamA' ? 'TEAM_A' : 'TEAM_B');
      db.matches[index].score = selectedWinner === 'TEAM_A' ? 'W.O. (4x0)' : 'W.O. (0x4)';
      db.matches[index].scoreA = selectedWinner === 'TEAM_A' ? 4 : 0;
      db.matches[index].scoreB = selectedWinner === 'TEAM_A' ? 0 : 4;
      db.matches[index].winnerTeam = selectedWinner;
      db.matches[index].status = 'WO';
      db.matches[index].updatedAt = new Date().toISOString();
      writeDB(db);
      return { success: true };
    }

    // Tradicional
    if (winnerDuoId && winnerDuoId !== m.duo1Id && winnerDuoId !== m.duo2Id) {
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

    const availableCourts = tournament.courtsUsed && tournament.courtsUsed >= 1 ? tournament.courtsUsed : 4;
    const courtPrefix = court && !court.includes('Quadra') ? court : 'Quadra';
    const matchDate = date || new Date().toISOString().split('T')[0];

    // Verificar se o formato é SUPER 8 (torneio individual isDuo === false OU categoria type === 'SUPER 8')
    const isSuper8 = tournament.isDuo === false || category.type === 'SUPER 8';

    if (isSuper8) {
      // 1. Obter atletas inscritos na categoria
      const registrations = db.registrations.filter(r => r.categoryId === categoryId && r.tournamentId === tournamentId);
      
      // Validação obrigatória da regra Super 8: exatamente 8 atletas
      if (registrations.length !== 8) {
        return {
          success: false,
          error: `O formato Super 8 exige exatamente 8 atletas inscritos na categoria. Atualmente existem ${registrations.length} inscritos confirmados.`
        };
      }

      const athleteIds = registrations.map(r => r.athleteId);
      const athleteMap = new Map(db.athletes.map(a => [a.id, a]));

      // 2. Gerar as 14 partidas distribuídas nas 7 rodadas conforme gabarito oficial Super 8
      const generatedMatches: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      SUPER_8_ROUNDS_TEMPLATE.forEach(tpl => {
        const p1Id = athleteIds[tpl.teamA[0] - 1];
        const p2Id = athleteIds[tpl.teamA[1] - 1];
        const p3Id = athleteIds[tpl.teamB[0] - 1];
        const p4Id = athleteIds[tpl.teamB[1] - 1];

        // Determinar quadra e horário
        // Cada rodada tem 2 jogos. Se tiver 2 ou mais quadras, jogam simultaneamente.
        const matchInRound = (tpl.matchNumber % 2 === 1) ? 1 : 2;
        const courtNumber = ((matchInRound - 1) % availableCourts) + 1;
        const courtName = `${courtPrefix} ${courtNumber}`;

        // Intervalo de 40 min por rodada a partir das 14:00
        const startHour = 14;
        const totalMinutes = (tpl.round - 1) * 40;
        const hour = startHour + Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const matchTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        generatedMatches.push({
          tournamentId,
          categoryId,
          stage: `Rodada ${tpl.round}`,
          groupName: 'Super 8',
          round: tpl.round,
          matchNumber: tpl.matchNumber,
          format: 'SUPER_8',
          teamA: {
            player1Id: p1Id,
            player2Id: p2Id,
            player1Name: athleteMap.get(p1Id)?.name || `Atleta ${tpl.teamA[0]}`,
            player2Name: athleteMap.get(p2Id)?.name || `Atleta ${tpl.teamA[1]}`
          },
          teamB: {
            player1Id: p3Id,
            player2Id: p4Id,
            player1Name: athleteMap.get(p3Id)?.name || `Atleta ${tpl.teamB[0]}`,
            player2Name: athleteMap.get(p4Id)?.name || `Atleta ${tpl.teamB[1]}`
          },
          date: matchDate,
          time: matchTime,
          court: courtName,
          status: 'PENDENTE'
        });
      });

      // 3. Validação rigorosa antes de salvar no banco
      const valResult = validateSuper8Schedule(generatedMatches, athleteIds);
      if (!valResult.valid) {
        return {
          success: false,
          error: `Falha na validação das regras do Super 8: ${valResult.error}`
        };
      }

      // 4. Remover partidas pendentes anteriores desta categoria neste torneio
      db.matches = db.matches.filter(m => !(m.categoryId === categoryId && m.tournamentId === tournamentId && m.status === 'PENDENTE'));

      // 5. Salvar as novas partidas
      const now = new Date().toISOString();
      generatedMatches.forEach(m => {
        const newMatch: Match = {
          ...m,
          id: 'mat-s8-' + Math.random().toString(36).substring(2, 11),
          createdAt: now,
          updatedAt: now
        };
        db.matches.push(newMatch);
      });

      writeDB(db);
      return { success: true, count: 14, format: 'SUPER_8' };
    }

    // Formato tradicional de duplas
    const duos = db.duos.filter(d => d.categoryId === categoryId && d.tournamentId === tournamentId);
    if (duos.length < 2) {
      return { success: false, error: 'É necessário pelo menos 2 duplas cadastradas na categoria para gerar jogos.' };
    }

    // Remover pendentes anteriores
    db.matches = db.matches.filter(m => !(m.categoryId === categoryId && m.tournamentId === tournamentId && m.status === 'PENDENTE'));

    let count = 0;
    const now = new Date().toISOString();
    for (let i = 0; i < duos.length; i++) {
      for (let j = i + 1; j < duos.length; j++) {
        const d1 = duos[i];
        const d2 = duos[j];

        const courtNumber = (count % availableCourts) + 1;
        const courtName = `${courtPrefix} ${courtNumber}`;
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
          date: matchDate,
          time: matchTime,
          court: courtName,
          status: 'PENDENTE',
          format: 'STANDARD',
          createdAt: now,
          updatedAt: now
        };

        db.matches.push(newMatch);
        count++;
      }
    }

    writeDB(db);
    return { success: true, count, format: 'STANDARD' };
  },

  getSuper8Standings(tournamentId: string, categoryId: string) {
    const db = readDB();
    const tournamentMatches = db.matches.filter(m => m.tournamentId === tournamentId && m.categoryId === categoryId);
    const registrations = db.registrations.filter(r => r.tournamentId === tournamentId && r.categoryId === categoryId);
    const registeredAthleteIds = new Set(registrations.map(r => r.athleteId));
    const athletes = db.athletes.filter(a => registeredAthleteIds.has(a.id));

    return calculateSuper8Standings(tournamentMatches, athletes);
  }
};
