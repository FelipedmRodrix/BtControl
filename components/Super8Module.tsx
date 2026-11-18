'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  Users,
  Calendar,
  Award,
  Trophy,
  Check,
  X,
  Clock,
  MapPin,
  Shield,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import type { Super8AthleteStanding } from '@/lib/services/super8Service';

interface SessionInfo {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
  arenaId: string | null;
  name: string;
}

interface OrganizerOption {
  id: string;
  name: string;
  status: 'ATIVA' | 'INATIVA';
}

interface VenueOption {
  id: string;
  name: string;
  courtsCount: number;
  status: 'ATIVA' | 'INATIVA';
}

interface AthleteOption {
  id: string;
  name: string;
  cpf: string;
  email: string;
  gender: 'M' | 'F' | 'MISTO';
  status: 'ATIVO' | 'INATIVO';
}

export interface Super8EventItem {
  id: string;
  name: string;
  seriesName: string;
  arenaId: string;
  arenaName?: string;
  venueId?: string;
  venueName?: string;
  courtsUsed: number;
  maxCourts?: number;
  startDate: string;
  endDate: string;
  status: 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO';
  categoryName: string;
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  games: number;
  thaiBreak: boolean;
  athleteIds: string[];
  athletesCount?: number;
  matchesCount?: number;
  playedMatchesCount?: number;
  pendingMatchesCount?: number;
  createdAt: string;
}

export interface Super8MatchItem {
  id: string;
  super8Id: string;
  stage: string;
  groupName?: string;
  round: number;
  matchNumber: number;
  teamA: {
    player1Id: string;
    player2Id: string;
    player1Name?: string;
    player2Name?: string;
  };
  teamB: {
    player1Id: string;
    player2Id: string;
    player1Name?: string;
    player2Name?: string;
  };
  teamAName?: string;
  teamBName?: string;
  scoreA?: number;
  scoreB?: number;
  score?: string;
  winnerTeam?: 'TEAM_A' | 'TEAM_B';
  date: string;
  time: string;
  court: string;
  status: 'PENDENTE' | 'FINALIZADA' | 'WO';
  games: number;
  thaiBreak: boolean;
  tieBreaker?: string;
}

interface Super8ModuleProps {
  session: SessionInfo;
  arenas: OrganizerOption[];
  venues: VenueOption[];
  athletes: AthleteOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  requestConfirmation: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  }) => void;
  onDataChanged?: () => void;
}

const LEVELS: Array<'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN'> = [
  'OPEN',
  'A',
  'B',
  'C',
  'D',
  'INICIANTE',
  'PRINCIPIANTE'
];

