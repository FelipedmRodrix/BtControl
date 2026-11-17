import { readDB, writeDB, Super8Event, Super8Match } from '../db/store';
import {
  SUPER_8_ROUNDS_TEMPLATE,
  validateSuper8Schedule,
  validateSuper8Score,
  resolveSuper8Tie,
  calculateSuper8Standings,
  Super8AthleteStanding
} from './super8Service';

export interface CreateSuper8Input {
  name: string;
  seriesName?: string;
  arenaId: string;
  venueId?: string;
  courtsUsed?: number;
  startDate: string;
  endDate: string;
  status?: 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO';
  categoryName?: string;
  level?: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price?: number;
  games?: number;
  thaiBreak?: boolean;
  athleteIds?: string[];
}

function buildNextMatchSuggestion(db: ReturnType<typeof readDB>, eventId: string, currentMatchId: string, freedCourt: string) {
  const nextPending = db.super8Matches
    .filter(m => m.super8Id === eventId && m.id !== currentMatchId && m.status === 'PENDENTE')
    .sort((a, b) => (a.round - b.round) || (a.matchNumber - b.matchNumber))[0];

  if (!nextPending) return null;

  const athleteMap = new Map(db.athletes.map(a => [a.id, a]));
  const a1 = athleteMap.get(nextPending.teamA.player1Id)?.name || nextPending.teamA.player1Name || 'Atleta 1';
  const a2 = athleteMap.get(nextPending.teamA.player2Id)?.name || nextPending.teamA.player2Name || 'Atleta 2';
  const b1 = athleteMap.get(nextPending.teamB.player1Id)?.name || nextPending.teamB.player1Name || 'Atleta 3';
  const b2 = athleteMap.get(nextPending.teamB.player2Id)?.name || nextPending.teamB.player2Name || 'Atleta 4';

  return {
    id: nextPending.id,
    stage: nextPending.stage,
    round: nextPending.round,
    matchNumber: nextPending.matchNumber,
    duo1Name: `${a1} + ${a2}`,
    duo2Name: `${b1} + ${b2}`,
    court: freedCourt,
    time: nextPending.time
  };
}

