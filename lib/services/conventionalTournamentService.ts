import { readDB, writeDB, Match, Duo, Category, Tournament, Athlete } from '../db/store';

export interface GroupStanding {
  duoId: string;
  duoName: string;
  player1Name: string;
  player2Name: string;
  groupName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  gamesFor: number;
  gamesAgainst: number;
  gameDiff: number; // gamesFor - gamesAgainst
  winRate: number; // percentage (0-100)
  headToHeadPoints?: number;
  avgGameDiff?: number; // gameDiff / played (for comparing groups of different sizes)
  avgGamesFor?: number; // gamesFor / played
  points: number; // 3 per win, 1 per draw (or pure wins)
  rank: number;
  qualified: boolean;
  hasBye?: boolean;
}

export interface EliminationMatchNode {
  id: string;
  stage: 'Oitavas de Final' | 'Quartas de Final' | 'Semifinal' | 'Final';
  matchNumber: number;
  bracketSlot: string; // e.g., 'oitavas-1', 'qf-1', 'sf-1', 'final-1'
  nextBracketSlot?: string; // e.g. 'sf-1'
  nextSlotTeam?: 'teamA' | 'teamB';
  duo1Id?: string;
  duo2Id?: string;
  duo1Name: string;
  duo2Name: string;
  player1_A_Name?: string;
  player2_A_Name?: string;
  player1_B_Name?: string;
  player2_B_Name?: string;
  placeholder1: string; // e.g. "1º Grupo A" or "Vencedor Oitavas 1"
  placeholder2: string; // e.g. "2º Grupo B" or "Vencedor Oitavas 2"
  score?: string;
  score1?: number;
  score2?: number;
  winnerDuoId?: string;
  winnerName?: string;
  isBye?: boolean;
  byeAdvancingDuoId?: string;
  status: 'PENDENTE' | 'FINALIZADA' | 'WO' | 'BYE';
  date?: string;
  time?: string;
  court?: string;
}

export interface ConventionalTournamentData {
  format: 'CONVENTIONAL';
  tournamentId: string;
  categoryId: string;
  categoryName: string;
  games: number;
  thaiBreak: boolean;
  totalDuos: number;
  groupCount: number;
  groups: {
    name: string;
    duos: { id: string; name: string }[];
    standings: GroupStanding[];
    matches: Match[];
  }[];
  overallRankings: GroupStanding[];
  byesInfo: {
    totalClassified: number;
    bracketSize: 2 | 4 | 8 | 16;
    byesCount: number;
    byesDuos: { duoId: string; duoName: string; reason: string }[];
  };
  eliminationStages: {
    stageName: 'Oitavas de Final' | 'Quartas de Final' | 'Semifinal' | 'Final';
    stageKey: 'oitavas' | 'quartas' | 'semifinal' | 'final';
    matches: EliminationMatchNode[];
  }[];
  championDuo?: {
    id: string;
    name: string;
    player1Name: string;
    player2Name: string;
  };
}