export function Super8Module({
  session,
  arenas,
  venues,
  athletes,
  canCreate,
  canEdit,
  canDelete,
  showSuccess,
  showError,
  requestConfirmation,
  onDataChanged
}: Super8ModuleProps) {
  const [events, setEvents] = useState<Super8EventItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArena, setFilterArena] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO'>('TODOS');

  // Detail state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<Super8EventItem | null>(null);
  const [detailAthletes, setDetailAthletes] = useState<AthleteOption[]>([]);
  const [detailMatches, setDetailMatches] = useState<Super8MatchItem[]>([]);
  const [detailStandings, setDetailStandings] = useState<Super8AthleteStanding[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [detailTab, setDetailTab] = useState<'matches' | 'athletes' | 'standings'>('matches');
  const [roundFilter, setRoundFilter] = useState<number | 'ALL'>('ALL');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'ALL' | 'PENDENTE' | 'PLAYED'>('ALL');
  const [athleteSearch, setAthleteSearch] = useState('');

  // Generate rounds state
  const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0]);
  const [genCourtPrefix, setGenCourtPrefix] = useState('Quadra');
  const [generating, setGenerating] = useState(false);

  // Freed court suggestion banner
  const [freedCourtNotice, setFreedCourtNotice] = useState<{
    freedCourt: string;
    nextMatchSuggestion: {
      id: string;
      stage: string;
      round: number;
      matchNumber: number;
      duo1Name: string;
      duo2Name: string;
      court: string;
      time: string;
    } | null;
  } | null>(null);

  // Create / Edit Event Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    seriesName: '',
    arenaId: session.role === 'ARENA_ADMIN' && session.arenaId ? session.arenaId : '',
    venueId: '',
    courtsUsed: 2,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    categoryName: 'Super 8 Open',
    level: 'OPEN' as Super8EventItem['level'],
    price: 80,
    games: 4,
    thaiBreak: false,
    status: 'INSCRICOES_ABERTAS' as Super8EventItem['status']
  });

  // Score modal
  const [scoreModalMatch, setScoreModalMatch] = useState<Super8MatchItem | null>(null);
  const [scoreAInput, setScoreAInput] = useState('');
  const [scoreBInput, setScoreBInput] = useState('');
  const [tieResolution, setTieResolution] = useState<{ winnerTeam: 'TEAM_A' | 'TEAM_B'; tieBreaker: string } | null>(null);
  const [resolvingTie, setResolvingTie] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  // W.O. modal
  const [woModalMatch, setWoModalMatch] = useState<Super8MatchItem | null>(null);
  const [woWinnerTeam, setWoWinnerTeam] = useState<'TEAM_A' | 'TEAM_B'>('TEAM_A');
  const [savingWO, setSavingWO] = useState(false);

  // Court edit modal
  const [courtModalMatch, setCourtModalMatch] = useState<Super8MatchItem | null>(null);
  const [courtInput, setCourtInput] = useState('');
  const [savingCourt, setSavingCourt] = useState(false);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-user-id': session.id,
      'x-user-role': session.role
    }),
    [session.id, session.role]
  );

  const fetchEvents = useCallback(async () => {
    setLoadingList(true);
    try {
      const qs = session.role === 'ARENA_ADMIN' && session.arenaId ? `?arenaId=${encodeURIComponent(session.arenaId)}` : '';
      const res = await fetch(`/api/super8${qs}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao carregar eventos Super 8.');
        setEvents([]);
      } else {
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch {
      showError('Falha de conexão ao carregar módulo Super 8.');
    } finally {
      setLoadingList(false);
    }
  }, [authHeaders, session.arenaId, session.role, showError]);

  const fetchEventDetail = useCallback(
    async (id: string) => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/super8/${id}`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) {
          showError(data.error || 'Erro ao carregar detalhes do Super 8.');
          return;
        }
        setDetailEvent(data.event);
        setDetailAthletes(data.athletes || []);
        setDetailMatches(data.matches || []);
        setDetailStandings(data.standings || []);
        if (data.event?.startDate) {
          setGenDate(data.event.startDate);
        }
      } catch {
        showError('Falha ao carregar dados do Super 8.');
      } finally {
        setLoadingDetail(false);
      }
    },
    [authHeaders, showError]
  );

  const selectEventForDetail = (id: string) => {
    setSelectedEventId(id);
    setLoadingDetail(true);
    setFreedCourtNotice(null);
    setRoundFilter('ALL');
    setMatchStatusFilter('ALL');
  };

  useEffect(() => {
    let cancelled = false;
    async function loadInitialEvents() {
      try {
        const qs = session.role === 'ARENA_ADMIN' && session.arenaId ? `?arenaId=${encodeURIComponent(session.arenaId)}` : '';
        const res = await fetch(`/api/super8${qs}`, { headers: authHeaders() });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          showError(data.error || 'Erro ao carregar eventos Super 8.');
          setEvents([]);
        } else {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          showError('Falha de conexão ao carregar módulo Super 8.');
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }
    loadInitialEvents();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, session.arenaId, session.role, showError]);

  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function loadDetail() {
      try {
        const res = await fetch(`/api/super8/${selectedEventId}`, { headers: authHeaders() });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          showError(data.error || 'Erro ao carregar detalhes do Super 8.');
          return;
        }
        setDetailEvent(data.event);
        setDetailAthletes(data.athletes || []);
        setDetailMatches(data.matches || []);
        setDetailStandings(data.standings || []);
        if (data.event?.startDate) {
          setGenDate(data.event.startDate);
        }
      } catch {
        if (!cancelled) {
          showError('Falha ao carregar dados do Super 8.');
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    }
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId, authHeaders, showError]);

  const openCreateModal = () => {
    const defaultArenaId =
      session.role === 'ARENA_ADMIN' && session.arenaId
        ? session.arenaId
        : arenas.find(a => a.status === 'ATIVA')?.id || arenas[0]?.id || '';
    const defaultVenue = venues.find(v => v.status === 'ATIVA') || venues[0];
    const today = new Date().toISOString().split('T')[0];

    setEditingEventId(null);
    setEventForm({
      name: '',
      seriesName: '',
      arenaId: defaultArenaId,
      venueId: defaultVenue?.id || '',
      courtsUsed: defaultVenue?.courtsCount || 2,
      startDate: today,
      endDate: today,
      categoryName: 'Super 8 Open',
      level: 'OPEN',
      price: 80,
      games: 4,
      thaiBreak: false,
      status: 'INSCRICOES_ABERTAS'
    });
    setIsEventModalOpen(true);
  };

  const openEditModal = (ev: Super8EventItem) => {
    setEditingEventId(ev.id);
    setEventForm({
      name: ev.name,
      seriesName: ev.seriesName,
      arenaId: ev.arenaId,
      venueId: ev.venueId || '',
      courtsUsed: ev.courtsUsed || 2,
      startDate: ev.startDate,
      endDate: ev.endDate,
      categoryName: ev.categoryName || `Super 8 ${ev.level}`,
      level: ev.level || 'OPEN',
      price: ev.price ?? 0,
      games: ev.games || 4,
      thaiBreak: Boolean(ev.thaiBreak),
      status: ev.status
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const payload = {
        ...eventForm,
        seriesName: eventForm.seriesName.trim() || eventForm.name.trim(),
        thaiBreak: eventForm.games === 6 ? eventForm.thaiBreak : false
      };

      const url = editingEventId ? `/api/super8/${editingEventId}` : '/api/super8';
      const method = editingEventId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao salvar Super 8.');
        return;
      }

      showSuccess(editingEventId ? 'Super 8 atualizado com sucesso.' : 'Super 8 criado com sucesso.');
      setIsEventModalOpen(false);
      await fetchEvents();
      if (selectedEventId && editingEventId === selectedEventId) {
        await fetchEventDetail(selectedEventId);
      }
      onDataChanged?.();
    } catch {
      showError('Falha ao salvar Super 8.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = (ev: Super8EventItem) => {
    requestConfirmation({
      title: 'Excluir Super 8',
      message: `Deseja excluir "${ev.name}" e todas as suas partidas e resultados? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/super8/${ev.id}`, {
            method: 'DELETE',
            headers: authHeaders()
          });
          const data = await res.json();
          if (!res.ok) {
            showError(data.error || 'Erro ao excluir Super 8.');
            return;
          }
          showSuccess('Super 8 excluído com sucesso.');
          if (selectedEventId === ev.id) {
            setSelectedEventId(null);
            setDetailEvent(null);
          }
          await fetchEvents();
          onDataChanged?.();
        } catch {
          showError('Erro de conexão ao excluir Super 8.');
        }
      }
    });
  };

  const handleAddAthlete = async (athleteId: string) => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/super8/${selectedEventId}/athletes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ athleteId })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Não foi possível adicionar o atleta.');
        return;
      }
      showSuccess('Atleta adicionado ao Super 8.');
      await fetchEventDetail(selectedEventId);
      await fetchEvents();
    } catch {
      showError('Erro ao adicionar atleta.');
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/super8/${selectedEventId}/athletes?athleteId=${encodeURIComponent(athleteId)}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Não foi possível remover o atleta.');
        return;
      }
      showSuccess('Atleta removido da lista do Super 8.');
      await fetchEventDetail(selectedEventId);
      await fetchEvents();
    } catch {
      showError('Erro ao remover atleta.');
    }
  };

  const handleGenerateMatches = async () => {
    if (!selectedEventId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/super8/${selectedEventId}/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ date: genDate, courtPrefix: genCourtPrefix })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao gerar rodadas do Super 8.');
        return;
      }
      showSuccess(`7 rodadas (14 partidas) geradas e validadas com sucesso.`);
      setDetailTab('matches');
      await fetchEventDetail(selectedEventId);
      await fetchEvents();
    } catch {
      showError('Erro de conexão ao gerar partidas.');
    } finally {
      setGenerating(false);
    }
  };

  const openScoreModal = (m: Super8MatchItem) => {
    setScoreModalMatch(m);
    setScoreAInput(m.scoreA !== undefined ? String(m.scoreA) : '');
    setScoreBInput(m.scoreB !== undefined ? String(m.scoreB) : '');
    setTieResolution(
      m.tieBreaker && m.winnerTeam
        ? { winnerTeam: m.winnerTeam, tieBreaker: m.tieBreaker }
        : null
    );
  };

  const handleResolveTie = async () => {
    if (!scoreModalMatch) return;
    const sA = Number(scoreAInput);
    const sB = Number(scoreBInput);
    if (isNaN(sA) || isNaN(sB) || sA !== sB) {
      showError('Informe placares empatados antes de aplicar o critério de desempate.');
      return;
    }
    setResolvingTie(true);
    try {
      const res = await fetch(`/api/super8/matches/${scoreModalMatch.id}/resolve-tie`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ scoreA: sA, scoreB: sB })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao calcular desempate.');
        return;
      }
      setTieResolution({ winnerTeam: data.winnerTeam, tieBreaker: data.tieBreaker });
    } catch {
      showError('Erro ao calcular desempate.');
    } finally {
      setResolvingTie(false);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreModalMatch || !selectedEventId) return;

    const sA = parseInt(scoreAInput, 10);
    const sB = parseInt(scoreBInput, 10);
    if (isNaN(sA) || isNaN(sB)) {
      showError('Informe os games das duas duplas.');
      return;
    }

    setSavingScore(true);
    try {
      const res = await fetch(`/api/super8/matches/${scoreModalMatch.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          scoreA: sA,
          scoreB: sB,
          winnerTeam: sA === sB ? tieResolution?.winnerTeam : undefined,
          tieBreaker: sA === sB ? tieResolution?.tieBreaker : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao registrar placar.');
        return;
      }

      showSuccess(
        data.tieBreaker
          ? `Placar registrado com desempate: ${data.tieBreaker}`
          : 'Placar registrado e classificação individual atualizada.'
      );
      setScoreModalMatch(null);
      if (data.freedCourt && data.nextMatchSuggestion) {
        setFreedCourtNotice({
          freedCourt: data.freedCourt,
          nextMatchSuggestion: data.nextMatchSuggestion
        });
      }
      await fetchEventDetail(selectedEventId);
      await fetchEvents();
    } catch {
      showError('Erro de conexão ao registrar placar.');
    } finally {
      setSavingScore(false);
    }
  };

  const handleConfirmWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woModalMatch || !selectedEventId) return;
    setSavingWO(true);
    try {
      const res = await fetch(`/api/super8/matches/${woModalMatch.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isWO: true, winnerTeam: woWinnerTeam })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao registrar W.O.');
        return;
      }
      showSuccess('W.O. registrado e classificação recalculada.');
      setWoModalMatch(null);
      if (data.freedCourt && data.nextMatchSuggestion) {
        setFreedCourtNotice({
          freedCourt: data.freedCourt,
          nextMatchSuggestion: data.nextMatchSuggestion
        });
      }
      await fetchEventDetail(selectedEventId);
      await fetchEvents();
    } catch {
      showError('Erro ao registrar W.O.');
    } finally {
      setSavingWO(false);
    }
  };

  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtModalMatch || !selectedEventId) return;
    setSavingCourt(true);
    try {
      const res = await fetch(`/api/super8/matches/${courtModalMatch.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ court: courtInput })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao atualizar quadra.');
        return;
      }
      showSuccess(`Partida movida para ${courtInput.trim()}.`);
      setCourtModalMatch(null);
      await fetchEventDetail(selectedEventId);
    } catch {
      showError('Erro ao atualizar quadra.');
    } finally {
      setSavingCourt(false);
    }
  };

  const handleToggleEventStatus = async (nextStatus: Super8EventItem['status']) => {
    if (!detailEvent) return;
    const actionLabel = nextStatus === 'FINALIZADO' ? 'Encerrar Super 8' : 'Reabrir Super 8';
    requestConfirmation({
      title: actionLabel,
      message:
        nextStatus === 'FINALIZADO'
          ? `Deseja encerrar "${detailEvent.name}"? O histórico de rodadas e a classificação individual final ficarão preservados.`
          : `Deseja reabrir "${detailEvent.name}" para edição e novos lançamentos?`,
      confirmLabel: nextStatus === 'FINALIZADO' ? 'Encerrar' : 'Reabrir',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/super8/${detailEvent.id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ status: nextStatus })
          });
          const data = await res.json();
          if (!res.ok) {
            showError(data.error || 'Erro ao atualizar status.');
            return;
          }
          showSuccess(
            nextStatus === 'FINALIZADO'
              ? 'Super 8 encerrado com sucesso.'
              : 'Super 8 reaberto para gerenciamento.'
          );
          await fetchEventDetail(detailEvent.id);
          await fetchEvents();
        } catch {
          showError('Erro ao atualizar status do Super 8.');
        }
      }
    });
  };

  const filteredEvents = events.filter(ev => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ev.name.toLowerCase().includes(q) ||
      ev.seriesName.toLowerCase().includes(q) ||
      (ev.arenaName || '').toLowerCase().includes(q) ||
      (ev.venueName || '').toLowerCase().includes(q) ||
      ev.categoryName.toLowerCase().includes(q);
    const matchesArena = !filterArena || ev.arenaId === filterArena;
    const matchesStatus = filterStatus === 'TODOS' || ev.status === filterStatus;
    return matchesSearch && matchesArena && matchesStatus;
  });

  const hasPlayedMatches = detailMatches.some(m => m.status === 'FINALIZADA' || m.status === 'WO');
  const filteredMatches = detailMatches.filter(m => {
    const matchesRound = roundFilter === 'ALL' || m.round === roundFilter;
    const matchesStatus =
      matchStatusFilter === 'ALL' ||
      (matchStatusFilter === 'PENDENTE' && m.status === 'PENDENTE') ||
      (matchStatusFilter === 'PLAYED' && (m.status === 'FINALIZADA' || m.status === 'WO'));
    return matchesRound && matchesStatus;
  });

  const roundsPresent = Array.from(new Set(filteredMatches.map(m => m.round))).sort((a, b) => a - b);

  const selectedVenueForModal = venues.find(v => v.id === eventForm.venueId);
  const maxCourtsForModal = selectedVenueForModal?.courtsCount || 12;

  const availableAthletesToAdd = athletes.filter(a => {
    if (a.status !== 'ATIVO') return false;
    if (detailAthletes.some(da => da.id === a.id)) return false;
    const q = athleteSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.cpf.includes(q.replace(/\D/g, '')) ||
      (a.email || '').toLowerCase().includes(q)
    );
  });

  const formatStatusLabel = (status: Super8EventItem['status']) => {
    if (status === 'INSCRICOES_ABERTAS') return 'Inscrições Abertas';
    if (status === 'EM_ANDAMENTO') return 'Em Andamento';
    return 'Finalizado';
  };

  const formatStatusClass = (status: Super8EventItem['status']) => {
    if (status === 'INSCRICOES_ABERTAS') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'EM_ANDAMENTO') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-700 bg-slate-100 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {!selectedEventId ? (
        <motion.div key="super8-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Super 8</h2>
                  <p className="text-xs text-slate-500">
                    Módulo independente · 8 participantes · 7 rodadas dinâmicas · Classificação individual
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-500 pr-2 tabular-nums">
                <span>
                  <strong className="text-slate-900 font-bold">{events.length}</strong> eventos
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-amber-700 font-bold">
                    {events.filter(e => e.status === 'EM_ANDAMENTO').length}
                  </strong>{' '}
                  em andamento
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-emerald-700 font-bold">
                    {events.filter(e => e.status === 'FINALIZADO').length}
                  </strong>{' '}
                  finalizados
                </span>
              </div>

              {canCreate && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Super 8</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar Super 8 por nome, série, local ou organizador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {session.role === 'SUPER_ADMIN' && (
                <select
                  value={filterArena}
                  onChange={e => setFilterArena(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Todos Organizadores</option>
                  {arenas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { id: 'TODOS', label: 'Todos' },
                    { id: 'INSCRICOES_ABERTAS', label: 'Abertos' },
                    { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
                    { id: 'FINALIZADO', label: 'Finalizados' }
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
                      filterStatus === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {loadingList ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-xs text-slate-500 font-medium">Carregando competições Super 8...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Nenhum Super 8 encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Crie um torneio Super 8 independente com 8 atletas, 7 rodadas dinâmicas de duplas e ranking individual automático.
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-4 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Criar Primeiro Super 8
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEvents.map(ev => {
                const athletesCount = ev.athletesCount ?? ev.athleteIds?.length ?? 0;
                const matchesCount = ev.matchesCount ?? 0;
                const playedCount = ev.playedMatchesCount ?? 0;

                return (
                  <div
                    key={ev.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="truncate">{ev.seriesName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ev.level}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 truncate">{ev.name}</h3>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border whitespace-nowrap shrink-0 ${formatStatusClass(ev.status)}`}
                        >
                          {formatStatusLabel(ev.status)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{ev.arenaName || 'Organizador'}</span>
                          {ev.venueName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{ev.venueName}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {ev.startDate} até {ev.endDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums text-slate-500">
                          <span>{ev.courtsUsed} quadra(s)</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {ev.games || 4} games{ev.games === 6 && ev.thaiBreak ? ' + Thai Break' : ''}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>R$ {Number(ev.price || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs tabular-nums">
                        <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          <span className="text-slate-500 block text-[11px]">Atletas Inscritos</span>
                          <strong className="text-slate-900 font-bold text-sm">
                            {athletesCount} / 8
                          </strong>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          <span className="text-slate-500 block text-[11px]">Partidas Concluídas</span>
                          <strong className="text-slate-900 font-bold text-sm">
                            {playedCount} / {matchesCount || 14}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          selectEventForDetail(ev.id);
                          setDetailTab('matches');
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <span>Gerenciar Super 8</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
                          title="Editar Super 8"
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev)}
                          title="Excluir Super 8"
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div key="super8-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Detail Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventId(null);
                    setDetailEvent(null);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shrink-0 cursor-pointer"
                  title="Voltar para lista do Super 8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Super 8 Independente</span>
                    <span aria-hidden="true">·</span>
                    <span>{detailEvent?.arenaName || 'Organizador'}</span>
                    {detailEvent?.venueName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{detailEvent.venueName}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{detailEvent?.courtsUsed || 2} quadra(s)</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {detailEvent?.games || 4} games
                      {detailEvent?.games === 6 && detailEvent?.thaiBreak ? ' + Thai Break' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <h2 className="text-xl font-bold text-slate-900">{detailEvent?.name || 'Carregando...'}</h2>
                    {detailEvent && (
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${formatStatusClass(detailEvent.status)}`}
                      >
                        {formatStatusLabel(detailEvent.status)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {events.length > 1 && (
                  <select
                    value={selectedEventId}
                    onChange={e => selectEventForDetail(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.level})
                      </option>
                    ))}
                  </select>
                )}

                {canEdit && detailEvent && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditModal(detailEvent)}
                      className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Configurações</span>
                    </button>

                    {detailEvent.status !== 'FINALIZADO' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleEventStatus('FINALIZADO')}
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Encerrar Super 8</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleEventStatus('EM_ANDAMENTO')}
                        className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reabrir Super 8</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDetailTab('matches')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    detailTab === 'matches' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rodadas &amp; Partidas ({detailMatches.length}/14)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('standings')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    detailTab === 'standings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Classificação Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('athletes')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    detailTab === 'athletes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Participantes ({detailAthletes.length}/8)</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 tabular-nums">
                Finalizadas:{' '}
                <strong className="text-slate-900">
                  {detailMatches.filter(m => m.status === 'FINALIZADA' || m.status === 'WO').length}
                </strong>{' '}
                / {detailMatches.length || 14}
              </div>
            </div>
          </div>

          {/* Freed Court Auto Suggestion */}
          {freedCourtNotice && freedCourtNotice.nextMatchSuggestion && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-emerald-950">
                    {freedCourtNotice.freedCourt} liberada automaticamente!
                  </p>
                  <p className="text-emerald-800 mt-0.5">
                    Sugestão para próxima partida:{' '}
                    <strong>
                      {freedCourtNotice.nextMatchSuggestion.stage} · Jogo #{freedCourtNotice.nextMatchSuggestion.matchNumber}
                    </strong>{' '}
                    ({freedCourtNotice.nextMatchSuggestion.duo1Name} vs {freedCourtNotice.nextMatchSuggestion.duo2Name})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canEdit && (
                  <button
                    type="button"
                    onClick={async () => {
                      const next = freedCourtNotice.nextMatchSuggestion!;
                      const res = await fetch(`/api/super8/matches/${next.id}`, {
                        method: 'PATCH',
                        headers: authHeaders(),
                        body: JSON.stringify({ court: freedCourtNotice.freedCourt })
                      });
                      if (res.ok) {
                        showSuccess(`Jogo #${next.matchNumber} direcionado para ${freedCourtNotice.freedCourt}!`);
                        setFreedCourtNotice(null);
                        if (selectedEventId) await fetchEventDetail(selectedEventId);
                      }
                    }}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Chamar na {freedCourtNotice.freedCourt}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFreedCourtNotice(null)}
                  className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {loadingDetail ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-xs text-slate-500">Carregando detalhes do Super 8...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PARTICIPANTES */}
              {detailTab === 'athletes' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Lista Oficial de Participantes ({detailAthletes.length}/8)
                        </h3>
                        <p className="text-xs text-slate-500">
                          A ordem de 1 a 8 define o emparceiramento exato das 7 rodadas do Super 8.
                        </p>
                      </div>
                    </div>

                    {hasPlayedMatches && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          A lista está bloqueada porque já existem partidas finalizadas ou em W.O. neste Super 8.
                        </span>
                      </div>
                    )}

                    {detailAthletes.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                        Nenhum atleta adicionado ainda. Selecione 8 atletas ativos ao lado para formar o Super 8.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {detailAthletes.map((ath, idx) => (
                          <div
                            key={ath.id}
                            className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center tabular-nums shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{ath.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {ath.gender === 'M' ? 'Masculino' : ath.gender === 'F' ? 'Feminino' : 'Misto'}
                                  {ath.email ? ` · ${ath.email}` : ''}
                                </p>
                              </div>
                            </div>

                            {canEdit && !hasPlayedMatches && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAthlete(ath.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Remover atleta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Adicionar Atletas</h3>
                      <p className="text-xs text-slate-500">
                        {detailAthletes.length >= 8
                          ? 'Limite máximo de 8 participantes atingido.'
                          : `Faltam ${8 - detailAthletes.length} atleta(s) para completar o Super 8.`}
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar atleta por nome, CPF ou e-mail..."
                        value={athleteSearch}
                        onChange={e => setAthleteSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                      {availableAthletesToAdd.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          Nenhum atleta disponível encontrado.
                        </div>
                      ) : (
                        availableAthletesToAdd.slice(0, 30).map(ath => (
                          <div key={ath.id} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 truncate">{ath.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{ath.email || ath.cpf}</p>
                            </div>
                            {canEdit && !hasPlayedMatches && detailAthletes.length < 8 && (
                              <button
                                type="button"
                                onClick={() => handleAddAthlete(ath.id)}
                                className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Adicionar</span>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RODADAS & PARTIDAS */}
              {detailTab === 'matches' && (
                <div className="space-y-4">
                  {/* Generator & Filters Toolbar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRoundFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          roundFilter === 'ALL'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Todas Rodadas
                      </button>
                      {[1, 2, 3, 4, 5, 6, 7].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRoundFilter(r)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition cursor-pointer ${
                            roundFilter === r
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          R{r}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={matchStatusFilter}
                        onChange={e => setMatchStatusFilter(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                      >
                        <option value="ALL">Todos Status</option>
                        <option value="PENDENTE">Pendentes</option>
                        <option value="PLAYED">Finalizadas / W.O.</option>
                      </select>

                      {canEdit && !hasPlayedMatches && (
                        <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-slate-200">
                          <input
                            type="date"
                            value={genDate}
                            onChange={e => setGenDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                          />
                          <input
                            type="text"
                            value={genCourtPrefix}
                            onChange={e => setGenCourtPrefix(e.target.value)}
                            placeholder="Quadra"
                            className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                          />
                          <button
                            type="button"
                            disabled={generating || detailAthletes.length !== 8}
                            onClick={handleGenerateMatches}
                            className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              {generating
                                ? 'Gerando...'
                                : detailMatches.length > 0
                                  ? 'Regerar 7 Rodadas'
                                  : 'Gerar 7 Rodadas (14 Jogos)'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {detailMatches.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-base font-bold text-slate-900">Nenhuma rodada gerada ainda</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {detailAthletes.length === 8
                          ? 'Os 8 participantes já estão inscritos. Clique em "Gerar 7 Rodadas (14 Jogos)" para distribuir os parceiros dinâmicos e quadras.'
                          : `Atualmente existem ${detailAthletes.length}/8 participantes inscritos. Complete os 8 atletas na aba Participantes para gerar as 7 rodadas.`}
                      </p>
                      {detailAthletes.length < 8 && (
                        <button
                          type="button"
                          onClick={() => setDetailTab('athletes')}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          Gerenciar Participantes ({detailAthletes.length}/8)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {roundsPresent.map(roundNum => {
                        const roundMatches = filteredMatches.filter(m => m.round === roundNum);
                        return (
                          <div key={roundNum} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">Rodada {roundNum}</span>
                                <span className="text-xs text-slate-500">· {roundMatches.length} partidas</span>
                              </div>
                              <span className="text-xs text-slate-500 tabular-nums">
                                {roundMatches.filter(m => m.status !== 'PENDENTE').length}/{roundMatches.length} concluídas
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {roundMatches.map(m => {
                                const teamAWon = m.winnerTeam === 'TEAM_A';
                                const teamBWon = m.winnerTeam === 'TEAM_B';
                                const isPlayed = m.status === 'FINALIZADA' || m.status === 'WO';

                                return (
                                  <div
                                    key={m.id}
                                    className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                                  >
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 tabular-nums lg:w-52 shrink-0">
                                      <span className="font-bold text-slate-900">Jogo #{m.matchNumber}</span>
                                      <span aria-hidden="true">·</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {m.time}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() => {
                                          if (!canEdit) return;
                                          setCourtModalMatch(m);
                                          setCourtInput(m.court);
                                        }}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1 cursor-pointer disabled:cursor-default"
                                        title="Alterar quadra"
                                      >
                                        <MapPin className="w-3 h-3 text-emerald-600" />
                                        <span>{m.court}</span>
                                      </button>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-11 items-center gap-2">
                                      <div
                                        className={`sm:col-span-5 px-3 py-2 rounded-xl border text-xs ${
                                          teamAWon
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold'
                                            : 'bg-white border-slate-200 text-slate-800'
                                        }`}
                                      >
                                        <span className="text-[10px] text-slate-400 block">Dupla A</span>
                                        <span className="truncate block">
                                          {m.teamA.player1Name} + {m.teamA.player2Name}
                                        </span>
                                      </div>

                                      <div className="sm:col-span-1 text-center">
                                        {isPlayed ? (
                                          <div className="inline-flex flex-col items-center tabular-nums">
                                            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                                              {m.score || `${m.scoreA ?? 0} x ${m.scoreB ?? 0}`}
                                            </span>
                                            {m.status === 'WO' && (
                                              <span className="text-[10px] font-semibold text-amber-700">W.O.</span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-xs font-semibold text-slate-400">vs</span>
                                        )}
                                      </div>

                                      <div
                                        className={`sm:col-span-5 px-3 py-2 rounded-xl border text-xs ${
                                          teamBWon
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold'
                                            : 'bg-white border-slate-200 text-slate-800'
                                        }`}
                                      >
                                        <span className="text-[10px] text-slate-400 block">Dupla B</span>
                                        <span className="truncate block">
                                          {m.teamB.player1Name} + {m.teamB.player2Name}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
                                      {m.tieBreaker && (
                                        <span
                                          className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg max-w-[180px] truncate"
                                          title={m.tieBreaker}
                                        >
                                          Desempate: {m.tieBreaker}
                                        </span>
                                      )}

                                      {canEdit && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => openScoreModal(m)}
                                            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                                              isPlayed
                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            }`}
                                          >
                                            {isPlayed ? 'Editar Placar' : 'Lançar Placar'}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setWoModalMatch(m);
                                              setWoWinnerTeam(m.winnerTeam || 'TEAM_A');
                                            }}
                                            className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                                          >
                                            W.O.
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CLASSIFICAÇÃO INDIVIDUAL */}
              {detailTab === 'standings' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Classificação Individual Super 8</h3>
                      <p className="text-xs text-slate-500">
                        Critérios de desempate: 1º Vitórias (V) · 2º Saldo de Games (SG) · 3º Games Pró (GP) · 4º Menos Games Sofridos (GS)
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg self-start sm:self-auto">
                      Pontuação Individual Automática
                    </span>
                  </div>

                  {detailStandings.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-500">
                      Adicione os atletas participantes para visualizar a classificação individual.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4 w-16">#</th>
                            <th className="py-3 px-4">Atleta</th>
                            <th className="py-3 px-3 text-right">J</th>
                            <th className="py-3 px-3 text-right">V</th>
                            <th className="py-3 px-3 text-right">D</th>
                            <th className="py-3 px-3 text-right">GP</th>
                            <th className="py-3 px-3 text-right">GS</th>
                            <th className="py-3 px-3 text-right">SG</th>
                            <th className="py-3 px-4 text-right">Aprov.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm tabular-nums">
                          {detailStandings.map(st => (
                            <tr
                              key={st.athleteId}
                              className={`hover:bg-slate-50 transition ${st.rank <= 3 ? 'bg-amber-50/20' : ''}`}
                            >
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {st.rank === 1 ? '1º 🥇' : st.rank === 2 ? '2º 🥈' : st.rank === 3 ? '3º 🥉' : `${st.rank}º`}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">{st.athleteName}</td>
                              <td className="py-3 px-3 text-right text-slate-600">{st.played}</td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-700">{st.wins}</td>
                              <td className="py-3 px-3 text-right text-rose-600">{st.losses}</td>
                              <td className="py-3 px-3 text-right text-slate-700">{st.gamesFor}</td>
                              <td className="py-3 px-3 text-right text-slate-500">{st.gamesAgainst}</td>
                              <td
                                className={`py-3 px-3 text-right font-bold ${
                                  st.gameDiff > 0 ? 'text-emerald-700' : st.gameDiff < 0 ? 'text-rose-600' : 'text-slate-600'
                                }`}
                              >
                                {st.gameDiff > 0 ? `+${st.gameDiff}` : st.gameDiff}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-800">{st.winRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* MODAL: CREATE / EDIT SUPER 8 EVENT */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingEventId ? 'Editar Super 8' : 'Novo Super 8'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Competição individual com rodadas dinâmicas e ranking próprio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Super 8</label>
                    <input
                      type="text"
                      required
                      value={eventForm.name}
                      onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                      placeholder="Ex: Super 8 Noturno - Outubro"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Série / Etapa</label>
                    <input
                      type="text"
                      value={eventForm.seriesName}
                      onChange={e => setEventForm({ ...eventForm, seriesName: e.target.value })}
                      placeholder="Ex: Circuito Super 8"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Organizador</label>
                    <select
                      required
                      disabled={session.role === 'ARENA_ADMIN' && Boolean(session.arenaId)}
                      value={eventForm.arenaId}
                      onChange={e => setEventForm({ ...eventForm, arenaId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 disabled:opacity-60"
                    >
                      <option value="">Selecione...</option>
                      {arenas.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Arena Física (Local)</label>
                    <select
                      value={eventForm.venueId}
                      onChange={e => {
                        const v = venues.find(ven => ven.id === e.target.value);
                        setEventForm({
                          ...eventForm,
                          venueId: e.target.value,
                          courtsUsed: v ? v.courtsCount : eventForm.courtsUsed
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                    >
                      <option value="">Selecione...</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.courtsCount} quadras)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quadras Utilizadas (máx {maxCourtsForModal})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxCourtsForModal}
                      value={eventForm.courtsUsed}
                      onChange={e =>
                        setEventForm({
                          ...eventForm,
                          courtsUsed: Math.max(1, Math.min(maxCourtsForModal, Number(e.target.value) || 1))
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data Início</label>
                    <input
                      type="date"
                      required
                      value={eventForm.startDate}
                      onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data Fim</label>
                    <input
                      type="date"
                      required
                      value={eventForm.endDate}
                      onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nível</label>
                    <select
                      value={eventForm.level}
                      onChange={e =>
                        setEventForm({
                          ...eventForm,
                          level: e.target.value as Super8EventItem['level'],
                          categoryName: `Super 8 ${e.target.value}`
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                    >
                      {LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Valor da Inscrição (R$)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={eventForm.price}
                      onChange={e => setEventForm({ ...eventForm, price: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade de Games</label>
                    <select
                      value={eventForm.games}
                      onChange={e => {
                        const g = Number(e.target.value);
                        setEventForm({
                          ...eventForm,
                          games: g,
                          thaiBreak: g === 6 ? eventForm.thaiBreak : false
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                    >
                      <option value={4}>4 Games (Padrão Super 8)</option>
                      <option value={6}>6 Games</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={eventForm.status}
                      onChange={e => setEventForm({ ...eventForm, status: e.target.value as Super8EventItem['status'] })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                    >
                      <option value="INSCRICOES_ABERTAS">Inscrições Abertas</option>
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="FINALIZADO">Finalizado</option>
                    </select>
                  </div>
                </div>

                {eventForm.games === 6 && (
                  <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventForm.thaiBreak}
                      onChange={e => setEventForm({ ...eventForm, thaiBreak: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      Habilitar Thai Break em caso de empate em 6x6 (7 pontos corridos)
                    </span>
                  </label>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    {savingEvent ? 'Salvando...' : editingEventId ? 'Salvar Alterações' : 'Criar Super 8'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SCORE ENTRY */}
      <AnimatePresence>
        {scoreModalMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Placar · {scoreModalMatch.stage} · Jogo #{scoreModalMatch.matchNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {scoreModalMatch.games || 4} games
                    {scoreModalMatch.games === 6 && scoreModalMatch.thaiBreak ? ' · Thai Break ativo' : ''} ·{' '}
                    {scoreModalMatch.court}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScoreModalMatch(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveScore} className="p-6 space-y-5">
                <div className="grid grid-cols-11 gap-3 items-center">
                  <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Dupla A</span>
                    <p className="text-xs font-bold text-slate-900 leading-snug mb-2">
                      {scoreModalMatch.teamA.player1Name} + {scoreModalMatch.teamA.player2Name}
                    </p>
                    <input
                      type="number"
                      min={0}
                      max={7}
                      required
                      value={scoreAInput}
                      onChange={e => {
                        setScoreAInput(e.target.value);
                        setTieResolution(null);
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center text-lg font-bold text-slate-900 tabular-nums"
                    />
                  </div>

                  <div className="col-span-1 text-center text-sm font-bold text-slate-400">x</div>

                  <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Dupla B</span>
                    <p className="text-xs font-bold text-slate-900 leading-snug mb-2">
                      {scoreModalMatch.teamB.player1Name} + {scoreModalMatch.teamB.player2Name}
                    </p>
                    <input
                      type="number"
                      min={0}
                      max={7}
                      required
                      value={scoreBInput}
                      onChange={e => {
                        setScoreBInput(e.target.value);
                        setTieResolution(null);
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center text-lg font-bold text-slate-900 tabular-nums"
                    />
                  </div>
                </div>

                {scoreAInput !== '' && scoreBInput !== '' && Number(scoreAInput) === Number(scoreBInput) && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-amber-900">
                        Empate detectado: o critério automático de desempate será aplicado.
                      </p>
                      <button
                        type="button"
                        disabled={resolvingTie}
                        onClick={handleResolveTie}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                      >
                        {resolvingTie ? 'Calculando...' : 'Calcular Critério'}
                      </button>
                    </div>
                    {tieResolution && (
                      <p className="text-xs text-amber-800">
                        Vencedora pelo critério:{' '}
                        <strong>{tieResolution.winnerTeam === 'TEAM_A' ? 'Dupla A' : 'Dupla B'}</strong> (
                        {tieResolution.tieBreaker})
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setScoreModalMatch(null)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingScore}
                    className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {savingScore ? 'Salvando...' : 'Salvar Placar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: W.O. */}
      <AnimatePresence>
        {woModalMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Registrar W.O. · Jogo #{woModalMatch.matchNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setWoModalMatch(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmWO} className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  Selecione qual dupla venceu por W.O. (placar computado: {woModalMatch.games || 4}x0 para os atletas vencedores):
                </p>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="woWinner"
                      checked={woWinnerTeam === 'TEAM_A'}
                      onChange={() => setWoWinnerTeam('TEAM_A')}
                      className="accent-emerald-600"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">Dupla A</span>
                      <span className="text-slate-600">
                        {woModalMatch.teamA.player1Name} + {woModalMatch.teamA.player2Name}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="woWinner"
                      checked={woWinnerTeam === 'TEAM_B'}
                      onChange={() => setWoWinnerTeam('TEAM_B')}
                      className="accent-emerald-600"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">Dupla B</span>
                      <span className="text-slate-600">
                        {woModalMatch.teamB.player1Name} + {woModalMatch.teamB.player2Name}
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWoModalMatch(null)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingWO}
                    className="py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {savingWO ? 'Registrando...' : 'Confirmar W.O.'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: COURT REASSIGNMENT */}
      <AnimatePresence>
        {courtModalMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Alterar Quadra · Jogo #{courtModalMatch.matchNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setCourtModalMatch(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveCourt} className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.max(1, detailEvent?.courtsUsed || 4) }, (_, idx) => `Quadra ${idx + 1}`).map(
                    cName => (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => setCourtInput(cName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          courtInput === cName
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cName}
                      </button>
                    )
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={courtInput}
                  onChange={e => setCourtInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCourtModalMatch(null)}
                    className="py-2 px-3 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingCourt}
                    className="py-2 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {savingCourt ? 'Salvando...' : 'Salvar Quadra'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