export const super8ManagerService = {
  getAll(arenaId?: string) {
    const db = readDB();
    let events = db.super8Events || [];

    if (arenaId) {
      events = events.filter(e => e.arenaId === arenaId || e.organizerId === arenaId);
    }

    return events
      .map(ev => {
        const arena = db.arenas.find(a => a.id === ev.arenaId);
        const venue = ev.venueId ? db.venues.find(v => v.id === ev.venueId) : undefined;
        const matches = (db.super8Matches || []).filter(m => m.super8Id === ev.id);
        const playedMatchesCount = matches.filter(m => m.status === 'FINALIZADA' || m.status === 'WO').length;
        const pendingMatchesCount = matches.filter(m => m.status === 'PENDENTE').length;

        return {
          ...ev,
          arenaName: arena?.name || 'Organizador',
          venueName: venue?.name || ev.venueName || '',
          maxCourts: venue?.courtsCount || ev.courtsUsed || 4,
          athletesCount: ev.athleteIds?.length || 0,
          matchesCount: matches.length,
          playedMatchesCount,
          pendingMatchesCount
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById(id: string) {
    const db = readDB();
    const ev = (db.super8Events || []).find(e => e.id === id);
    if (!ev) return null;

    const arena = db.arenas.find(a => a.id === ev.arenaId);
    const venue = ev.venueId ? db.venues.find(v => v.id === ev.venueId) : undefined;
    const athleteMap = new Map(db.athletes.map(a => [a.id, a]));

    const athletes = (ev.athleteIds || [])
      .map(aId => athleteMap.get(aId))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    const matches = (db.super8Matches || [])
      .filter(m => m.super8Id === ev.id)
      .sort((a, b) => (a.round - b.round) || (a.matchNumber - b.matchNumber))
      .map(m => {
        const a1Name = athleteMap.get(m.teamA.player1Id)?.name || m.teamA.player1Name || 'Atleta 1';
        const a2Name = athleteMap.get(m.teamA.player2Id)?.name || m.teamA.player2Name || 'Atleta 2';
        const b1Name = athleteMap.get(m.teamB.player1Id)?.name || m.teamB.player1Name || 'Atleta 3';
        const b2Name = athleteMap.get(m.teamB.player2Id)?.name || m.teamB.player2Name || 'Atleta 4';

        return {
          ...m,
          teamA: {
            ...m.teamA,
            player1Name: a1Name,
            player2Name: a2Name
          },
          teamB: {
            ...m.teamB,
            player1Name: b1Name,
            player2Name: b2Name
          },
          teamAName: `${a1Name} + ${a2Name}`,
          teamBName: `${b1Name} + ${b2Name}`
        };
      });

    const standings = calculateSuper8Standings(matches, athletes, ev.games || 4);

    return {
      event: {
        ...ev,
        arenaName: arena?.name || 'Organizador',
        venueName: venue?.name || ev.venueName || '',
        maxCourts: venue?.courtsCount || ev.courtsUsed || 4
      },
      athletes,
      matches,
      standings
    };
  },

  create(data: CreateSuper8Input): { success: boolean; data?: Super8Event; error?: string; code?: number } {
    const db = readDB();

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'O nome do Super 8 deve conter pelo menos 3 caracteres.', code: 400 };
    }
    const seriesName = (data.seriesName || data.name).trim();
    if (seriesName.length < 3) {
      return { success: false, error: 'O nome da série/edição deve conter pelo menos 3 caracteres.', code: 400 };
    }
    if (!data.arenaId) {
      return { success: false, error: 'O organizador responsável é obrigatório.', code: 400 };
    }
    if (!db.arenas.some(a => a.id === data.arenaId)) {
      return { success: false, error: 'Organizador não encontrado.', code: 404 };
    }
    if (!data.startDate || !data.endDate) {
      return { success: false, error: 'As datas de início e término são obrigatórias.', code: 400 };
    }
    if (new Date(data.endDate) < new Date(data.startDate)) {
      return { success: false, error: 'A data de término não pode ser anterior à data de início.', code: 400 };
    }

    const games = data.games !== undefined ? Number(data.games) : 4;
    if (games !== 4 && games !== 6) {
      return { success: false, error: 'A quantidade de games do Super 8 deve ser 4 ou 6.', code: 400 };
    }
    const thaiBreak = games === 6 ? Boolean(data.thaiBreak) : false;

    let venueId = data.venueId;
    let venueName: string | undefined;
    let courtsUsed = data.courtsUsed !== undefined ? Number(data.courtsUsed) : undefined;

    if (venueId && db.venues) {
      const v = db.venues.find(ven => ven.id === venueId);
      if (v) {
        venueName = v.name;
        if (!courtsUsed || courtsUsed < 1) {
          courtsUsed = v.courtsCount || 2;
        } else if (courtsUsed > v.courtsCount) {
          courtsUsed = v.courtsCount;
        }
      }
    } else if (db.venues && db.venues.length > 0) {
      const defaultV = db.venues[0];
      venueId = defaultV.id;
      venueName = defaultV.name;
      courtsUsed = courtsUsed ? Math.min(Math.max(1, courtsUsed), defaultV.courtsCount) : (defaultV.courtsCount || 2);
    }

    const initialAthleteIds: string[] = [];
    if (Array.isArray(data.athleteIds)) {
      const seen = new Set<string>();
      for (const aId of data.athleteIds) {
        if (!seen.has(aId)) {
          const ath = db.athletes.find(a => a.id === aId && a.status === 'ATIVO');
          if (!ath) {
            return { success: false, error: 'Um dos atletas selecionados está inativo ou não foi encontrado.', code: 400 };
          }
          const assoc = db.arenaAthletes.find(aa => aa.arenaId === data.arenaId && aa.athleteId === aId);
          if (assoc && assoc.status === 'BLOQUEADO') {
            return { success: false, error: `O atleta ${ath.name} está bloqueado neste organizador.`, code: 400 };
          }
          seen.add(aId);
          initialAthleteIds.push(aId);
        }
      }
      if (initialAthleteIds.length > 8) {
        return { success: false, error: 'O Super 8 permite no máximo 8 atletas inscritos.', code: 400 };
      }
    }

    const now = new Date().toISOString();
    const level = data.level || 'OPEN';
    const newEvent: Super8Event = {
      id: 's8-' + Math.random().toString(36).substring(2, 11),
      name: data.name.trim(),
      seriesName,
      arenaId: data.arenaId,
      organizerId: data.arenaId,
      venueId,
      venueName,
      courtsUsed: courtsUsed && courtsUsed >= 1 ? Math.floor(courtsUsed) : 2,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || 'INSCRICOES_ABERTAS',
      categoryName: data.categoryName?.trim() || `Super 8 ${level}`,
      level,
      price: data.price !== undefined && Number(data.price) >= 0 ? Number(data.price) : 0,
      games,
      thaiBreak,
      athleteIds: initialAthleteIds,
      createdAt: now,
      updatedAt: now
    };

    db.super8Events.push(newEvent);
    writeDB(db);

    return { success: true, data: newEvent };
  },

  update(id: string, data: Partial<CreateSuper8Input>): { success: boolean; data?: Super8Event; error?: string; code?: number } {
    const db = readDB();
    const index = (db.super8Events || []).findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false, error: 'Super 8 não encontrado.', code: 404 };
    }

    const current = db.super8Events[index];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length < 3) {
        return { success: false, error: 'O nome do Super 8 deve conter pelo menos 3 caracteres.', code: 400 };
      }
      current.name = data.name.trim();
    }
    if (data.seriesName !== undefined) {
      if (!data.seriesName || data.seriesName.trim().length < 3) {
        return { success: false, error: 'A série deve conter pelo menos 3 caracteres.', code: 400 };
      }
      current.seriesName = data.seriesName.trim();
    }
    if (data.arenaId !== undefined) {
      if (!db.arenas.some(a => a.id === data.arenaId)) {
        return { success: false, error: 'Organizador especificado não encontrado.', code: 404 };
      }
      current.arenaId = data.arenaId;
      current.organizerId = data.arenaId;
    }
    if (data.venueId !== undefined) {
      current.venueId = data.venueId;
      const v = db.venues.find(ven => ven.id === data.venueId);
      if (v) {
        current.venueName = v.name;
        if (current.courtsUsed > v.courtsCount) {
          current.courtsUsed = v.courtsCount;
        }
      }
    }
    if (data.courtsUsed !== undefined) {
      const c = Math.floor(Number(data.courtsUsed));
      if (!isNaN(c) && c >= 1) {
        const v = current.venueId ? db.venues.find(ven => ven.id === current.venueId) : undefined;
        current.courtsUsed = v ? Math.min(c, v.courtsCount) : c;
      }
    }

    const start = data.startDate !== undefined ? data.startDate : current.startDate;
    const end = data.endDate !== undefined ? data.endDate : current.endDate;
    if (new Date(end) < new Date(start)) {
      return { success: false, error: 'A data de término não pode ser anterior à data de início.', code: 400 };
    }
    if (data.startDate !== undefined) current.startDate = data.startDate;
    if (data.endDate !== undefined) current.endDate = data.endDate;
    if (data.status !== undefined) current.status = data.status;
    if (data.categoryName !== undefined) current.categoryName = data.categoryName.trim() || current.categoryName;
    if (data.level !== undefined) current.level = data.level;
    if (data.price !== undefined) {
      const p = Number(data.price);
      if (isNaN(p) || p < 0) return { success: false, error: 'O valor da inscrição não pode ser negativo.', code: 400 };
      current.price = p;
    }

    let scoringChanged = false;
    if (data.games !== undefined) {
      const g = Number(data.games);
      if (g !== 4 && g !== 6) {
        return { success: false, error: 'A quantidade de games deve ser 4 ou 6.', code: 400 };
      }
      current.games = g;
      if (g === 4) current.thaiBreak = false;
      scoringChanged = true;
    }
    if (data.thaiBreak !== undefined) {
      current.thaiBreak = current.games === 6 ? Boolean(data.thaiBreak) : false;
      scoringChanged = true;
    }

    if (scoringChanged) {
      db.super8Matches.forEach(m => {
        if (m.super8Id === id && m.status === 'PENDENTE') {
          m.games = current.games;
          m.thaiBreak = current.thaiBreak;
          m.updatedAt = new Date().toISOString();
        }
      });
    }

    if (data.athleteIds !== undefined) {
      const res = this.validateAthleteRoster(db, id, current.arenaId, data.athleteIds);
      if (!res.success) {
        return { success: false, error: res.error, code: res.code };
      }
      current.athleteIds = res.athleteIds!;
      if (current.athleteIds.length !== 8) {
        db.super8Matches = db.super8Matches.filter(m => !(m.super8Id === id && m.status === 'PENDENTE'));
      }
    }

    current.updatedAt = new Date().toISOString();
    writeDB(db);
    return { success: true, data: current };
  },

  delete(id: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const index = (db.super8Events || []).findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false, error: 'Super 8 não encontrado.', code: 404 };
    }

    db.super8Events.splice(index, 1);
    db.super8Matches = (db.super8Matches || []).filter(m => m.super8Id !== id);
    writeDB(db);
    return { success: true };
  },

  validateAthleteRoster(db: ReturnType<typeof readDB>, eventId: string, arenaId: string, athleteIds: string[]): { success: boolean; athleteIds?: string[]; error?: string; code?: number } {
    const hasPlayed = (db.super8Matches || []).some(
      m => m.super8Id === eventId && (m.status === 'FINALIZADA' || m.status === 'WO')
    );
    if (hasPlayed) {
      return {
        success: false,
        error: 'Não é possível alterar a lista de participantes após o registro de resultados no Super 8.',
        code: 400
      };
    }

    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const aId of athleteIds) {
      if (seen.has(aId)) {
        return { success: false, error: 'Atleta duplicado na lista de participantes.', code: 400 };
      }
      const ath = db.athletes.find(a => a.id === aId && a.status === 'ATIVO');
      if (!ath) {
        return { success: false, error: 'Atleta não encontrado ou inativo no sistema.', code: 400 };
      }
      const assoc = db.arenaAthletes.find(aa => aa.arenaId === arenaId && aa.athleteId === aId);
      if (assoc && assoc.status === 'BLOQUEADO') {
        return { success: false, error: `O atleta ${ath.name} está bloqueado neste organizador.`, code: 400 };
      }
      seen.add(aId);
      deduped.push(aId);
    }

    if (deduped.length > 8) {
      return { success: false, error: 'O Super 8 aceita exatamente no máximo 8 participantes.', code: 400 };
    }

    return { success: true, athleteIds: deduped };
  },

  setAthletes(id: string, athleteIds: string[]) {
    const db = readDB();
    const index = (db.super8Events || []).findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false, error: 'Super 8 não encontrado.', code: 404 };
    }
    const ev = db.super8Events[index];
    const res = this.validateAthleteRoster(db, id, ev.arenaId, athleteIds);
    if (!res.success) {
      return { success: false, error: res.error, code: res.code };
    }
    ev.athleteIds = res.athleteIds!;
    if (ev.athleteIds.length !== 8) {
      db.super8Matches = db.super8Matches.filter(m => !(m.super8Id === id && m.status === 'PENDENTE'));
    }
    ev.updatedAt = new Date().toISOString();
    writeDB(db);
    return { success: true, data: ev };
  },

  addAthlete(id: string, athleteId: string) {
    const db = readDB();
    const ev = (db.super8Events || []).find(e => e.id === id);
    if (!ev) {
      return { success: false, error: 'Super 8 não encontrado.', code: 404 };
    }
    if (ev.athleteIds.includes(athleteId)) {
      return { success: false, error: 'Este atleta já está inscrito neste Super 8.', code: 409 };
    }
    return this.setAthletes(id, [...ev.athleteIds, athleteId]);
  },

  removeAthlete(id: string, athleteId: string) {
    const db = readDB();
    const ev = (db.super8Events || []).find(e => e.id === id);
    if (!ev) {
      return { success: false, error: 'Super 8 não encontrado.', code: 404 };
    }
    return this.setAthletes(id, ev.athleteIds.filter(a => a !== athleteId));
  },

  generateMatches(id: string, date?: string, courtPrefix?: string): { success: boolean; error?: string; count?: number; data?: Super8Match[]; code?: number } {
    const db = readDB();
    const evIndex = (db.super8Events || []).findIndex(e => e.id === id);
    if (evIndex === -1) {
      return { success: false, error: 'Super 8 não encontrado.', code: 404 };
    }

    const ev = db.super8Events[evIndex];
    const athleteIds = ev.athleteIds || [];

    if (athleteIds.length !== 8) {
      return {
        success: false,
        error: `O formato Super 8 exige exatamente 8 atletas inscritos. Atualmente existem ${athleteIds.length} inscritos.`,
        code: 400
      };
    }

    const existingPlayed = (db.super8Matches || []).some(
      m => m.super8Id === id && (m.status === 'FINALIZADA' || m.status === 'WO')
    );
    if (existingPlayed) {
      return {
        success: false,
        error: 'Este Super 8 já possui partidas com resultado registrado. Não é possível regerar as rodadas.',
        code: 400
      };
    }

    const availableCourts = ev.courtsUsed && ev.courtsUsed >= 1 ? ev.courtsUsed : 2;
    const prefix = courtPrefix && !courtPrefix.includes('Quadra') ? courtPrefix.trim() : 'Quadra';
    const matchDate = date || ev.startDate || new Date().toISOString().split('T')[0];
    const athleteMap = new Map(db.athletes.map(a => [a.id, a]));

    const draftMatches: Omit<Super8Match, 'id' | 'createdAt' | 'updatedAt'>[] = SUPER_8_ROUNDS_TEMPLATE.map(tpl => {
      const p1Id = athleteIds[tpl.teamA[0] - 1];
      const p2Id = athleteIds[tpl.teamA[1] - 1];
      const p3Id = athleteIds[tpl.teamB[0] - 1];
      const p4Id = athleteIds[tpl.teamB[1] - 1];

      const matchInRound = tpl.matchNumber % 2 === 1 ? 1 : 2;
      const courtNumber = ((matchInRound - 1) % availableCourts) + 1;
      const courtName = `${prefix} ${courtNumber}`;

      const startHour = 14;
      const totalMinutes = (tpl.round - 1) * 40;
      const hour = startHour + Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const matchTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        super8Id: id,
        stage: `Rodada ${tpl.round}`,
        groupName: 'Super 8',
        round: tpl.round,
        matchNumber: tpl.matchNumber,
        games: ev.games || 4,
        thaiBreak: Boolean(ev.thaiBreak),
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
      };
    });

    const valResult = validateSuper8Schedule(draftMatches, athleteIds);
    if (!valResult.valid) {
      return {
        success: false,
        error: `Falha na validação das regras do Super 8: ${valResult.error}`,
        code: 400
      };
    }

    db.super8Matches = (db.super8Matches || []).filter(m => !(m.super8Id === id && m.status === 'PENDENTE'));

    const now = new Date().toISOString();
    const created: Super8Match[] = draftMatches.map(m => ({
      ...m,
      id: 'mat-s8-' + Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now
    }));

    db.super8Matches.push(...created);
    if (ev.status === 'INSCRICOES_ABERTAS') {
      db.super8Events[evIndex].status = 'EM_ANDAMENTO';
      db.super8Events[evIndex].updatedAt = now;
    }

    writeDB(db);
    return { success: true, count: created.length, data: created };
  },

  updateMatchResult(
    matchId: string,
    payload: { score?: string; scoreA?: number; scoreB?: number; winnerTeam?: 'TEAM_A' | 'TEAM_B'; tieBreaker?: string }
  ): {
    success: boolean;
    error?: string;
    tieBreaker?: string;
    freedCourt?: string;
    nextMatchSuggestion?: ReturnType<typeof buildNextMatchSuggestion>;
    standings?: Super8AthleteStanding[];
    code?: number;
  } {
    const db = readDB();
    const index = (db.super8Matches || []).findIndex(m => m.id === matchId);
    if (index === -1) {
      return { success: false, error: 'Partida do Super 8 não encontrada.', code: 404 };
    }

    const match = db.super8Matches[index];
    const ev = db.super8Events.find(e => e.id === match.super8Id);
    let sA = payload.scoreA;
    let sB = payload.scoreB;

    if ((sA === undefined || sB === undefined) && payload.score) {
      const parts = payload.score.match(/(\d+)\s*[xX/-]\s*(\d+)/);
      if (parts) {
        sA = parseInt(parts[1], 10);
        sB = parseInt(parts[2], 10);
      }
    }

    const matchGames = match.games !== undefined ? match.games : (ev?.games || 4);
    const matchThaiBreak = match.thaiBreak !== undefined ? match.thaiBreak : Boolean(ev?.thaiBreak);

    if (sA === undefined || sB === undefined) {
      return { success: false, error: 'Informe o placar das duas duplas.', code: 400 };
    }

    const validation = validateSuper8Score(sA, sB, matchGames, matchThaiBreak);
    if (!validation.valid) {
      return { success: false, error: validation.error, code: 400 };
    }

    db.super8Matches[index].scoreA = sA;
    db.super8Matches[index].scoreB = sB;
    db.super8Matches[index].score = `${sA} x ${sB}`;

    const eventMatches = db.super8Matches.filter(m => m.super8Id === match.super8Id);

    if (sA === sB && validation.isTie) {
      if (payload.tieBreaker) {
        db.super8Matches[index].winnerTeam = payload.winnerTeam || 'TEAM_A';
        db.super8Matches[index].tieBreaker = payload.tieBreaker;
      } else {
        const ids = [
          match.teamA.player1Id,
          match.teamA.player2Id,
          match.teamB.player1Id,
          match.teamB.player2Id
        ];
        const tieResult = resolveSuper8Tie(
          db.super8Matches[index],
          eventMatches,
          db.athletes.filter(a => ids.includes(a.id))
        );
        if (tieResult) {
          db.super8Matches[index].winnerTeam = tieResult.winnerTeam;
          db.super8Matches[index].tieBreaker = tieResult.reason;
        } else {
          db.super8Matches[index].winnerTeam = payload.winnerTeam || 'TEAM_A';
        }
      }
    } else {
      db.super8Matches[index].winnerTeam = sA > sB ? 'TEAM_A' : 'TEAM_B';
      db.super8Matches[index].tieBreaker = undefined;
    }

    db.super8Matches[index].status = 'FINALIZADA';
    db.super8Matches[index].updatedAt = new Date().toISOString();
    const freedCourt = db.super8Matches[index].court;
    writeDB(db);

    const standings = this.getStandings(match.super8Id);
    const nextMatchSuggestion = buildNextMatchSuggestion(db, match.super8Id, matchId, freedCourt);

    return {
      success: true,
      tieBreaker: db.super8Matches[index].tieBreaker,
      freedCourt,
      nextMatchSuggestion,
      standings
    };
  },

  toggleMatchWO(
    matchId: string,
    winnerTeam: 'TEAM_A' | 'TEAM_B'
  ): {
    success: boolean;
    error?: string;
    freedCourt?: string;
    nextMatchSuggestion?: ReturnType<typeof buildNextMatchSuggestion>;
    standings?: Super8AthleteStanding[];
    code?: number;
  } {
    const db = readDB();
    const index = (db.super8Matches || []).findIndex(m => m.id === matchId);
    if (index === -1) {
      return { success: false, error: 'Partida do Super 8 não encontrada.', code: 404 };
    }

    const match = db.super8Matches[index];
    const ev = db.super8Events.find(e => e.id === match.super8Id);
    const woGames = match.games !== undefined ? match.games : (ev?.games || 4);

    db.super8Matches[index].score = winnerTeam === 'TEAM_A' ? `W.O. (${woGames}x0)` : `W.O. (0x${woGames})`;
    db.super8Matches[index].scoreA = winnerTeam === 'TEAM_A' ? woGames : 0;
    db.super8Matches[index].scoreB = winnerTeam === 'TEAM_A' ? 0 : woGames;
    db.super8Matches[index].winnerTeam = winnerTeam;
    db.super8Matches[index].tieBreaker = undefined;
    db.super8Matches[index].status = 'WO';
    db.super8Matches[index].updatedAt = new Date().toISOString();
    const freedCourt = db.super8Matches[index].court;
    writeDB(db);

    const standings = this.getStandings(match.super8Id);
    const nextMatchSuggestion = buildNextMatchSuggestion(db, match.super8Id, matchId, freedCourt);

    return {
      success: true,
      freedCourt,
      nextMatchSuggestion,
      standings
    };
  },

  resolveTiePreview(matchId: string, scoreA: number, scoreB: number) {
    const db = readDB();
    const match = (db.super8Matches || []).find(m => m.id === matchId);
    if (!match) {
      return { success: false, error: 'Partida do Super 8 não encontrada.', code: 404 };
    }

    const ids = [
      match.teamA.player1Id,
      match.teamA.player2Id,
      match.teamB.player1Id,
      match.teamB.player2Id
    ];
    const eventMatches = db.super8Matches.filter(m => m.super8Id === match.super8Id);
    const athletes = db.athletes.filter(a => ids.includes(a.id));

    const result = resolveSuper8Tie({ ...match, scoreA, scoreB }, eventMatches, athletes);
    if (!result) {
      return { success: false, error: 'Não foi possível resolver o empate.', code: 400 };
    }

    return {
      success: true,
      winnerTeam: result.winnerTeam,
      tieBreaker: result.reason
    };
  },

  updateMatchCourt(matchId: string, court: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const index = (db.super8Matches || []).findIndex(m => m.id === matchId);
    if (index === -1) {
      return { success: false, error: 'Partida do Super 8 não encontrada.', code: 404 };
    }
    if (!court || !court.trim()) {
      return { success: false, error: 'Nome da quadra inválido.', code: 400 };
    }

    db.super8Matches[index].court = court.trim();
    db.super8Matches[index].updatedAt = new Date().toISOString();
    writeDB(db);
    return { success: true };
  },

  deleteMatch(matchId: string): { success: boolean; error?: string; code?: number } {
    const db = readDB();
    const index = (db.super8Matches || []).findIndex(m => m.id === matchId);
    if (index === -1) {
      return { success: false, error: 'Partida do Super 8 não encontrada.', code: 404 };
    }
    db.super8Matches.splice(index, 1);
    writeDB(db);
    return { success: true };
  },

  getStandings(super8Id: string): Super8AthleteStanding[] {
    const db = readDB();
    const ev = (db.super8Events || []).find(e => e.id === super8Id);
    if (!ev) return [];

    const matches = (db.super8Matches || []).filter(m => m.super8Id === super8Id);
    const athleteMap = new Map(db.athletes.map(a => [a.id, a]));
    const athletes = (ev.athleteIds || [])
      .map(id => athleteMap.get(id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    return calculateSuper8Standings(matches, athletes, ev.games || 4);
  }
};