export const conventionalTournamentService = {
  /**
   * Distributes duos into balanced groups (preferring 3 or 4 duos per group)
   */
  calculateGroupDistribution(totalDuos: number): { groupCount: number; sizes: number[] } {
    if (totalDuos <= 4) {
      return { groupCount: 1, sizes: [totalDuos] };
    }
    if (totalDuos === 5 || totalDuos === 6) {
      return { groupCount: 2, sizes: [Math.ceil(totalDuos / 2), Math.floor(totalDuos / 2)] };
    }
    if (totalDuos === 7 || totalDuos === 8) {
      return { groupCount: 2, sizes: [Math.ceil(totalDuos / 2), Math.floor(totalDuos / 2)] };
    }
    if (totalDuos >= 9 && totalDuos <= 11) {
      // 3 groups of 3-4
      const base = Math.floor(totalDuos / 3);
      const rem = totalDuos % 3;
      const sizes = [base + (rem > 0 ? 1 : 0), base + (rem > 1 ? 1 : 0), base];
      return { groupCount: 3, sizes };
    }
    if (totalDuos >= 12 && totalDuos <= 15) {
      // 4 groups of 3 or 4
      const base = Math.floor(totalDuos / 4);
      const rem = totalDuos % 4;
      const sizes = Array(4).fill(base).map((s, idx) => s + (idx < rem ? 1 : 0));
      return { groupCount: 4, sizes };
    }
    if (totalDuos >= 16 && totalDuos <= 20) {
      // 4 or 5 groups
      const count = totalDuos >= 18 ? 5 : 4;
      const base = Math.floor(totalDuos / count);
      const rem = totalDuos % count;
      const sizes = Array(count).fill(base).map((s, idx) => s + (idx < rem ? 1 : 0));
      return { groupCount: count, sizes };
    }
    // 21 to 24+
    const count = 6;
    const base = Math.floor(totalDuos / count);
    const rem = totalDuos % count;
    const sizes = Array(count).fill(base).map((s, idx) => s + (idx < rem ? 1 : 0));
    return { groupCount: count, sizes };
  },

  /**
   * Generates group matches for all groups in a conventional tournament
   */
  generateGroupStage(
    tournamentId: string,
    categoryId: string,
    date: string,
    courtPrefix: string = 'Quadra'
  ): { success: boolean; error?: string; count?: number } {
    const db = readDB();
    const tournament = db.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return { success: false, error: 'Torneio não encontrado.' };

    const category = db.categories.find(c => c.id === categoryId);
    if (!category) return { success: false, error: 'Categoria não encontrada.' };

    const duos = db.duos.filter(d => d.tournamentId === tournamentId && d.categoryId === categoryId);
    if (duos.length < 2) {
      return { success: false, error: 'É necessário pelo menos 2 duplas confirmadas para gerar os jogos da categoria.' };
    }

    const availableCourts = tournament.courtsUsed && tournament.courtsUsed >= 1 ? tournament.courtsUsed : 4;
    const matchDate = date || tournament.startDate || new Date().toISOString().split('T')[0];

    // Remove existing pending matches for this category
    db.matches = db.matches.filter(m => !(m.tournamentId === tournamentId && m.categoryId === categoryId && m.status === 'PENDENTE'));

    // Check if we go directly to elimination (e.g., exactly 2 duos -> Final; exactly 4 duos and requested)
    if (duos.length === 2) {
      // Directly Final
      const now = new Date().toISOString();
      const finalMatch: Match = {
        id: 'mat-el-fin-' + Math.random().toString(36).substring(2, 9),
        tournamentId,
        categoryId,
        stage: 'Final',
        groupName: 'Decisão do Título',
        duo1Id: duos[0].id,
        duo2Id: duos[1].id,
        date: matchDate,
        time: '18:00',
        court: `${courtPrefix} 1`,
        status: 'PENDENTE',
        format: 'STANDARD',
        games: category.games || 6,
        thaiBreak: category.thaiBreak ?? true,
        createdAt: now,
        updatedAt: now
      };
      db.matches.push(finalMatch);
      writeDB(db);
      return { success: true, count: 1 };
    }

    // Distribute duos into groups
    const { sizes } = this.calculateGroupDistribution(duos.length);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Shuffle duos randomly for fair group draw
    const shuffledDuos = [...duos].sort(() => Math.random() - 0.5);

    let offset = 0;
    const groupMatches: Match[] = [];
    const now = new Date().toISOString();
    let globalMatchCount = 0;

    sizes.forEach((groupSize, gIdx) => {
      const groupLetter = alphabet[gIdx] || `${gIdx + 1}`;
      const groupName = `Grupo ${groupLetter}`;
      const groupDuos = shuffledDuos.slice(offset, offset + groupSize);
      offset += groupSize;

      // Round-robin inside the group
      for (let i = 0; i < groupDuos.length; i++) {
        for (let j = i + 1; j < groupDuos.length; j++) {
          const d1 = groupDuos[i];
          const d2 = groupDuos[j];

          const courtNumber = (globalMatchCount % availableCourts) + 1;
          const courtName = `${courtPrefix} ${courtNumber}`;
          
          const startHour = 8;
          const totalMinutes = Math.floor(globalMatchCount / availableCourts) * 35;
          const hour = startHour + Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const matchTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

          const newMatch: Match = {
            id: 'mat-grp-' + Math.random().toString(36).substring(2, 11),
            tournamentId,
            categoryId,
            stage: 'Fase de Grupos',
            groupName,
            duo1Id: d1.id,
            duo2Id: d2.id,
            date: matchDate,
            time: matchTime,
            court: courtName,
            status: 'PENDENTE',
            format: 'STANDARD',
            games: category.games || 4,
            thaiBreak: category.thaiBreak ?? false,
            createdAt: now,
            updatedAt: now
          };

          groupMatches.push(newMatch);
          globalMatchCount++;
        }
      }
    });

    db.matches.push(...groupMatches);
    writeDB(db);

    return { success: true, count: groupMatches.length };
  },

  /**
   * Calculates standings for a specific group of duos
   */
  calculateGroupStandings(
    groupName: string,
    groupDuos: Duo[],
    groupMatches: Match[],
    athletes: Athlete[]
  ): GroupStanding[] {
    const athleteMap = new Map(athletes.map(a => [a.id, a.name]));

    const statsMap = new Map<string, GroupStanding>();

    groupDuos.forEach(d => {
      const p1 = athleteMap.get(d.player1Id) || 'Atleta 1';
      const p2 = athleteMap.get(d.player2Id) || 'Atleta 2';
      statsMap.set(d.id, {
        duoId: d.id,
        duoName: `${p1} / ${p2}`,
        player1Name: p1,
        player2Name: p2,
        groupName,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        gamesFor: 0,
        gamesAgainst: 0,
        gameDiff: 0,
        winRate: 0,
        points: 0,
        rank: 1,
        qualified: false
      });
    });

    groupMatches.forEach(m => {
      if (m.status !== 'FINALIZADA' && m.status !== 'WO') return;
      if (!m.duo1Id || !m.duo2Id) return;

      const stats1 = statsMap.get(m.duo1Id);
      const stats2 = statsMap.get(m.duo2Id);
      if (!stats1 || !stats2) return;

      stats1.played++;
      stats2.played++;

      // Parse score e.g. "6 x 4" or "7 x 6" or WO
      let s1 = 0;
      let s2 = 0;

      if (m.scoreA !== undefined && m.scoreB !== undefined) {
        s1 = m.scoreA;
        s2 = m.scoreB;
      } else if (m.score) {
        const parts = m.score.match(/(\d+)\s*[xX/-]\s*(\d+)/);
        if (parts) {
          s1 = parseInt(parts[1], 10);
          s2 = parseInt(parts[2], 10);
        } else if (m.score.includes('W.O.')) {
          if (m.winnerDuoId === m.duo1Id) {
            s1 = m.games || 6;
            s2 = 0;
          } else {
            s1 = 0;
            s2 = m.games || 6;
          }
        }
      }

      stats1.gamesFor += s1;
      stats1.gamesAgainst += s2;
      stats2.gamesFor += s2;
      stats2.gamesAgainst += s1;

      if (m.isDraw || (s1 === s2 && !m.winnerDuoId)) {
        stats1.draws++;
        stats2.draws++;
        stats1.points += 1;
        stats2.points += 1;
      } else if (m.winnerDuoId === m.duo1Id || s1 > s2) {
        stats1.wins++;
        stats2.losses++;
        stats1.points += 3;
      } else if (m.winnerDuoId === m.duo2Id || s2 > s1) {
        stats2.wins++;
        stats1.losses++;
        stats2.points += 3;
      }
    });

    // Calculate gameDiff, averages and win rate
    const standings = Array.from(statsMap.values()).map(st => {
      const gameDiff = st.gamesFor - st.gamesAgainst;
      const winRate = st.played > 0 ? Math.round((st.wins / st.played) * 100) : 0;
      const avgGameDiff = st.played > 0 ? parseFloat((gameDiff / st.played).toFixed(2)) : 0;
      const avgGamesFor = st.played > 0 ? parseFloat((st.gamesFor / st.played).toFixed(2)) : 0;
      return {
        ...st,
        gameDiff,
        winRate,
        avgGameDiff,
        avgGamesFor
      };
    });

    // Sort according to official beach tennis tiebreaker criteria:
    // 1. Vitórias (Wins)
    // 2. Confronto Direto (Head-to-head) between tied teams
    // 3. Saldo de Games (Game Difference)
    // 4. Games Pró (Games Won)
    // 5. Menor Games Contra
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;

      // Head to Head check if 2 teams are tied
      const headToHead = groupMatches.find(m => 
        (m.status === 'FINALIZADA' || m.status === 'WO') &&
        ((m.duo1Id === a.duoId && m.duo2Id === b.duoId) || (m.duo1Id === b.duoId && m.duo2Id === a.duoId))
      );
      if (headToHead && !headToHead.isDraw) {
        if (headToHead.winnerDuoId === a.duoId) return -1;
        if (headToHead.winnerDuoId === b.duoId) return 1;
      }

      if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
      if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
      if (a.gamesAgainst !== b.gamesAgainst) return a.gamesAgainst - b.gamesAgainst;
      return a.duoName.localeCompare(b.duoName);
    });

    // Assign rank and qualification (top 2 advance)
    standings.forEach((st, idx) => {
      st.rank = idx + 1;
      st.qualified = idx < 2; // top 2 per group qualify
    });

    return standings;
  },

  /**
   * Generates or fetches the comprehensive conventional tournament structure
   */
  getTournamentData(tournamentId: string, categoryId: string): ConventionalTournamentData | null {
    const db = readDB();
    const tournament = db.tournaments.find(t => t.id === tournamentId);
    const category = db.categories.find(c => c.id === categoryId);
    if (!tournament || !category) return null;

    const duos = db.duos.filter(d => d.tournamentId === tournamentId && d.categoryId === categoryId);
    const matches = db.matches.filter(m => m.tournamentId === tournamentId && m.categoryId === categoryId);
    const athletes = db.athletes;
    const athleteMap = new Map(athletes.map(a => [a.id, a.name]));

    // Find all group names
    const groupMatches = matches.filter(m => m.stage === 'Fase de Grupos');
    const groupNamesSet = new Set<string>();
    groupMatches.forEach(m => {
      if (m.groupName) groupNamesSet.add(m.groupName);
    });

    const groupNames = Array.from(groupNamesSet).sort();
    const groups: ConventionalTournamentData['groups'] = [];

    // Group-by-group processing
    groupNames.forEach(gName => {
      const gMatches = groupMatches.filter(m => m.groupName === gName);
      const gDuoIds = new Set<string>();
      gMatches.forEach(m => {
        if (m.duo1Id) gDuoIds.add(m.duo1Id);
        if (m.duo2Id) gDuoIds.add(m.duo2Id);
      });
      const gDuos = duos.filter(d => gDuoIds.has(d.id));
      const standings = this.calculateGroupStandings(gName, gDuos, gMatches, athletes);

      groups.push({
        name: gName,
        duos: gDuos.map(d => ({
          id: d.id,
          name: `${athleteMap.get(d.player1Id) || 'Atleta 1'} / ${athleteMap.get(d.player2Id) || 'Atleta 2'}`
        })),
        standings,
        matches: gMatches
      });
    });

    // Overall rankings across all groups (comparing top performers fairly using averages for uneven groups)
    const allStandings: GroupStanding[] = [];
    groups.forEach(g => {
      allStandings.push(...g.standings);
    });

    // Sort overall ranking for seedings and Byes:
    // 1st: group winners (rank 1), 2nd: group runners-up (rank 2), then others
    allStandings.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      // Compare win percentage
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      // Compare average game difference per match to be fair across groups of 3 vs 4 duos
      const avgDiffA = a.avgGameDiff ?? 0;
      const avgDiffB = b.avgGameDiff ?? 0;
      if (avgDiffB !== avgDiffA) return avgDiffB - avgDiffA;
      // Compare average games won
      const avgGFA = a.avgGamesFor ?? 0;
      const avgGFB = b.avgGamesFor ?? 0;
      if (avgGFB !== avgGFA) return avgGFB - avgGFA;
      return b.gameDiff - a.gameDiff;
    });

    // Qualified teams
    const qualifiedDuos = allStandings.filter(s => s.qualified);
    const totalClassified = qualifiedDuos.length;

    // Determine elimination bracket size: 2, 4, 8, or 16
    let bracketSize: 2 | 4 | 8 | 16 = 8;
    if (totalClassified <= 2) bracketSize = 2;
    else if (totalClassified <= 4) bracketSize = 4;
    else if (totalClassified <= 8) bracketSize = 8;
    else bracketSize = 16;

    const byesCount = Math.max(0, bracketSize - totalClassified);
    const byesDuos: { duoId: string; duoName: string; reason: string }[] = [];

    // The top `byesCount` qualified duos in the overall ranking receive a direct BYE
    for (let i = 0; i < byesCount && i < qualifiedDuos.length; i++) {
      const duo = qualifiedDuos[i];
      duo.hasBye = true;
      byesDuos.push({
        duoId: duo.duoId,
        duoName: duo.duoName,
        reason: `${i + 1}º Melhor Desempenho Geral (${duo.groupName} - ${duo.wins}V / Saldo ${duo.gameDiff > 0 ? '+' : ''}${duo.gameDiff})`
      });
    }

    // Process Elimination Matches (Oitavas, Quartas, Semis, Final)
    const eliminationMatches = matches.filter(m => m.stage !== 'Fase de Grupos');
    const eliminationStages = this.buildEliminationStages(
      bracketSize,
      qualifiedDuos,
      byesCount,
      eliminationMatches,
      duos,
      athletes
    );

    // Identify Champion
    let championDuo: ConventionalTournamentData['championDuo'] = undefined;
    const finalStage = eliminationStages.find(s => s.stageKey === 'final');
    if (finalStage && finalStage.matches.length > 0) {
      const finalMatch = finalStage.matches[0];
      if (finalMatch.status === 'FINALIZADA' && finalMatch.winnerDuoId) {
        const d = duos.find(du => du.id === finalMatch.winnerDuoId);
        if (d) {
          const p1 = athleteMap.get(d.player1Id) || 'Atleta 1';
          const p2 = athleteMap.get(d.player2Id) || 'Atleta 2';
          championDuo = {
            id: d.id,
            name: `${p1} / ${p2}`,
            player1Name: p1,
            player2Name: p2
          };
        }
      }
    }

    return {
      format: 'CONVENTIONAL',
      tournamentId,
      categoryId,
      categoryName: category.name || `${category.type} - ${category.level}`,
      games: category.games || 6,
      thaiBreak: category.thaiBreak ?? true,
      totalDuos: duos.length,
      groupCount: groups.length,
      groups,
      overallRankings: allStandings,
      byesInfo: {
        totalClassified,
        bracketSize,
        byesCount,
        byesDuos
      },
      eliminationStages,
      championDuo
    };
  },

  /**
   * Builds the World-Cup style bracket nodes with predictions and live advancement
   */
  buildEliminationStages(
    bracketSize: 2 | 4 | 8 | 16,
    qualifiedRankings: GroupStanding[],
    byesCount: number,
    existingMatches: Match[],
    duos: Duo[],
    athletes: Athlete[]
  ): ConventionalTournamentData['eliminationStages'] {
    const athleteMap = new Map(athletes.map(a => [a.id, a.name]));
    const duoMap = new Map(duos.map(d => {
      const p1 = athleteMap.get(d.player1Id) || 'Atleta 1';
      const p2 = athleteMap.get(d.player2Id) || 'Atleta 2';
      return [d.id, { duo: d, name: `${p1} / ${p2}`, p1, p2 }];
    }));

    const stages: ConventionalTournamentData['eliminationStages'] = [];

    // Helper to find match by stage and matchNumber
    const findMatch = (stageName: string, num: number) => {
      return existingMatches.find(m => m.stage === stageName && m.matchNumber === num);
    };

    // 1. Oitavas de Final (only if bracketSize === 16)
    if (bracketSize === 16) {
      const oitavasNodes: EliminationMatchNode[] = [];
      const matchCount = 8;
      for (let i = 1; i <= matchCount; i++) {
        const m = findMatch('Oitavas de Final', i);
        const slot = `oitavas-${i}`;
        const nextSlot = `qf-${Math.ceil(i / 2)}`;
        const nextSlotTeam = i % 2 === 1 ? 'teamA' : 'teamB';

        const d1 = m?.duo1Id ? duoMap.get(m.duo1Id) : undefined;
        const d2 = m?.duo2Id ? duoMap.get(m.duo2Id) : undefined;

        oitavasNodes.push({
          id: m?.id || `draft-${slot}`,
          stage: 'Oitavas de Final',
          matchNumber: i,
          bracketSlot: slot,
          nextBracketSlot: nextSlot,
          nextSlotTeam,
          duo1Id: m?.duo1Id,
          duo2Id: m?.duo2Id,
          duo1Name: d1?.name || (m?.duo1Id ? 'Dupla 1' : `Classificado ${i * 2 - 1}`),
          duo2Name: d2?.name || (m?.duo2Id ? 'Dupla 2' : `Classificado ${i * 2}`),
          player1_A_Name: d1?.p1,
          player2_A_Name: d1?.p2,
          player1_B_Name: d2?.p1,
          player2_B_Name: d2?.p2,
          placeholder1: `Classificado #${i * 2 - 1}`,
          placeholder2: `Classificado #${i * 2}`,
          score: m?.score,
          score1: m?.scoreA,
          score2: m?.scoreB,
          winnerDuoId: m?.winnerDuoId,
          winnerName: m?.winnerDuoId ? duoMap.get(m.winnerDuoId)?.name : undefined,
          status: m?.status || 'PENDENTE',
          date: m?.date,
          time: m?.time,
          court: m?.court
        });
      }
      stages.push({
        stageName: 'Oitavas de Final',
        stageKey: 'oitavas',
        matches: oitavasNodes
      });
    }

    // 2. Quartas de Final (if bracketSize >= 8)
    if (bracketSize >= 8) {
      const qfNodes: EliminationMatchNode[] = [];
      const matchCount = 4;
      for (let i = 1; i <= matchCount; i++) {
        const m = findMatch('Quartas de Final', i);
        const slot = `qf-${i}`;
        const nextSlot = `sf-${Math.ceil(i / 2)}`;
        const nextSlotTeam = i % 2 === 1 ? 'teamA' : 'teamB';

        // Check if feeding from Oitavas
        let pred1 = `Vencedor Oitavas ${i * 2 - 1}`;
        let pred2 = `Vencedor Oitavas ${i * 2}`;
        if (bracketSize === 8) {
          pred1 = `1º Colocado #${i}`;
          pred2 = `2º Colocado #${5 - i}`;
        }

        const d1 = m?.duo1Id ? duoMap.get(m.duo1Id) : undefined;
        const d2 = m?.duo2Id ? duoMap.get(m.duo2Id) : undefined;

        // Check for BYE
        const isBye = m?.duo1Id && (!m?.duo2Id || m?.duo2Id === 'BYE') || (byesCount > 0 && i <= byesCount && bracketSize === 8 && !m?.duo2Id);

        qfNodes.push({
          id: m?.id || `draft-${slot}`,
          stage: 'Quartas de Final',
          matchNumber: i,
          bracketSlot: slot,
          nextBracketSlot: nextSlot,
          nextSlotTeam,
          duo1Id: m?.duo1Id,
          duo2Id: m?.duo2Id,
          duo1Name: d1?.name || (isBye && d1 ? d1.name : (m?.duo1Id ? 'Dupla 1' : pred1)),
          duo2Name: isBye ? 'BYE (Avança Direto)' : (d2?.name || (m?.duo2Id ? 'Dupla 2' : pred2)),
          player1_A_Name: d1?.p1,
          player2_A_Name: d1?.p2,
          player1_B_Name: d2?.p1,
          player2_B_Name: d2?.p2,
          placeholder1: pred1,
          placeholder2: pred2,
          score: isBye ? 'BYE' : m?.score,
          score1: m?.scoreA,
          score2: m?.scoreB,
          winnerDuoId: isBye ? m?.duo1Id : m?.winnerDuoId,
          winnerName: isBye && d1 ? d1.name : (m?.winnerDuoId ? duoMap.get(m.winnerDuoId)?.name : undefined),
          isBye: !!isBye,
          status: isBye ? 'BYE' : (m?.status || 'PENDENTE'),
          date: m?.date,
          time: m?.time,
          court: m?.court
        });
      }
      stages.push({
        stageName: 'Quartas de Final',
        stageKey: 'quartas',
        matches: qfNodes
      });
    }

    // 3. Semifinais (if bracketSize >= 4)
    if (bracketSize >= 4) {
      const sfNodes: EliminationMatchNode[] = [];
      const matchCount = 2;
      for (let i = 1; i <= matchCount; i++) {
        const m = findMatch('Semifinal', i);
        const slot = `sf-${i}`;
        const nextSlot = 'final-1';
        const nextSlotTeam = i === 1 ? 'teamA' : 'teamB';

        const pred1 = bracketSize >= 8 ? `Vencedor Quartas ${i * 2 - 1}` : `1º Colocado #${i}`;
        const pred2 = bracketSize >= 8 ? `Vencedor Quartas ${i * 2}` : `2º Colocado #${3 - i}`;

        // Auto-feed from previous stage if match is finished or bye
        let fedDuo1Id = m?.duo1Id;
        let fedDuo2Id = m?.duo2Id;

        if (!fedDuo1Id && bracketSize >= 8) {
          const qfStage = stages.find(s => s.stageKey === 'quartas');
          const sourceMatch1 = qfStage?.matches.find(qm => qm.bracketSlot === `qf-${i * 2 - 1}`);
          if (sourceMatch1?.winnerDuoId) {
            fedDuo1Id = sourceMatch1.winnerDuoId;
          }
        }
        if (!fedDuo2Id && bracketSize >= 8) {
          const qfStage = stages.find(s => s.stageKey === 'quartas');
          const sourceMatch2 = qfStage?.matches.find(qm => qm.bracketSlot === `qf-${i * 2}`);
          if (sourceMatch2?.winnerDuoId) {
            fedDuo2Id = sourceMatch2.winnerDuoId;
          }
        }

        const d1 = fedDuo1Id ? duoMap.get(fedDuo1Id) : undefined;
        const d2 = fedDuo2Id ? duoMap.get(fedDuo2Id) : undefined;

        sfNodes.push({
          id: m?.id || `draft-${slot}`,
          stage: 'Semifinal',
          matchNumber: i,
          bracketSlot: slot,
          nextBracketSlot: nextSlot,
          nextSlotTeam,
          duo1Id: fedDuo1Id,
          duo2Id: fedDuo2Id,
          duo1Name: d1?.name || pred1,
          duo2Name: d2?.name || pred2,
          player1_A_Name: d1?.p1,
          player2_A_Name: d1?.p2,
          player1_B_Name: d2?.p1,
          player2_B_Name: d2?.p2,
          placeholder1: pred1,
          placeholder2: pred2,
          score: m?.score,
          score1: m?.scoreA,
          score2: m?.scoreB,
          winnerDuoId: m?.winnerDuoId,
          winnerName: m?.winnerDuoId ? duoMap.get(m.winnerDuoId)?.name : undefined,
          status: m?.status || 'PENDENTE',
          date: m?.date,
          time: m?.time,
          court: m?.court
        });
      }
      stages.push({
        stageName: 'Semifinal',
        stageKey: 'semifinal',
        matches: sfNodes
      });
    }

    // 4. Final (always present)
    const mFinal = findMatch('Final', 1);
    const predF1 = bracketSize >= 4 ? 'Vencedor Semifinal 1' : '1º Colocado Geral';
    const predF2 = bracketSize >= 4 ? 'Vencedor Semifinal 2' : '2º Colocado Geral';

    let finalDuo1Id = mFinal?.duo1Id;
    let finalDuo2Id = mFinal?.duo2Id;

    if (!finalDuo1Id && bracketSize >= 4) {
      const sfStage = stages.find(s => s.stageKey === 'semifinal');
      const sf1 = sfStage?.matches.find(sm => sm.bracketSlot === 'sf-1');
      if (sf1?.winnerDuoId) finalDuo1Id = sf1.winnerDuoId;
    }
    if (!finalDuo2Id && bracketSize >= 4) {
      const sfStage = stages.find(s => s.stageKey === 'semifinal');
      const sf2 = sfStage?.matches.find(sm => sm.bracketSlot === 'sf-2');
      if (sf2?.winnerDuoId) finalDuo2Id = sf2.winnerDuoId;
    }

    const dF1 = finalDuo1Id ? duoMap.get(finalDuo1Id) : undefined;
    const dF2 = finalDuo2Id ? duoMap.get(finalDuo2Id) : undefined;

    stages.push({
      stageName: 'Final',
      stageKey: 'final',
      matches: [{
        id: mFinal?.id || 'draft-final-1',
        stage: 'Final',
        matchNumber: 1,
        bracketSlot: 'final-1',
        duo1Id: finalDuo1Id,
        duo2Id: finalDuo2Id,
        duo1Name: dF1?.name || predF1,
        duo2Name: dF2?.name || predF2,
        player1_A_Name: dF1?.p1,
        player2_A_Name: dF1?.p2,
        player1_B_Name: dF2?.p1,
        player2_B_Name: dF2?.p2,
        placeholder1: predF1,
        placeholder2: predF2,
        score: mFinal?.score,
        score1: mFinal?.scoreA,
        score2: mFinal?.scoreB,
        winnerDuoId: mFinal?.winnerDuoId,
        winnerName: mFinal?.winnerDuoId ? duoMap.get(mFinal.winnerDuoId)?.name : undefined,
        status: mFinal?.status || 'PENDENTE',
        date: mFinal?.date,
        time: mFinal?.time,
        court: mFinal?.court
      }]
    });

    return stages;
  },

  /**
   * Generates or updates the elimination bracket matches in the database
   * when group stage concludes or when requested by the organizer
   */
  generateEliminationBracket(
    tournamentId: string,
    categoryId: string,
    date: string,
    courtPrefix: string = 'Quadra'
  ): { success: boolean; error?: string; count?: number } {
    const db = readDB();
    const tournament = db.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return { success: false, error: 'Torneio não encontrado.' };

    const category = db.categories.find(c => c.id === categoryId);
    if (!category) return { success: false, error: 'Categoria não encontrada.' };

    const matchDate = date || tournament.startDate || new Date().toISOString().split('T')[0];
    const availableCourts = tournament.courtsUsed && tournament.courtsUsed >= 1 ? tournament.courtsUsed : 4;

    const data = this.getTournamentData(tournamentId, categoryId);
    if (!data) return { success: false, error: 'Não foi possível carregar os dados do torneio.' };

    // Check if group stage is completed
    const pendingGroupMatches = data.groups.flatMap(g => g.matches).filter(m => m.status === 'PENDENTE');
    if (pendingGroupMatches.length > 0 && data.groups.length > 0) {
      return {
        success: false,
        error: `Ainda existem ${pendingGroupMatches.length} jogos pendentes na fase de grupos. Todos os placares dos grupos devem ser lançados antes de gerar a chave eliminatória.`
      };
    }

    const { totalClassified, bracketSize, byesCount, byesDuos } = data.byesInfo;
    const qualified = data.overallRankings.filter(s => s.qualified);

    if (qualified.length < 2) {
      return { success: false, error: 'Pelo menos 2 duplas precisam estar classificadas para gerar o mata-mata.' };
    }

    // Remove existing pending elimination matches (keep finalized ones to avoid losing results)
    db.matches = db.matches.filter(m => !(
      m.tournamentId === tournamentId && 
      m.categoryId === categoryId && 
      m.stage !== 'Fase de Grupos' && 
      m.status === 'PENDENTE'
    ));

    const now = new Date().toISOString();
    const newEliminationMatches: Match[] = [];
    const byeIds = new Set(byesDuos.map(b => b.duoId));

    // Classical seeded bracket pairing:
    // 1st seed vs last seed, 2nd seed vs second-last seed
    if (bracketSize === 8) {
      // Quartas de final (4 matches)
      // Top seeds get byes if byesCount > 0
      const nonByeQualified = qualified.filter(q => !byeIds.has(q.duoId));

      for (let qf = 1; qf <= 4; qf++) {
        const existing = db.matches.find(m => m.tournamentId === tournamentId && m.categoryId === categoryId && m.stage === 'Quartas de Final' && m.matchNumber === qf);
        if (existing) continue;

        let d1Id: string | undefined = undefined;
        let d2Id: string | undefined = undefined;
        let isByeMatch = false;

        if (qf <= byesCount) {
          // This QF slot is a BYE for seed #qf!
          const byeDuo = byesDuos[qf - 1];
          d1Id = byeDuo?.duoId;
          isByeMatch = true;
        } else {
          // Regular match among non-bye qualified teams
          const pairIndex = (qf - 1 - byesCount) * 2;
          d1Id = nonByeQualified[pairIndex]?.duoId;
          d2Id = nonByeQualified[pairIndex + 1]?.duoId;
        }

        const courtNum = ((qf - 1) % availableCourts) + 1;
        const newMatch: Match = {
          id: 'mat-el-qf-' + Math.random().toString(36).substring(2, 9),
          tournamentId,
          categoryId,
          stage: 'Quartas de Final',
          matchNumber: qf,
          groupName: 'Mata-Mata',
          duo1Id: d1Id,
          duo2Id: isByeMatch ? undefined : d2Id,
          winnerDuoId: isByeMatch ? d1Id : undefined,
          date: matchDate,
          time: `15:${((qf - 1) * 30).toString().padStart(2, '0')}`,
          court: `${courtPrefix} ${courtNum}`,
          status: isByeMatch ? 'FINALIZADA' : 'PENDENTE',
          score: isByeMatch ? 'BYE (Avanço Direto)' : undefined,
          format: 'STANDARD',
          games: category.games || 6,
          thaiBreak: category.thaiBreak ?? true,
          createdAt: now,
          updatedAt: now
        };

        newEliminationMatches.push(newMatch);
      }

      // Pre-create Semifinals
      for (let sf = 1; sf <= 2; sf++) {
        const existing = db.matches.find(m => m.tournamentId === tournamentId && m.categoryId === categoryId && m.stage === 'Semifinal' && m.matchNumber === sf);
        if (existing) continue;

        // Check if QF winners already exist (e.g., from BYEs)
        const qf1Match = newEliminationMatches.find(m => m.stage === 'Quartas de Final' && m.matchNumber === (sf * 2 - 1));
        const qf2Match = newEliminationMatches.find(m => m.stage === 'Quartas de Final' && m.matchNumber === (sf * 2));

        const courtNum = ((sf - 1) % availableCourts) + 1;
        newEliminationMatches.push({
          id: 'mat-el-sf-' + Math.random().toString(36).substring(2, 9),
          tournamentId,
          categoryId,
          stage: 'Semifinal',
          matchNumber: sf,
          groupName: 'Mata-Mata',
          duo1Id: qf1Match?.winnerDuoId,
          duo2Id: qf2Match?.winnerDuoId,
          date: matchDate,
          time: `17:${((sf - 1) * 40).toString().padStart(2, '0')}`,
          court: `${courtPrefix} ${courtNum}`,
          status: 'PENDENTE',
          format: 'STANDARD',
          games: category.games || 6,
          thaiBreak: category.thaiBreak ?? true,
          createdAt: now,
          updatedAt: now
        });
      }

      // Pre-create Final
      const existingFinal = db.matches.find(m => m.tournamentId === tournamentId && m.categoryId === categoryId && m.stage === 'Final');
      if (!existingFinal) {
        newEliminationMatches.push({
          id: 'mat-el-fin-' + Math.random().toString(36).substring(2, 9),
          tournamentId,
          categoryId,
          stage: 'Final',
          matchNumber: 1,
          groupName: 'Decisão do Título',
          date: matchDate,
          time: '19:00',
          court: `${courtPrefix} 1`,
          status: 'PENDENTE',
          format: 'STANDARD',
          games: category.games || 6,
          thaiBreak: category.thaiBreak ?? true,
          createdAt: now,
          updatedAt: now
        });
      }
    } else if (bracketSize === 4) {
      // Direct Semifinals
      for (let sf = 1; sf <= 2; sf++) {
        const existing = db.matches.find(m => m.tournamentId === tournamentId && m.categoryId === categoryId && m.stage === 'Semifinal' && m.matchNumber === sf);
        if (existing) continue;

        // Cross pairing: 1st vs 4th, 2nd vs 3rd
        const d1 = sf === 1 ? qualified[0] : qualified[1];
        const d2 = sf === 1 ? qualified[3] : qualified[2];

        newEliminationMatches.push({
          id: 'mat-el-sf-' + Math.random().toString(36).substring(2, 9),
          tournamentId,
          categoryId,
          stage: 'Semifinal',
          matchNumber: sf,
          groupName: 'Mata-Mata',
          duo1Id: d1?.duoId,
          duo2Id: d2?.duoId,
          date: matchDate,
          time: `16:${((sf - 1) * 45).toString().padStart(2, '0')}`,
          court: `${courtPrefix} ${sf}`,
          status: 'PENDENTE',
          format: 'STANDARD',
          games: category.games || 6,
          thaiBreak: category.thaiBreak ?? true,
          createdAt: now,
          updatedAt: now
        });
      }

      const existingFinal = db.matches.find(m => m.tournamentId === tournamentId && m.categoryId === categoryId && m.stage === 'Final');
      if (!existingFinal) {
        newEliminationMatches.push({
          id: 'mat-el-fin-' + Math.random().toString(36).substring(2, 9),
          tournamentId,
          categoryId,
          stage: 'Final',
          matchNumber: 1,
          groupName: 'Decisão do Título',
          date: matchDate,
          time: '18:30',
          court: `${courtPrefix} 1`,
          status: 'PENDENTE',
          format: 'STANDARD',
          games: category.games || 6,
          thaiBreak: category.thaiBreak ?? true,
          createdAt: now,
          updatedAt: now
        });
      }
    } else if (bracketSize === 2) {
      // Direct Final
      const existingFinal = db.matches.find(m => m.tournamentId === tournamentId && m.categoryId === categoryId && m.stage === 'Final');
      if (!existingFinal) {
        newEliminationMatches.push({
          id: 'mat-el-fin-' + Math.random().toString(36).substring(2, 9),
          tournamentId,
          categoryId,
          stage: 'Final',
          matchNumber: 1,
          groupName: 'Decisão do Título',
          duo1Id: qualified[0]?.duoId,
          duo2Id: qualified[1]?.duoId,
          date: matchDate,
          time: '18:00',
          court: `${courtPrefix} 1`,
          status: 'PENDENTE',
          format: 'STANDARD',
          games: category.games || 6,
          thaiBreak: category.thaiBreak ?? true,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    db.matches.push(...newEliminationMatches);
    writeDB(db);

    return { success: true, count: newEliminationMatches.length };
  },

  /**
   * Automatically advances the winner of an elimination match to the next round
   */
  advanceWinnerInBracket(matchId: string, winnerDuoId: string): void {
    const db = readDB();
    const currentMatch = db.matches.find(m => m.id === matchId);
    if (!currentMatch || !currentMatch.stage || !currentMatch.matchNumber) return;

    let targetStage: string | null = null;
    let targetMatchNumber = 1;
    let targetSlot: 'duo1Id' | 'duo2Id' = 'duo1Id';

    if (currentMatch.stage === 'Oitavas de Final') {
      targetStage = 'Quartas de Final';
      targetMatchNumber = Math.ceil(currentMatch.matchNumber / 2);
      targetSlot = currentMatch.matchNumber % 2 === 1 ? 'duo1Id' : 'duo2Id';
    } else if (currentMatch.stage === 'Quartas de Final') {
      targetStage = 'Semifinal';
      targetMatchNumber = Math.ceil(currentMatch.matchNumber / 2);
      targetSlot = currentMatch.matchNumber % 2 === 1 ? 'duo1Id' : 'duo2Id';
    } else if (currentMatch.stage === 'Semifinal') {
      targetStage = 'Final';
      targetMatchNumber = 1;
      targetSlot = currentMatch.matchNumber === 1 ? 'duo1Id' : 'duo2Id';
    }

    if (!targetStage) return;

    let targetMatch = db.matches.find(m => 
      m.tournamentId === currentMatch.tournamentId &&
      m.categoryId === currentMatch.categoryId &&
      m.stage === targetStage &&
      m.matchNumber === targetMatchNumber
    );

    if (targetMatch) {
      targetMatch[targetSlot] = winnerDuoId;
      targetMatch.updatedAt = new Date().toISOString();
      writeDB(db);
    }
  }
};
