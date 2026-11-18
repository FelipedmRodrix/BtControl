'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Trophy,
  Award,
  Link2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Calendar,
  MapPin,
  Search,
  Share2,
  ArrowLeft,
  Shield,
  Users,
  Zap
} from 'lucide-react';
import type { Super8AthleteStanding } from '@/lib/services/super8Service';
import type { Super8EventItem, Super8MatchItem } from '@/components/Super8Module';

interface SessionInfo {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
  arenaId: string | null;
  name: string;
}

interface ArenaOption {
  id: string;
  name: string;
}

interface PublicAthlete {
  id: string;
  name: string;
  gender?: string;
}

interface Super8IndividualStandingsModuleProps {
  mode?: 'module' | 'public';
  session?: SessionInfo | null;
  arenas?: ArenaOption[];
  initialEventId?: string | null;
  initialAthleteId?: string | null;
  showSuccess?: (msg: string) => void;
  showError?: (msg: string) => void;
}

export function Super8IndividualStandingsModule({
  mode = 'module',
  session = null,
  arenas = [],
  initialEventId = null,
  initialAthleteId = null,
  showSuccess,
  showError
}: Super8IndividualStandingsModuleProps) {
  const isPublic = mode === 'public';

  const [events, setEvents] = useState<Super8EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [filterArena, setFilterArena] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');

  const [detailEvent, setDetailEvent] = useState<Super8EventItem | null>(null);
  const [detailAthletes, setDetailAthletes] = useState<PublicAthlete[]>([]);
  const [detailMatches, setDetailMatches] = useState<Super8MatchItem[]>([]);
  const [detailStandings, setDetailStandings] = useState<Super8AthleteStanding[]>([]);

  const [loadingEvents, setLoadingEvents] = useState<boolean>(!isPublic);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(Boolean(initialEventId));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [viewTab, setViewTab] = useState<'standings' | 'matches'>('standings');
  const [highlightedAthleteId, setHighlightedAthleteId] = useState<string>(initialAthleteId || '');
  const [roundFilter, setRoundFilter] = useState<number | 'ALL'>('ALL');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'ALL' | 'PENDENTE' | 'PLAYED'>('ALL');

  const [copiedType, setCopiedType] = useState<'event' | 'athlete' | null>(null);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        setOrigin(window.location.origin);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    if (!session) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'x-user-id': session.id,
      'x-user-role': session.role
    };
  }, [session]);

  const loadDetailData = useCallback(
    async (eventId: string, silent = false) => {
      if (!eventId) return;
      try {
        const url = isPublic ? `/api/public/super8/${eventId}` : `/api/super8/${eventId}`;
        const res = await fetch(url, {
          headers: isPublic ? undefined : authHeaders(),
          cache: 'no-store'
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error || 'Não foi possível carregar o campeonato Super 8.';
          setErrorMessage(msg);
          if (!silent) showError?.(msg);
          return;
        }
        setErrorMessage(null);
        setDetailEvent(data.event);
        setDetailAthletes(data.athletes || []);
        setDetailMatches(data.matches || []);
        setDetailStandings(data.standings || []);
      } catch {
        const msg = 'Erro de conexão ao carregar a classificação individual.';
        setErrorMessage(msg);
        if (!silent) showError?.(msg);
      } finally {
        setLoadingDetail(false);
        setRefreshing(false);
      }
    },
    [authHeaders, isPublic, showError]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadList() {
      if (isPublic) return;
      try {
        const qs =
          session?.role === 'ARENA_ADMIN' && session.arenaId
            ? `?arenaId=${encodeURIComponent(session.arenaId)}`
            : '';
        const res = await fetch(`/api/super8${qs}`, {
          headers: authHeaders(),
          cache: 'no-store'
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          const msg = data?.error || 'Erro ao carregar campeonatos Super 8.';
          setErrorMessage(msg);
          showError?.(msg);
          setEvents([]);
        } else {
          const list: Super8EventItem[] = Array.isArray(data) ? data : [];
          setEvents(list);
          if (list.length > 0) {
            const preferred =
              initialEventId && list.some(e => e.id === initialEventId)
                ? initialEventId
                : list.find(e => e.status === 'EM_ANDAMENTO')?.id || list[0].id;
            setSelectedEventId(prev => prev || preferred);
          }
        }
      } catch {
        if (!cancelled) {
          const msg = 'Falha de conexão ao listar campeonatos Super 8.';
          setErrorMessage(msg);
          showError?.(msg);
        }
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    }
    loadList();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, initialEventId, isPublic, session?.arenaId, session?.role, showError]);

  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function fetchSelected() {
      if (cancelled) return;
      await loadDetailData(selectedEventId, true);
    }
    fetchSelected();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId, loadDetailData]);

  // Auto-refresh public live view every 30s so players at courts see updated scores
  useEffect(() => {
    if (!isPublic || !selectedEventId) return;
    const interval = setInterval(() => {
      loadDetailData(selectedEventId, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isPublic, selectedEventId, loadDetailData]);

  const handleSelectEvent = (nextId: string) => {
    setSelectedEventId(nextId);
    setLoadingDetail(Boolean(nextId));
    setHighlightedAthleteId('');
    setRoundFilter('ALL');
    setMatchStatusFilter('ALL');
    setErrorMessage(null);
  };

  const handleManualRefresh = () => {
    if (!selectedEventId) return;
    setRefreshing(true);
    loadDetailData(selectedEventId, false);
  };

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    return events.filter(ev => {
      const matchesArena = !filterArena || ev.arenaId === filterArena;
      const matchesSearch =
        !q ||
        ev.name.toLowerCase().includes(q) ||
        ev.seriesName.toLowerCase().includes(q) ||
        (ev.arenaName || '').toLowerCase().includes(q) ||
        (ev.venueName || '').toLowerCase().includes(q);
      return matchesArena && matchesSearch;
    });
  }, [events, filterArena, eventSearch]);

  const activeEventId = selectedEventId || detailEvent?.id || '';
  const publicPath = activeEventId ? `/super8/${activeEventId}` : '/super8';
  const athletePublicPath =
    activeEventId && highlightedAthleteId
      ? `/super8/${activeEventId}?atleta=${encodeURIComponent(highlightedAthleteId)}`
      : publicPath;
  const fullPublicUrl = origin ? `${origin}${publicPath}` : publicPath;
  const fullAthleteUrl = origin ? `${origin}${athletePublicPath}` : athletePublicPath;

  const handleCopyLink = async (type: 'event' | 'athlete') => {
    const urlToCopy = type === 'athlete' ? fullAthleteUrl : fullPublicUrl;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedType(type);
      showSuccess?.(
        type === 'athlete'
          ? 'Link direto do atleta copiado para a área de transferência.'
          : 'Link direto do campeonato copiado para a área de transferência.'
      );
      setTimeout(() => setCopiedType(prev => (prev === type ? null : prev)), 2500);
    } catch {
      showError?.('Não foi possível copiar o link automaticamente. Selecione e copie manualmente.');
    }
  };

  const highlightedStanding = useMemo(
    () => detailStandings.find(s => s.athleteId === highlightedAthleteId) || null,
    [detailStandings, highlightedAthleteId]
  );

  const filteredMatches = useMemo(() => {
    return detailMatches.filter(m => {
      const matchesRound = roundFilter === 'ALL' || m.round === roundFilter;
      const matchesStatus =
        matchStatusFilter === 'ALL' ||
        (matchStatusFilter === 'PENDENTE' && m.status === 'PENDENTE') ||
        (matchStatusFilter === 'PLAYED' && (m.status === 'FINALIZADA' || m.status === 'WO'));
      const matchesAthlete =
        !highlightedAthleteId ||
        m.teamA.player1Id === highlightedAthleteId ||
        m.teamA.player2Id === highlightedAthleteId ||
        m.teamB.player1Id === highlightedAthleteId ||
        m.teamB.player2Id === highlightedAthleteId;
      return matchesRound && matchesStatus && matchesAthlete;
    });
  }, [detailMatches, roundFilter, matchStatusFilter, highlightedAthleteId]);

  const roundsPresent = useMemo(
    () => Array.from(new Set(filteredMatches.map(m => m.round))).sort((a, b) => a - b),
    [filteredMatches]
  );

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

  const whatsappShareUrl = useMemo(() => {
    if (!detailEvent) return '#';
    const text = `Acompanhe a classificação individual e os jogos do ${detailEvent.name}: ${fullPublicUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [detailEvent, fullPublicUrl]);

  const playedCount = detailMatches.filter(m => m.status === 'FINALIZADA' || m.status === 'WO').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* HEADER BAR */}
      {isPublic ? (
        <header className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Link
                href="/super8"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shrink-0"
                title="Ver todos os campeonatos Super 8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-amber-700">ArenaBT · Super 8</span>
                  <span aria-hidden="true">·</span>
                  <span>{detailEvent?.arenaName || 'Organizador'}</span>
                  {detailEvent?.venueName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{detailEvent.venueName}</span>
                    </>
                  )}
                  {detailEvent && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {detailEvent.games || 4} games
                        {detailEvent.games === 6 && detailEvent.thaiBreak ? ' + Thai Break' : ''}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5 mt-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {detailEvent?.name || 'Classificação Individual Super 8'}
                  </h1>
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

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyLink(highlightedAthleteId ? 'athlete' : 'event')}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {copiedType ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType ? 'Link Copiado' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>
        </header>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Classificação Individual</h2>
                <p className="text-xs text-slate-500">
                  Selecione o campeonato Super 8 para acompanhar as pontuações, partidas e compartilhar o link direto com os jogadores.
                </p>
              </div>
            </div>

            {selectedEventId && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Atualizar Dados</span>
                </button>
              </div>
            )}
          </div>

          {/* Championship selector + search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
            <div className="md:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Selecionar Campeonato Super 8
              </label>
              <select
                value={selectedEventId}
                onChange={e => handleSelectEvent(e.target.value)}
                disabled={loadingEvents || filteredEvents.length === 0}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {filteredEvents.length === 0 ? (
                  <option value="">Nenhum Super 8 disponível</option>
                ) : (
                  filteredEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} · {ev.level} ({formatStatusLabel(ev.status)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Buscar Campeonato
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  placeholder="Nome, série ou local..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {session?.role === 'SUPER_ADMIN' && arenas.length > 0 && (
              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Organizador
                </label>
                <select
                  value={filterArena}
                  onChange={e => setFilterArena(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Todos Organizadores</option>
                  {arenas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Direct Shareable Link Bar for Organizer */}
          {detailEvent && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Link2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Link Direto para Jogadores (Acesso Público sem Login)</span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-slate-700 truncate flex-1 select-all">
                    {fullPublicUrl}
                  </code>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyLink('event')}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  {copiedType === 'event' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'event' ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={publicPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Link</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOADING / ERROR / EMPTY STATES */}
      {(loadingEvents || loadingDetail) && !detailEvent ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-xs text-slate-500 font-medium">
            Carregando classificação individual Super 8...
          </p>
        </div>
      ) : errorMessage && !detailEvent ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Campeonato não disponível</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMessage}</p>
          {isPublic && (
            <Link
              href="/super8"
              className="inline-flex items-center gap-1.5 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Campeonatos Disponíveis</span>
            </Link>
          )}
        </div>
      ) : !detailEvent ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhum campeonato Super 8 encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cadastre um campeonato no módulo Super 8 para visualizar a classificação individual e gerar links para os atletas.
          </p>
        </div>
      ) : (
        <>
          {/* NAVIGATION TABS + PLAYER HIGHLIGHT SELECTOR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewTab('standings')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    viewTab === 'standings'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Classificação Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('matches')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    viewTab === 'matches'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Acompanhar Jogos ({playedCount}/{detailMatches.length || 14})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 px-2 tabular-nums">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>{detailEvent.arenaName}</span>
                {detailEvent.venueName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{detailEvent.venueName}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={highlightedAthleteId}
                  onChange={e => setHighlightedAthleteId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Todos os Atletas (Visão Geral)</option>
                  {detailAthletes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {highlightedAthleteId && !isPublic && (
                <button
                  type="button"
                  onClick={() => handleCopyLink('athlete')}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  {copiedType === 'athlete' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'athlete' ? 'Link do Atleta Copiado' : 'Copiar Link do Atleta'}</span>
                </button>
              )}
            </div>
          </div>

          {/* PERSONAL ATHLETE SUMMARY WHEN AN ATHLETE IS SELECTED */}
          {highlightedStanding && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-amber-800 block">
                  Desempenho Individual Selecionado
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {highlightedStanding.rank}º lugar · {highlightedStanding.athleteName}
                </h3>
              </div>

              <div className="grid grid-cols-5 gap-3 text-center tabular-nums">
                <div className="bg-white border border-amber-200/80 rounded-xl px-3 py-2">
                  <span className="text-[10px] text-slate-500 block">Jogos</span>
                  <strong className="text-sm font-bold text-slate-900">{highlightedStanding.played}</strong>
                </div>
                <div className="bg-white border border-amber-200/80 rounded-xl px-3 py-2">
                  <span className="text-[10px] text-slate-500 block">Vitórias</span>
                  <strong className="text-sm font-bold text-emerald-700">{highlightedStanding.wins}</strong>
                </div>
                <div className="bg-white border border-amber-200/80 rounded-xl px-3 py-2">
                  <span className="text-[10px] text-slate-500 block">Derrotas</span>
                  <strong className="text-sm font-bold text-rose-600">{highlightedStanding.losses}</strong>
                </div>
                <div className="bg-white border border-amber-200/80 rounded-xl px-3 py-2">
                  <span className="text-[10px] text-slate-500 block">Saldo</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {highlightedStanding.gameDiff > 0 ? `+${highlightedStanding.gameDiff}` : highlightedStanding.gameDiff}
                  </strong>
                </div>
                <div className="bg-white border border-amber-200/80 rounded-xl px-3 py-2">
                  <span className="text-[10px] text-slate-500 block">Aprov.</span>
                  <strong className="text-sm font-bold text-slate-900">{highlightedStanding.winRate}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: EXACT SUPER 8 CLASSIFICAÇÃO INDIVIDUAL */}
          {viewTab === 'standings' && (
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
                  Nenhum atleta participante cadastrado neste Super 8 ainda.
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
                      {detailStandings.map(st => {
                        const isHighlighted = st.athleteId === highlightedAthleteId;
                        return (
                          <tr
                            key={st.athleteId}
                            onClick={() =>
                              setHighlightedAthleteId(prev => (prev === st.athleteId ? '' : st.athleteId))
                            }
                            title="Clique para destacar o atleta e filtrar seus jogos"
                            className={`transition cursor-pointer ${
                              isHighlighted
                                ? 'bg-emerald-50 hover:bg-emerald-100/70'
                                : st.rank <= 3
                                  ? 'bg-amber-50/20 hover:bg-slate-50'
                                  : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {st.rank === 1 ? '1º 🥇' : st.rank === 2 ? '2º 🥈' : st.rank === 3 ? '3º 🥉' : `${st.rank}º`}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{st.athleteName}</span>
                                {isHighlighted && (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    Selecionado
                                  </span>
                                )}
                              </div>
                            </td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE MATCHES & ROUNDS */}
          {viewTab === 'matches' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRoundFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      roundFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas Rodadas
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoundFilter(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition tabular-nums cursor-pointer ${
                        roundFilter === r
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      R{r}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
                  {(
                    [
                      { id: 'ALL', label: 'Todos' },
                      { id: 'PENDENTE', label: 'Pendentes' },
                      { id: 'PLAYED', label: 'Finalizados' }
                    ] as const
                  ).map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setMatchStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        matchStatusFilter === st.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMatches.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
                  Nenhuma partida encontrada para os filtros selecionados.
                </div>
              ) : (
                <div className="space-y-4">
                  {roundsPresent.map(roundNum => {
                    const roundMatches = filteredMatches.filter(m => m.round === roundNum);
                    return (
                      <div key={roundNum} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Rodada {roundNum} de 7
                          </span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {roundMatches.filter(m => m.status !== 'PENDENTE').length} / {roundMatches.length} concluída(s)
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {roundMatches.map(m => {
                            const teamAWon = m.winnerTeam === 'TEAM_A';
                            const teamBWon = m.winnerTeam === 'TEAM_B';
                            const hasHighlightA =
                              highlightedAthleteId &&
                              (m.teamA.player1Id === highlightedAthleteId || m.teamA.player2Id === highlightedAthleteId);
                            const hasHighlightB =
                              highlightedAthleteId &&
                              (m.teamB.player1Id === highlightedAthleteId || m.teamB.player2Id === highlightedAthleteId);

                            return (
                              <div
                                key={m.id}
                                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums md:w-44 shrink-0">
                                  <span className="font-bold text-slate-800">Jogo #{m.matchNumber}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {m.court}
                                  </span>
                                  {m.time && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>{m.time}</span>
                                    </>
                                  )}
                                </div>

                                <div className="flex-1 grid grid-cols-11 items-center gap-2">
                                  <div
                                    className={`col-span-5 text-right rounded-xl px-3 py-2 border ${
                                      hasHighlightA
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : teamAWon
                                          ? 'bg-emerald-50/60 border-emerald-200'
                                          : 'bg-slate-50 border-slate-200/70'
                                    }`}
                                  >
                                    <span className={`text-xs font-bold block ${teamAWon ? 'text-emerald-800' : 'text-slate-900'}`}>
                                      {m.teamA.player1Name} + {m.teamA.player2Name}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      Dupla A {teamAWon ? '· Vencedora' : ''}
                                    </span>
                                  </div>

                                  <div className="col-span-1 text-center tabular-nums">
                                    {m.status === 'PENDENTE' ? (
                                      <span className="text-xs font-bold text-slate-400">vs</span>
                                    ) : (
                                      <span className="inline-block px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold whitespace-nowrap">
                                        {m.scoreA ?? 0} x {m.scoreB ?? 0}
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    className={`col-span-5 text-left rounded-xl px-3 py-2 border ${
                                      hasHighlightB
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : teamBWon
                                          ? 'bg-emerald-50/60 border-emerald-200'
                                          : 'bg-slate-50 border-slate-200/70'
                                    }`}
                                  >
                                    <span className={`text-xs font-bold block ${teamBWon ? 'text-emerald-800' : 'text-slate-900'}`}>
                                      {m.teamB.player1Name} + {m.teamB.player2Name}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      Dupla B {teamBWon ? '· Vencedora' : ''}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 md:w-32 shrink-0">
                                  <span
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                                      m.status === 'FINALIZADA'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : m.status === 'WO'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {m.status === 'FINALIZADA' ? 'Finalizada' : m.status === 'WO' ? 'W.O.' : 'Aguardando'}
                                  </span>
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

          {/* Footer info */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Classificação individual atualizada automaticamente a cada placar validado.</span>
            </div>
            {isPublic && (
              <span className="tabular-nums">Atualização automática a cada 30 segundos</span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
