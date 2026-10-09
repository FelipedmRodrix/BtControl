import { Match, Athlete } from '../db/store';

export interface Super8MatchSchedule {
  round: number; // 1 to 7
  matchNumber: number; // 1 to 14
  teamA: [number, number]; // 1-based index (1 to 8)
  teamB: [number, number];
}

/**
 * Super 8 tournament reference schedule (exact match pairing requested):
 * Rodada 1: J1: (1+8) x (2+7), J2: (3+6) x (4+5)
 * Rodada 2: J3: (1+7) x (8+6), J4: (2+5) x (3+4)
 * Rodada 3: J5: (1+6) x (7+5), J6: (8+4) x (2+3)
 * Rodada 4: J7: (1+5) x (6+4), J8: (7+3) x (8+2)
 * Rodada 5: J9: (1+4) x (5+3), J10: (6+2) x (7+8)
 * Rodada 6: J11: (1+3) x (4+2), J12: (5+8) x (6+7)
 * Rodada 7: J13: (1+2) x (3+8), J14: (4+7) x (5+6)
 */
export const SUPER_8_ROUNDS_TEMPLATE: Super8MatchSchedule[] = [
  // Rodada 1
  { round: 1, matchNumber: 1, teamA: [1, 8], teamB: [2, 7] },
  { round: 1, matchNumber: 2, teamA: [3, 6], teamB: [4, 5] },
  // Rodada 2
  { round: 2, matchNumber: 3, teamA: [1, 7], teamB: [8, 6] },
  { round: 2, matchNumber: 4, teamA: [2, 5], teamB: [3, 4] },
  // Rodada 3
  { round: 3, matchNumber: 5, teamA: [1, 6], teamB: [7, 5] },
  { round: 3, matchNumber: 6, teamA: [8, 4], teamB: [2, 3] },
  // Rodada 4
  { round: 4, matchNumber: 7, teamA: [1, 5], teamB: [6, 4] },
  { round: 4, matchNumber: 8, teamA: [7, 3], teamB: [8, 2] },
  // Rodada 5
  { round: 5, matchNumber: 9, teamA: [1, 4], teamB: [5, 3] },
  { round: 5, matchNumber: 10, teamA: [6, 2], teamB: [7, 8] },
  // Rodada 6
  { round: 6, matchNumber: 11, teamA: [1, 3], teamB: [4, 2] },
  { round: 6, matchNumber: 12, teamA: [5, 8], teamB: [6, 7] },
  // Rodada 7
  { round: 7, matchNumber: 13, teamA: [1, 2], teamB: [3, 8] },
  { round: 7, matchNumber: 14, teamA: [4, 7], teamB: [5, 6] },
];

export interface Super8ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Rigorous validation of Super 8 generated matches according to system rules:
 * 1. Existem exatamente 8 atletas inscritos
 * 2. Todos os 8 atletas participam de todas as 7 rodadas
 * 3. Cada atleta joga exatamente 7 partidas
 * 4. Cada atleta possui exatamente 7 parceiros diferentes
 * 5. Cada parceiro é utilizado apenas uma vez por atleta
 * 6. Nenhum atleta pode aparecer simultaneamente nos dois lados da mesma partida
 * 7. Cada partida possui exatamente 4 atletas
 * 8. Cada rodada possui exatamente 2 partidas
 */
export function validateSuper8Schedule(
  matches: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>[],
  athleteIds: string[]
): Super8ValidationResult {
  // 1. Existem exatamente 8 atletas
  if (athleteIds.length !== 8) {
    return {
      valid: false,
      error: `O formato Super 8 exige exatamente 8 atletas inscritos na categoria. Foram encontrados ${athleteIds.length}.`
    };
  }

  // Verificar IDs de atletas únicos
  const uniqueAthletes = new Set(athleteIds);
  if (uniqueAthletes.size !== 8) {
    return {
      valid: false,
      error: 'Existem atletas duplicados na lista de inscritos do Super 8.'
    };
  }

  // 14 partidas no total
  if (matches.length !== 14) {
    return {
      valid: false,
      error: `O Super 8 deve conter exatamente 14 partidas. Foram geradas ${matches.length}.`
    };
  }

  const roundCounts = new Map<number, number>();
  const playerMatchesCount = new Map<string, number>();
  const playerPartners = new Map<string, Set<string>>();

  athleteIds.forEach(id => {
    playerMatchesCount.set(id, 0);
    playerPartners.set(id, new Set<string>());
  });

  for (const m of matches) {
    if (!m.round || m.round < 1 || m.round > 7) {
      return { valid: false, error: `Partida com rodada inválida: ${m.round}.` };
    }

    roundCounts.set(m.round, (roundCounts.get(m.round) || 0) + 1);

    if (!m.teamA || !m.teamB) {
      return { valid: false, error: 'Cada partida do Super 8 deve conter o Time A e Time B definidos.' };
    }

    const { player1Id: a1, player2Id: a2 } = m.teamA;
    const { player1Id: b1, player2Id: b2 } = m.teamB;

    const matchPlayers = [a1, a2, b1, b2];

    // 7. Cada partida possui exatamente 4 atletas
    // 6. Nenhum atleta pode aparecer simultaneamente nos dois lados ou repetido na mesma partida
    const matchPlayerSet = new Set(matchPlayers);
    if (matchPlayerSet.size !== 4) {
      return {
        valid: false,
        error: `A partida ${m.matchNumber || m.stage} possui atletas repetidos ou em lados opostos na mesma partida.`
      };
    }

    // Contabilizar presenças dos atletas
    for (const p of matchPlayers) {
      if (!playerMatchesCount.has(p)) {
        return { valid: false, error: `Atleta desconhecido (${p}) encontrado na partida.` };
      }
      playerMatchesCount.set(p, (playerMatchesCount.get(p) || 0) + 1);
    }

    // 4 & 5. Validação de parceiros: Time A
    if (playerPartners.get(a1)?.has(a2)) {
      return { valid: false, error: `Parceiro repetido detectado: ${a1} e ${a2} já jogaram juntos.` };
    }
    playerPartners.get(a1)?.add(a2);
    playerPartners.get(a2)?.add(a1);

    // 4 & 5. Validação de parceiros: Time B
    if (playerPartners.get(b1)?.has(b2)) {
      return { valid: false, error: `Parceiro repetido detectado: ${b1} e ${b2} já jogaram juntos.` };
    }
    playerPartners.get(b1)?.add(b2);
    playerPartners.get(b2)?.add(b1);
  }

  // 8. Cada rodada possui exatamente 2 partidas
  for (let r = 1; r <= 7; r++) {
    const count = roundCounts.get(r) || 0;
    if (count !== 2) {
      return {
        valid: false,
        error: `A Rodada ${r} possui ${count} partidas em vez de exatamente 2.`
      };
    }
  }

  // 3. Cada atleta joga exatamente 7 partidas
  for (const [pId, count] of playerMatchesCount.entries()) {
    if (count !== 7) {
      return {
        valid: false,
        error: `O atleta ${pId} participou de ${count} partidas em vez de 7.`
      };
    }
  }

  // 4. Cada atleta possui exatamente 7 parceiros distintos
  for (const [pId, partners] of playerPartners.entries()) {
    if (partners.size !== 7) {
      return {
        valid: false,
        error: `O atleta ${pId} teve ${partners.size} parceiros distintos em vez de 7.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validação de placar Super 8:
 * - 4 games (padrão): um time deve fechar com 4 games e o adversário entre 0 e 3.
 * - 6 games sem Thai Break: primeiro a 6 (0-6, 1-6, 2-6, 3-6, 4-6, 5-6), sem empate.
 * - 6 games com Thai Break: 
 *   - Normal: 0-6 a 4-6 (primeiro a 6)
 *   - Em 5x5: quem chegar a 7 vence (7-5)
 *   - Em 6x6: Thai Break - 7 pontos consecutivos, quem fizer 7 primeiro vence (7-6)
 */
export function validateSuper8Score(scoreA: number, scoreB: number, games: number = 4, thaiBreak: boolean = false): { valid: boolean; error?: string } {
  if (isNaN(scoreA) || isNaN(scoreB)) {
    return { valid: false, error: 'Os games devem ser números válidos.' };
  }

  if (scoreA === scoreB) {
    return { valid: false, error: 'Não há empate na partida. Um time deve fechar os games.' };
  }

  // Formato padrão de 4 games
  if (games === 4) {
    const isTeamAWinner = scoreA === 4 && scoreB >= 0 && scoreB <= 3;
    const isTeamBWinner = scoreB === 4 && scoreA >= 0 && scoreA <= 3;

    if (!isTeamAWinner && !isTeamBWinner) {
      return {
        valid: false,
        error: 'Placar inválido. Um time deve fechar com 4 games e o adversário entre 0 e 3 games (Ex: 4x0, 4x1, 4x2, 4x3).'
      };
    }

    return { valid: true };
  }

  // Formato de 6 games
  if (games === 6) {
    if (!thaiBreak) {
      // Sem Thai Break: primeiro a 6 games
      const isTeamAWinner = scoreA === 6 && scoreB >= 0 && scoreB <= 4;
      const isTeamBWinner = scoreB === 6 && scoreA >= 0 && scoreA <= 4;

      if (!isTeamAWinner && !isTeamBWinner) {
        return {
          valid: false,
          error: 'Placar inválido. Um time deve fechar com 6 games e o adversário entre 0 e 4 games (Ex: 6x0, 6x1, 6x2, 6x3, 6x4).'
        };
      }

      return { valid: true };
    }

    // Com Thai Break
    const isTeamAWinner = (scoreA === 6 && scoreB >= 0 && scoreB <= 4) || // 6-0 a 6-4
                          (scoreA === 7 && scoreB === 5) || // 7-5 (at 5x5)
                          (scoreA === 7 && scoreB === 6);   // 7-6 (Thai Break)

    const isTeamBWinner = (scoreB === 6 && scoreA >= 0 && scoreA <= 4) ||
                          (scoreB === 7 && scoreA === 5) ||
                          (scoreB === 7 && scoreA === 6);

    if (!isTeamAWinner && !isTeamBWinner) {
      return {
        valid: false,
        error: 'Placar inválido para 6 games com Thai Break. Válido: 6x0-4, 7x5, ou 7x6 (Thai Break).'
      };
    }

    return { valid: true };
  }

  return { valid: false, error: 'Formato de games não suportado.' };
}

export interface Super8AthleteStanding {
  rank: number;
  athleteId: string;
  athleteName: string;
  played: number; // Partidas jogadas
  wins: number; // Vitórias
  losses: number; // Derrotas
  gamesFor: number; // Games feitos (GF)
  gamesAgainst: number; // Games sofridos (GS)
  gameDiff: number; // Saldo de games (SG)
  winRate: number; // Aproveitamento em %
}

/**
 * Classificação Individual do Super 8:
 * Calcula o desempenho individual de cada atleta a partir dos resultados das partidas.
 * Critérios de desempate:
 * 1. Vitórias (V)
 * 2. Saldo de games (SG)
 * 3. Games feitos (GF)
 * 4. Menos games sofridos (GS)
 */
export function calculateSuper8Standings(
  matches: (Match | any)[],
  athletes: { id: string; name: string; [key: string]: any }[],
  games: number = 4
): Super8AthleteStanding[] {
  const athleteMap = new Map<string, { id: string; name: string }>();
  athletes.forEach(a => athleteMap.set(a.id, a));

  const statsMap = new Map<string, {
    athleteId: string;
    athleteName: string;
    played: number;
    wins: number;
    losses: number;
    gamesFor: number;
    gamesAgainst: number;
  }>();

  // Initialize for all athletes found in matches or provided
  athletes.forEach(a => {
    statsMap.set(a.id, {
      athleteId: a.id,
      athleteName: a.name,
      played: 0,
      wins: 0,
      losses: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    });
  });

  // Process completed or WO matches
  for (const m of matches) {
    if (m.status !== 'FINALIZADA' && m.status !== 'WO') continue;
    if (!m.teamA || !m.teamB) continue;

    let scoreA = m.scoreA ?? 0;
    let scoreB = m.scoreB ?? 0;

    // Se veio no formato string "4 x 2" ou "W.O."
    if (m.score && (!m.scoreA && !m.scoreB && m.scoreA !== 0 && m.scoreB !== 0)) {
      const matchRegex = m.score.match(/(\d+)\s*[xX/-]\s*(\d+)/);
      if (matchRegex) {
        scoreA = parseInt(matchRegex[1], 10);
        scoreB = parseInt(matchRegex[2], 10);
      }
    }

    if (m.status === 'WO') {
      if (m.winnerTeam === 'TEAM_A') {
        scoreA = 4;
        scoreB = 0;
      } else if (m.winnerTeam === 'TEAM_B') {
        scoreA = 0;
        scoreB = 4;
      }
    }

    const teamAWon = scoreA > scoreB;

    const teamAPlayers = [m.teamA.player1Id, m.teamA.player2Id];
    const teamBPlayers = [m.teamB.player1Id, m.teamB.player2Id];

    // Atletas do Time A
    for (const pId of teamAPlayers) {
      const st = statsMap.get(pId) || {
        athleteId: pId,
        athleteName: athleteMap.get(pId)?.name || 'Atleta',
        played: 0,
        wins: 0,
        losses: 0,
        gamesFor: 0,
        gamesAgainst: 0
      };
      st.played += 1;
      if (teamAWon) {
        st.wins += 1;
      } else {
        st.losses += 1;
      }
      st.gamesFor += scoreA;
      st.gamesAgainst += scoreB;
      statsMap.set(pId, st);
    }

    // Atletas do Time B
    for (const pId of teamBPlayers) {
      const st = statsMap.get(pId) || {
        athleteId: pId,
        athleteName: athleteMap.get(pId)?.name || 'Atleta',
        played: 0,
        wins: 0,
        losses: 0,
        gamesFor: 0,
        gamesAgainst: 0
      };
      st.played += 1;
      if (!teamAWon) {
        st.wins += 1;
      } else {
        st.losses += 1;
      }
      st.gamesFor += scoreB;
      st.gamesAgainst += scoreA;
      statsMap.set(pId, st);
    }
  }

  // Convert to array and sort
  const standings: Super8AthleteStanding[] = Array.from(statsMap.values()).map(st => {
    const gameDiff = st.gamesFor - st.gamesAgainst;
    const winRate = st.played > 0 ? Math.round((st.wins / st.played) * 100) : 0;
    return {
      rank: 1,
      athleteId: st.athleteId,
      athleteName: st.athleteName,
      played: st.played,
      wins: st.wins,
      losses: st.losses,
      gamesFor: st.gamesFor,
      gamesAgainst: st.gamesAgainst,
      gameDiff,
      winRate
    };
  });

  // Sort criteria: Wins desc -> GameDiff desc -> GamesFor desc -> GamesAgainst asc
  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
    return a.gamesAgainst - b.gamesAgainst;
  });

  // Assign ranks
  standings.forEach((st, idx) => {
    st.rank = idx + 1;
  });

  return standings;
}
