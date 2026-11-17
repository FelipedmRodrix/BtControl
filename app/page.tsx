'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  UserPlus, 
  Plus, 
  Search, 
  Edit2, 
  Building, 
  Check, 
  X, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Sparkles,
  Mail, 
  Phone, 
  User, 
  ArrowLeft,
  AlertCircle,
  Link,
  Trash2,
  Lock,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  Trophy,
  Layers,
  ClipboardList,
  UserCheck,
  Activity,
  Award,
  TrendingUp,
  Settings,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Menu,
  GitFork,
  Zap
} from 'lucide-react';
import { WorldCupBracket } from '@/components/WorldCupBracket';
import { GroupStageView } from '@/components/GroupStageView';
import { TournamentTreeBracket } from '@/components/TournamentTreeBracket';
import { ProfilesManager } from '@/components/ProfilesManager';
import { UsersManager } from '@/components/UsersManager';
import { Super8Module } from '@/components/Super8Module';
import type { ConventionalTournamentData } from '@/lib/services/conventionalTournamentService';
import { type Profile, type SystemScreen, type PermissionAction, DEFAULT_SYSTEM_PROFILES } from '@/lib/types/permissions';

// Type definitions
interface Athlete {
  id: string;
  cpf: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F' | 'MISTO';
  phone: string;
  email: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
}

interface Arena {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'ATIVA' | 'INATIVA';
  createdAt: string;
  adminUsername?: string;
  adminPassword?: string;
}

interface ArenaAthlete extends Athlete {
  arenaStatus: 'ATIVO' | 'BLOQUEADO';
}

interface UserSession {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
  arenaId: string | null;
  name: string;
  profileId?: string;
  profile?: Profile;
}

export interface SystemUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
  arenaId: string | null;
  status: 'ATIVO' | 'INATIVO';
  profileId?: string;
  profileName?: string;
  source?: 'SISTEMA' | 'ORGANIZADOR' | 'ATLETA' | 'IMPORTACAO';
  createdAt: string;
  updatedAt: string;
}

export interface ArenaVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  courtsCount: number;
  contactPhone?: string;
  status: 'ATIVA' | 'INATIVA';
  createdAt: string;
  updatedAt?: string;
}

// Domain Models
interface Tournament {
  id: string;
  name: string;
  arenaId: string; // Organizer ID
  organizerId?: string;
  venueId?: string; // Physical Arena / Location ID
  venueName?: string; // Physical Arena Name
  courtsUsed?: number; // Number of courts used for the event
  seriesName: string;
  startDate: string;
  endDate: string;
  status: 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO';
  createdAt: string;
}

interface Category {
  id: string;
  tournamentId?: string;
  masterCategoryId?: string;
  name?: string;
  type: 'MISTA' | 'MASCULINO' | 'FEMININO';
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  maxParticipants?: number;
   status?: 'ATIVA' | 'INATIVA';
   description?: string;
   games?: number;
   thaiBreak?: boolean;
   createdAt: string;
  tournamentName?: string;
  arenaId?: string;
  isMaster?: boolean;
}

interface Registration {
  id: string;
  athleteName: string;
  categoryName: string;
  tournamentName: string;
  registeredAt: string;
  status: 'CONFIRMADA' | 'CANCELADA';
}

interface Duo {
  id: string;
  categoryName: string;
  player1: string;
  player2: string;
  status: 'CONFIRMADA' | 'MUDANÇA_PENDENTE';
}

interface Match {
  id: string;
  tournamentId?: string;
  tournamentName?: string;
  categoryId?: string;
  categoryName: string;
  stage: string;
  groupName?: string;
  round?: number;
  matchNumber?: number;
  scoreA?: number;
  scoreB?: number;
  duo1?: string;
  duo2?: string;
  duo1Name?: string;
  duo2Name?: string;
  duo1Id?: string;
  duo2Id?: string;
  date: string;
  time: string;
  court: string;
  status: 'PENDENTE' | 'FINALIZADA' | 'WO';
  score?: string;
  winnerDuo?: string;
  winnerDuoId?: string;
  isDraw?: boolean;
  games?: number;
  thaiBreak?: boolean;
  tieBreaker?: string;
}

// Standard Beach Tennis Category Matrix (Rule 9 and 10)
const STANDARD_CATEGORIES = [
  { type: 'MASCULINO' as const, level: 'INICIANTE' as const },
  { type: 'MASCULINO' as const, level: 'D' as const },
  { type: 'MASCULINO' as const, level: 'C' as const },
  { type: 'MASCULINO' as const, level: 'B' as const },
  { type: 'MASCULINO' as const, level: 'A' as const },
  { type: 'MASCULINO' as const, level: 'OPEN' as const },
  
  { type: 'FEMININO' as const, level: 'INICIANTE' as const },
  { type: 'FEMININO' as const, level: 'D' as const },
  { type: 'FEMININO' as const, level: 'C' as const },
  { type: 'FEMININO' as const, level: 'B' as const },
  { type: 'FEMININO' as const, level: 'A' as const },
  { type: 'FEMININO' as const, level: 'OPEN' as const },
  
  { type: 'MISTA' as const, level: 'INICIANTE' as const },
  { type: 'MISTA' as const, level: 'D' as const },
  { type: 'MISTA' as const, level: 'C' as const },
  { type: 'MISTA' as const, level: 'B' as const },
  { type: 'MISTA' as const, level: 'A' as const },
  { type: 'MISTA' as const, level: 'OPEN' as const }
];

export default function Home() {
  // Authentication State
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'athletes' | 'arenas' | 'venues' | 'tournaments' | 'categories' | 'registrations' | 'duos' | 'matches' | 'results' | 'reports' | 'settings' | 'bracket-tree' | 'profiles' | 'users' | 'super8'
  >('dashboard');

  // Sub-aba de Configurações
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'profiles' | 'users'>('general');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(true);

  // Perfis e Usuários States
  const [systemProfiles, setSystemProfiles] = useState<Profile[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Notificação de Próximo Jogo e Liberação de Quadra
  const [courtFreedNotice, setCourtFreedNotice] = useState<{
    freedCourt: string;
    nextMatchSuggestion?: any;
  } | null>(null);

  // Mata-Mata Tree States
  const [isMataMataExpanded, setIsMataMataExpanded] = useState<boolean>(true);
  const [selectedTreeTournamentId, setSelectedTreeTournamentId] = useState<string>('');
  const [selectedTreeCategoryId, setSelectedTreeCategoryId] = useState<string>('');
  const [treeData, setTreeData] = useState<ConventionalTournamentData | null>(null);
  const [loadingTree, setLoadingTree] = useState<boolean>(false);

  // Selected Arena for managing its athletes (SUPER_ADMIN ONLY)
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [arenaAthletes, setArenaAthletes] = useState<ArenaAthlete[]>([]);
  const [nonArenaAthletes, setNonArenaAthletes] = useState<Athlete[]>([]);

  // List States
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]); // Organizadores
  const [venues, setVenues] = useState<ArenaVenue[]>([]); // Arenas Físicas (Locais do Evento)
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Dynamic database-backed state arrays
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [duos, setDuos] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // Filtering
  const [searchAthlete, setSearchAthlete] = useState('');
  const [searchArena, setSearchArena] = useState(''); // Organizadores
  const [searchVenue, setSearchVenue] = useState(''); // Arenas Físicas
  const [searchTournament, setSearchTournament] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [filterCategoryTournament, setFilterCategoryTournament] = useState<string>('ALL');
  const [filterCategoryType, setFilterCategoryType] = useState<string>('ALL');
  const [filterCategoryLevel, setFilterCategoryLevel] = useState<string>('ALL');
  const [filterCategoryStatus, setFilterCategoryStatus] = useState<string>('ALL');
  const [isCadastrarExpanded, setIsCadastrarExpanded] = useState<boolean>(true);
  const [searchGlobalQuery, setSearchGlobalQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Loading & Notification States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal control states
  const [isAthleteModalOpen, setIsAthleteModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [athleteForm, setAthleteForm] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    gender: 'M' as 'M' | 'F' | 'MISTO',
    phone: '',
    email: '',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO'
  });

  // Organizador (ex-Arena) CRUD Modal
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);
  const [editingArena, setEditingArena] = useState<Arena | null>(null);
  const [arenaForm, setArenaForm] = useState({
    name: '',
    owner: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    status: 'ATIVA' as 'ATIVA' | 'INATIVA',
    adminUsername: '',
    adminPassword: ''
  });

  // Arena Física (Local do Evento) CRUD Modal
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<ArenaVenue | null>(null);
  const [venueForm, setVenueForm] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    courtsCount: 6,
    contactPhone: '',
    status: 'ATIVA' as 'ATIVA' | 'INATIVA'
  });

  // Quick Change Match Court Modal
  const [isChangeCourtModalOpen, setIsChangeCourtModalOpen] = useState(false);
  const [targetMatchForCourt, setTargetMatchForCourt] = useState<any | null>(null);
  const [selectedCourtName, setSelectedCourtName] = useState('');

  // Confirmation Dialog State (in-app modal to prevent iframe window.confirm blocking)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel: string = 'Confirmar Exclusão'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel,
      onConfirm
    });
  };

  // Torneios CRUD Modals
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [tourForm, setTourForm] = useState({
    name: '',
    seriesName: '',
    arenaId: '', // Organizador
    venueId: '', // Local (Arena Física)
    courtsUsed: 4, // Quadras a utilizar no evento
    startDate: '',
    endDate: '',
    status: 'INSCRICOES_ABERTAS' as 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO',
    games: 6 as 4 | 6,
    thaiBreak: true
  });

  // Interactive categories selection state inside tournament modal (Selected from system's pre-registered categories!)
  const [tourCategories, setTourCategories] = useState<{
    masterCategoryId?: string;
    name?: string;
    type: 'MISTA' | 'MASCULINO' | 'FEMININO';
    level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
    price: number;
    maxParticipants: number;
    games?: number;
    thaiBreak?: boolean;
    enabled: boolean;
  }[]>([]);

  // Categorias CRUD Modals (Super Admin Master Registry)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    tournamentId: 'GLOBAL',
    type: 'MASCULINO' as 'MISTA' | 'MASCULINO' | 'FEMININO',
    level: 'C' as 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN',
    price: 100,
     maxParticipants: 16,
     games: 4 as 4 | 6,
     thaiBreak: false,
     status: 'ATIVA' as 'ATIVA' | 'INATIVA',
    description: ''
  });

  // New persistent form/modal states
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    tournamentId: '',
    categoryId: '',
    selectedAthleteIds: [] as string[],
    status: 'PENDENTE_PAGAMENTO' as 'PENDENTE_PAGAMENTO' | 'CONFIRMADA'
  });

  const [isDuoModalOpen, setIsDuoModalOpen] = useState(false);
  const [duoForm, setDuoForm] = useState({
    tournamentId: '',
    categoryId: '',
    player1Id: '',
    player2Id: ''
  });

  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchForm, setMatchForm] = useState({
    tournamentId: '',
    categoryId: '',
    stage: 'Fase de Grupos',
    groupName: 'Grupo Único',
    duo1Id: '',
    duo2Id: '',
    date: '',
    time: '14:00',
    court: 'Quadra 1'
  });

  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genForm, setGenForm] = useState({
    tournamentId: '',
    categoryId: '',
    date: '',
    court: 'Quadra 1'
  });

  const [filterMatchCategory, setFilterMatchCategory] = useState<string>('ALL');

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [resultForm, setResultForm] = useState({
    score: '',
    winnerDuoId: '',
    scoreA: 4,
    scoreB: 0,
    winnerTeam: 'TEAM_A' as 'TEAM_A' | 'TEAM_B',
    games: 4 as 4 | 6,
    thaiBreak: false,
    isDraw: false,
    tieBreakerReason: '' as string
  });
  const [woForm, setWoForm] = useState({
    winnerDuoId: '',
    winnerTeam: 'TEAM_A' as 'TEAM_A' | 'TEAM_B'
  });

  // Tournament Filter states across modules (Requested)
  // 1. Inscrições
  const [selectedRegTournamentId, setSelectedRegTournamentId] = useState<string>('');
  const [searchRegTournamentTerm, setSearchRegTournamentTerm] = useState<string>('');
  const [filterRegStatus, setFilterRegStatus] = useState<'ALL' | 'VIGENTE' | 'EXPIRADO'>('ALL');
  const [filterRegArenaId, setFilterRegArenaId] = useState<string>('ALL');
  const [filterRegCategory, setFilterRegCategory] = useState<string>('ALL');
  const [filterRegPaymentStatus, setFilterRegPaymentStatus] = useState<string>('ALL');
  const [searchRegAthleteTerm, setSearchRegAthleteTerm] = useState<string>('');
  const [searchRegAthleteCreate, setSearchRegAthleteCreate] = useState<string>('');

  // 2. Duplas
  const [selectedDuoTournamentId, setSelectedDuoTournamentId] = useState<string>('');
  const [searchDuoTournamentTerm, setSearchDuoTournamentTerm] = useState<string>('');
  const [filterDuoStatus, setFilterDuoStatus] = useState<'ALL' | 'VIGENTE' | 'EXPIRADO'>('ALL');
  const [filterDuoArenaId, setFilterDuoArenaId] = useState<string>('ALL');
  const [filterDuoCategory, setFilterDuoCategory] = useState<string>('ALL');
  const [searchDuoPlayer1, setSearchDuoPlayer1] = useState<string>('');
  const [searchDuoPlayer2, setSearchDuoPlayer2] = useState<string>('');

  // 3. Jogos / Quadras
  const [selectedMatchTournamentId, setSelectedMatchTournamentId] = useState<string>('');
  const [searchMatchTournamentTerm, setSearchMatchTournamentTerm] = useState<string>('');
  const [filterMatchStatus, setFilterMatchStatus] = useState<'ALL' | 'VIGENTE' | 'EXPIRADO'>('ALL');
  const [filterMatchArenaId, setFilterMatchArenaId] = useState<string>('ALL');
  // note: filterMatchCategory and filterSuper8Round already declared above

  // 4. Resultados / WO
  const [selectedResultTournamentId, setSelectedResultTournamentId] = useState<string>('');
  const [searchResultTournamentTerm, setSearchResultTournamentTerm] = useState<string>('');
  const [filterResultStatus, setFilterResultStatus] = useState<'ALL' | 'VIGENTE' | 'EXPIRADO'>('ALL');
  const [filterResultArenaId, setFilterResultArenaId] = useState<string>('ALL');
  const [filterResultCategory, setFilterResultCategory] = useState<string>('ALL');

  // 5. Relatórios
  const [selectedReportTournamentId, setSelectedReportTournamentId] = useState<string>('');
  const [searchReportTournamentTerm, setSearchReportTournamentTerm] = useState<string>('');
  const [filterReportStatus, setFilterReportStatus] = useState<'ALL' | 'VIGENTE' | 'EXPIRADO'>('ALL');
  const [filterReportArenaId, setFilterReportArenaId] = useState<string>('ALL');
  const [filterReportCategory, setFilterReportCategory] = useState<string>('ALL');

  const canPerform = (screen: SystemScreen, action: PermissionAction): boolean => {
    if (!session) return false;
    if (session.role === 'SUPER_ADMIN') return true;
    const prof =
      systemProfiles.find(p => p.id === session.profileId) ||
      session.profile ||
      DEFAULT_SYSTEM_PROFILES.find(p => p.id === session.profileId) ||
      (session.role === 'ARENA_ADMIN'
        ? DEFAULT_SYSTEM_PROFILES.find(p => p.id === 'prof-organizador')
        : DEFAULT_SYSTEM_PROFILES.find(p => p.id === 'prof-visualizador'));
    if (!prof) return session.role === 'ARENA_ADMIN';
    const perm = prof.permissions.find(p => p.screen === screen);
    return perm ? Boolean(perm[action]) : false;
  };

  // Central Navigation Handler: Always resets tournament search and selection when clicking sidebar
  const handleNavTab = (tab: 'dashboard' | 'athletes' | 'arenas' | 'venues' | 'categories' | 'tournaments' | 'registrations' | 'duos' | 'matches' | 'results' | 'reports' | 'settings' | 'bracket-tree' | 'super8') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (tab === 'registrations') {
      setSelectedRegTournamentId('');
      setSearchRegTournamentTerm('');
      setFilterRegCategory('ALL');
      setFilterRegStatus('ALL');
      setFilterRegPaymentStatus('ALL');
      setSearchRegAthleteTerm('');
    } else if (tab === 'duos') {
      setSelectedDuoTournamentId('');
      setSearchDuoTournamentTerm('');
      setFilterDuoStatus('ALL');
      setFilterDuoArenaId('ALL');
      setFilterDuoCategory('ALL');
    } else if (tab === 'matches') {
      setSelectedMatchTournamentId('');
      setSearchMatchTournamentTerm('');
      setFilterMatchStatus('ALL');
      setFilterMatchArenaId('ALL');
      setFilterMatchCategory('ALL');
    } else if (tab === 'results') {
      setSelectedResultTournamentId('');
      setSearchResultTournamentTerm('');
      setFilterResultStatus('ALL');
      setFilterResultArenaId('ALL');
      setFilterResultCategory('ALL');
    } else if (tab === 'reports') {
      setSelectedReportTournamentId('');
      setSearchReportTournamentTerm('');
      setFilterReportStatus('ALL');
      setFilterReportArenaId('ALL');
      setFilterReportCategory('ALL');
    } else if (tab === 'bracket-tree') {
      const eligibleTours = tournaments;
      const activeTour = eligibleTours.find(t => t.id === selectedTreeTournamentId) || eligibleTours[0];
      if (activeTour) {
        setSelectedTreeTournamentId(activeTour.id);
        const tourCats = categories.filter(c => c.tournamentId === activeTour.id);
        const activeCat = tourCats.find(c => c.id === selectedTreeCategoryId) || tourCats[0];
        if (activeCat) {
          setSelectedTreeCategoryId(activeCat.id);
          fetchTreeData(activeTour.id, activeCat.id);
        }
      }
    }
  };

  const fetchTreeData = async (tourId: string, catId: string) => {
    if (!tourId || !catId) {
      setTreeData(null);
      return;
    }
    try {
      setLoadingTree(true);
      const res = await fetch(`/api/matches/conventional?tournamentId=${tourId}&categoryId=${catId}`);
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);
      } else {
        setTreeData(null);
      }
    } catch (e) {
      setTreeData(null);
    } finally {
      setLoadingTree(false);
    }
  };

  const handleGenerateTreeElimination = async () => {
    if (!selectedTreeTournamentId || !selectedTreeCategoryId) return;
    try {
      setLoadingTree(true);
      const res = await fetch('/api/matches/conventional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTreeTournamentId,
          categoryId: selectedTreeCategoryId,
          action: 'generate-elimination'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Erro ao gerar chave eliminatória.');
      } else {
        showSuccess('Chave eliminatória do mata-mata gerada com sucesso!');
        fetchData();
        fetchTreeData(selectedTreeTournamentId, selectedTreeCategoryId);
      }
    } catch (e: any) {
      showError(e?.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoadingTree(false);
    }
  };

  const handleOpenTreeScoreModal = (matchId: string, duo1Name: string, duo2Name: string, stage: string) => {
    const realMatch = matches.find(m => m.id === matchId);
    if (realMatch) {
      handleLaunchResult(realMatch);
    } else {
      const stageMatch = treeData?.eliminationStages.flatMap(s => s.matches).find(m => m.id === matchId);
      const draftMatch = {
        id: matchId,
        tournamentId: selectedTreeTournamentId,
        categoryId: selectedTreeCategoryId,
        categoryName: treeData?.categoryName,
        duo1Name: stageMatch?.duo1Name || duo1Name,
        duo2Name: stageMatch?.duo2Name || duo2Name,
        duo1Id: stageMatch?.duo1Id,
        duo2Id: stageMatch?.duo2Id,
        stage: stageMatch?.stage || stage,
        games: treeData?.games || 6,
        thaiBreak: treeData?.thaiBreak || true,
        court: stageMatch?.court || 'Quadra 1',
        time: stageMatch?.time || '14:00'
      };
      handleLaunchResult(draftMatch);
    }
  };

  const isTournamentVigente = (t?: Tournament | null) => {
    if (!t) return false;
    if (t.status === 'FINALIZADO') {
      return false;
    }
    if (!t.endDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return t.endDate >= today;
  };

  // Load session from localStorage
  useEffect(() => {
    const cached = localStorage.getItem('arena_bt_session');
    if (cached) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('arena_bt_session');
      }
    }
  }, []);

  // Fetch Data
  const fetchData = async (currentSession = session) => {
    if (!currentSession) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const tournamentsUrl = currentSession.role === 'ARENA_ADMIN' && currentSession.arenaId
        ? `/api/tournaments?arenaId=${currentSession.arenaId}`
        : '/api/tournaments';

      const categoriesUrl = currentSession.role === 'ARENA_ADMIN' && currentSession.arenaId
        ? `/api/categories?arenaId=${currentSession.arenaId}`
        : '/api/categories';

      const registrationsUrl = currentSession.role === 'ARENA_ADMIN' && currentSession.arenaId
        ? `/api/registrations?arenaId=${currentSession.arenaId}`
        : '/api/registrations';

      const duosUrl = currentSession.role === 'ARENA_ADMIN' && currentSession.arenaId
        ? `/api/duos?arenaId=${currentSession.arenaId}`
        : '/api/duos';

      const matchesUrl = currentSession.role === 'ARENA_ADMIN' && currentSession.arenaId
        ? `/api/matches?arenaId=${currentSession.arenaId}`
        : '/api/matches';

      const [resAthletes, resArenas, resVenues, resTournaments, resCategories, resRegistrations, resDuos, resMatches, resProfiles, resUsers] = await Promise.all([
        fetch('/api/athletes'),
        fetch('/api/arenas'),
        fetch('/api/venues'),
        fetch(tournamentsUrl),
        fetch(categoriesUrl),
        fetch(registrationsUrl),
        fetch(duosUrl),
        fetch(matchesUrl),
        fetch('/api/profiles', {
          headers: {
            'x-user-role': currentSession.role,
            'x-user-id': currentSession.id
          }
        }),
        fetch('/api/users', {
          headers: {
            'x-user-role': currentSession.role,
            'x-user-id': currentSession.id
          }
        })
      ]);

      if (!resAthletes.ok || !resArenas.ok || !resVenues.ok || !resTournaments.ok || !resCategories.ok || !resRegistrations.ok || !resDuos.ok || !resMatches.ok) {
        throw new Error('Falha ao carregar os dados do servidor.');
      }

      const athletesData = await resAthletes.json();
      const arenasData: Arena[] = await resArenas.json();
      const venuesData: ArenaVenue[] = await resVenues.json();
      const tournamentsData = await resTournaments.json();
      const categoriesData = await resCategories.json();
      const registrationsData = await resRegistrations.json();
      const duosData = await resDuos.json();
      const matchesData = await resMatches.json();

      if (resProfiles.ok) {
        const profilesData = await resProfiles.json();
        setSystemProfiles(profilesData);
      }
      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setSystemUsers(usersData);
      }

      setAthletes(athletesData);
      setArenas(arenasData);
      setVenues(venuesData);
      setTournaments(tournamentsData);
      setCategories(categoriesData);
      setRegistrations(registrationsData);
      setDuos(duosData);
      setMatches(matchesData);

      // If ARENA_ADMIN, auto-focus their arena view
      if (currentSession.role === 'ARENA_ADMIN' && currentSession.arenaId) {
        const myArena = arenasData.find(a => a.id === currentSession.arenaId);
        if (myArena) {
          setSelectedArena(myArena);
          const resMyAthletes = await fetch(`/api/arenas/${currentSession.arenaId}/athletes`);
          if (resMyAthletes.ok) {
            const myAthletesData = await resMyAthletes.json();
            setArenaAthletes(myAthletesData);
            
            const associatedIds = new Set(myAthletesData.map((a: any) => a.id));
            const filtered = athletesData.filter((a: any) => !associatedIds.has(a.id) && a.status === 'ATIVO');
            setNonArenaAthletes(filtered);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchArenaAthletes = async (arenaId: string) => {
    try {
      const res = await fetch(`/api/arenas/${arenaId}/athletes`);
      if (!res.ok) throw new Error('Falha ao carregar atletas da arena.');
      const data = await res.json();
      setArenaAthletes(data);

      const associatedIds = new Set(data.map((a: any) => a.id));
      const filtered = athletes.filter(a => !associatedIds.has(a.id) && a.status === 'ATIVO');
      setNonArenaAthletes(filtered);
    } catch (err: any) {
      showError(err.message || 'Erro ao carregar atletas da arena.');
    }
  };

  const handleOpenArenaManagement = (arena: Arena) => {
    setSelectedArena(arena);
    fetchArenaAthletes(arena.id);
  };

  const handleCloseArenaManagement = () => {
    if (session?.role === 'ARENA_ADMIN') return;
    setSelectedArena(null);
    setArenaAthletes([]);
    setNonArenaAthletes([]);
  };

  // Notification Helpers
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Authentication Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      localStorage.setItem('arena_bt_session', JSON.stringify(data));
      setSession(data);
      showSuccess(`Bem-vindo, ${data.name}!`);
      setLoginForm({ username: '', password: '' });
      
      if (data.role === 'ARENA_ADMIN') {
        setActiveTab('athletes');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      showError(err.message || 'Erro de autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('arena_bt_session');
    setSession(null);
    setSelectedArena(null);
    setArenaAthletes([]);
    setNonArenaAthletes([]);
    setAthletes([]);
    setArenas([]);
    setTournaments([]);
    setCategories([]);
    showSuccess('Logoff efetuado com sucesso.');
  };

  // Input masks
  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 9) {
      return `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6, 9)}-${v.substring(9)}`;
    } else if (v.length > 6) {
      return `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6)}`;
    } else if (v.length > 3) {
      return `${v.substring(0, 3)}.${v.substring(3)}`;
    }
    return v;
  };

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    } else if (v.length > 6) {
      return `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
    } else if (v.length > 2) {
      return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    }
    return v;
  };

  // Athlete CRUD
  const handleOpenAthleteCreate = () => {
    setEditingAthlete(null);
    setAthleteForm({
      name: '',
      cpf: '',
      birthDate: '',
      gender: 'M',
      phone: '',
      email: '',
      status: 'ATIVO'
    });
    setIsAthleteModalOpen(true);
  };

  const handleOpenAthleteEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setAthleteForm({
      name: athlete.name,
      cpf: formatCPF(athlete.cpf),
      birthDate: athlete.birthDate,
      gender: athlete.gender,
      phone: formatPhone(athlete.phone),
      email: athlete.email,
      status: athlete.status
    });
    setIsAthleteModalOpen(true);
  };

  const handleSaveAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCpf = athleteForm.cpf.replace(/\D/g, '');
    const cleanPhone = athleteForm.phone.replace(/\D/g, '');

    // Client-side CPF validation algorithm based on mathematical digit calculation
    const validateCPFClient = (cpfInput: string): boolean => {
      const clean = cpfInput.replace(/\D/g, '');
      if (clean.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(clean)) return false;

      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i)) * (10 - i);
      }
      let remainder = 11 - (sum % 11);
      let firstDigit = remainder === 10 || remainder === 11 ? 0 : remainder;
      if (firstDigit !== parseInt(clean.charAt(9))) return false;

      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i)) * (11 - i);
      }
      remainder = 11 - (sum % 11);
      let secondDigit = remainder === 10 || remainder === 11 ? 0 : remainder;
      if (secondDigit !== parseInt(clean.charAt(10))) return false;

      return true;
    };

    if (!editingAthlete && !validateCPFClient(cleanCpf)) {
      showError('CPF inválido! Digite corretamente o número do documento.');
      return;
    }

    const payload = {
      ...athleteForm,
      cpf: cleanCpf,
      phone: cleanPhone
    };

    try {
      const url = editingAthlete ? `/api/athletes/${editingAthlete.id}` : '/api/athletes';
      const method = editingAthlete ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar o atleta.');
      }

      const targetArenaId = session?.role === 'ARENA_ADMIN' ? session.arenaId : selectedArena?.id;

      if (!editingAthlete && targetArenaId) {
        await fetch(`/api/arenas/${targetArenaId}/athletes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId: data.id, status: 'ATIVO' })
        });
        showSuccess('Atleta cadastrado globalmente e vinculado com sucesso à arena!');
      } else {
        showSuccess(editingAthlete ? 'Atleta atualizado com sucesso!' : 'Atleta cadastrado com sucesso!');
      }

      setIsAthleteModalOpen(false);
      setSearchGlobalQuery(''); // Reset search query on success
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao processar atleta.');
    }
  };

  // Arena CRUD (SUPER_ADMIN ONLY)
  const handleOpenArenaCreate = () => {
    setEditingArena(null);
    setArenaForm({
      name: '',
      owner: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      status: 'ATIVA',
      adminUsername: '',
      adminPassword: ''
    });
    setIsArenaModalOpen(true);
  };

  const handleOpenArenaEdit = (arena: Arena) => {
    setEditingArena(arena);
    setArenaForm({
      name: arena.name,
      owner: arena.owner,
      email: arena.email,
      phone: formatPhone(arena.phone),
      city: arena.city,
      state: arena.state,
      status: arena.status,
      adminUsername: arena.adminUsername || '',
      adminPassword: arena.adminPassword || ''
    });
    setIsArenaModalOpen(true);
  };

  const handleSaveArena = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = arenaForm.phone.replace(/\D/g, '');

    const payload = {
      ...arenaForm,
      phone: cleanPhone
    };

    try {
      const url = editingArena ? `/api/arenas/${editingArena.id}` : '/api/arenas';
      const method = editingArena ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar a arena.');
      }

      showSuccess(editingArena ? 'Arena e credenciais atualizadas!' : 'Arena e credenciais criadas!');
      setIsArenaModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar arena.');
    }
  };

  const handleDeleteArena = (arena: Arena) => {
    requestConfirmation(
      'Excluir Organizador',
      `Atenção: Ao excluir o organizador "${arena.name}", todos os torneios vinculados a ele, além das categorias, inscrições e duplas formadas serão excluídos permanentemente. Deseja realmente continuar?`,
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/arenas/${arena.id}`, { method: 'DELETE' });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir arena.');
          }

          if (selectedArena?.id === arena.id) {
            setSelectedArena(null);
          }

          showSuccess('Organizador e todos os seus torneios, categorias, inscrições e duplas foram excluídos com sucesso!');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir organizador.');
        }
      }
    );
  };

  // Physical Arena (Locais de Evento) Handlers
  const handleOpenVenueCreate = () => {
    setEditingVenue(null);
    setVenueForm({
      name: '',
      city: '',
      state: '',
      address: '',
      courtsCount: 6,
      contactPhone: '',
      status: 'ATIVA'
    });
    setIsVenueModalOpen(true);
  };

  const handleOpenVenueEdit = (v: ArenaVenue) => {
    setEditingVenue(v);
    setVenueForm({
      name: v.name,
      city: v.city,
      state: v.state,
      address: v.address || '',
      courtsCount: v.courtsCount || 4,
      contactPhone: formatPhone(v.contactPhone || ''),
      status: v.status
    });
    setIsVenueModalOpen(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVenue ? `/api/venues/${editingVenue.id}` : '/api/venues';
      const method = editingVenue ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...venueForm,
          contactPhone: venueForm.contactPhone.replace(/\D/g, ''),
          courtsCount: Number(venueForm.courtsCount) || 1
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar arena.');
      showSuccess(editingVenue ? 'Arena atualizada com sucesso!' : 'Arena cadastrada com sucesso!');
      setIsVenueModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar arena.');
    }
  };

  const handleDeleteVenue = (v: ArenaVenue) => {
    requestConfirmation(
      'Excluir Arena (Local)',
      `Deseja realmente excluir a arena "${v.name}" (${v.courtsCount} quadras)?`,
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/venues/${v.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Erro ao excluir arena.');
          showSuccess('Arena excluída com sucesso!');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir arena.');
        }
      }
    );
  };

  // Match Court Quick Reassignment Handlers
  const handleOpenChangeCourt = (match: any) => {
    setTargetMatchForCourt(match);
    setSelectedCourtName(match.court || 'Quadra 1');
    setIsChangeCourtModalOpen(true);
  };

  const handleSaveChangedCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMatchForCourt) return;
    try {
      const res = await fetch(`/api/matches/${targetMatchForCourt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court: selectedCourtName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar quadra.');
      showSuccess(`Partida transferida para ${selectedCourtName} com sucesso!`);
      setIsChangeCourtModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao transferir quadra.');
    }
  };

  // Arena Athlete relationships
  const handleToggleArenaAthleteStatus = async (athleteId: string, currentStatus: 'ATIVO' | 'BLOQUEADO') => {
    const targetArenaId = session?.role === 'ARENA_ADMIN' ? session.arenaId : selectedArena?.id;
    if (!targetArenaId) return;

    try {
      const nextAtivo = currentStatus === 'BLOQUEADO';
      const res = await fetch(`/api/arenas/${targetArenaId}/athletes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, ativo: nextAtivo })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar status.');

      showSuccess(`Status do atleta alterado com sucesso!`);
      fetchArenaAthletes(targetArenaId);
    } catch (err: any) {
      showError(err.message || 'Erro ao processar status.');
    }
  };

  const handleAssociateAthlete = async (athleteId: string) => {
    const targetArenaId = session?.role === 'ARENA_ADMIN' ? session.arenaId : selectedArena?.id;
    if (!targetArenaId) return;

    try {
      const res = await fetch(`/api/arenas/${targetArenaId}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, status: 'ATIVO' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao associar atleta.');

      showSuccess('Atleta associado com sucesso!');
      fetchArenaAthletes(targetArenaId);
    } catch (err: any) {
      showError(err.message || 'Erro ao processar associação.');
    }
  };

  const handleRemoveAssociation = (athleteId: string) => {
    const targetArenaId = session?.role === 'ARENA_ADMIN' ? session.arenaId : selectedArena?.id;
    if (!targetArenaId) return;

    requestConfirmation(
      'Remover Vínculo',
      'Deseja realmente remover o vínculo deste atleta com o organizador?',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/arenas/${targetArenaId}/athletes?athleteId=${athleteId}`, {
            method: 'DELETE'
          });

          if (!res.ok) throw new Error('Erro ao remover vínculo.');

          showSuccess('Vínculo removido com sucesso!');
          fetchArenaAthletes(targetArenaId);
        } catch (err: any) {
          showError(err.message || 'Erro ao remover vínculo.');
        }
      },
      'Remover Vínculo'
    );
  };

  // REAL API TORNEIOS CRUD WITH CATEGORIES SYNCHRONIZATION
  const handleOpenTournamentCreate = () => {
    setEditingTournament(null);
    const initialVenue = venues.find(v => v.status === 'ATIVA') || venues[0];
    const defaultMaxCourts = initialVenue ? (initialVenue.courtsCount || 1) : 4;
    setTourForm({
      name: '',
      seriesName: '',
      arenaId: session?.arenaId || (arenas[0]?.id || ''),
      venueId: initialVenue?.id || '',
      courtsUsed: defaultMaxCourts,
      startDate: '',
      endDate: '',
      status: 'INSCRICOES_ABERTAS',
      games: 6,
      thaiBreak: true
    });

    // Carregar as categorias pré-cadastradas no sistema para seleção no torneio
    const masterCats = categories.filter(c => (!c.tournamentId || c.tournamentId === 'GLOBAL') && ['MASCULINO', 'FEMININO', 'MISTA'].includes(c.type));
    const availableCats = masterCats.length > 0 ? masterCats : STANDARD_CATEGORIES.map(std => ({
      id: `std-${std.type}-${std.level}`,
      name: `${std.type} ${std.level}`,
      type: std.type,
      level: std.level,
      price: 100,
      maxParticipants: 16,
      status: 'ATIVA'
    }));

    const initialCats = availableCats
      .filter(c => c.status !== 'INATIVA')
      .map(c => ({
        masterCategoryId: c.id,
        name: c.name || `${c.type} ${c.level}`,
        type: c.type,
        level: c.level,
        price: c.price || 100,
        maxParticipants: c.maxParticipants || 16,
        enabled: false
      }));
    setTourCategories(initialCats);

    setIsTourModalOpen(true);
  };

  const handleOpenTournamentEdit = (t: Tournament) => {
    setEditingTournament(t);
    const matchedVenue = venues.find(v => v.id === t.venueId) || venues[0];
    const maxCourtsOfVenue = matchedVenue ? (matchedVenue.courtsCount || 1) : 4;
    const tGames = (t as any).games === 4 ? 4 : 6;
    const tThaiBreak = tGames === 6 ? ((t as any).thaiBreak === true) : false;
    setTourForm({
      name: t.name,
      seriesName: t.seriesName,
      arenaId: t.arenaId,
      venueId: t.venueId || (matchedVenue?.id || ''),
      courtsUsed: t.courtsUsed || maxCourtsOfVenue,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      games: tGames,
      thaiBreak: tThaiBreak
    });

    // Mapear categorias pré-cadastradas sincronizando com as ativadas para este torneio
    const masterCats = categories.filter(c => (!c.tournamentId || c.tournamentId === 'GLOBAL') && ['MASCULINO', 'FEMININO', 'MISTA'].includes(c.type));
    const availableCats = masterCats.length > 0 ? masterCats : STANDARD_CATEGORIES.map(std => ({
      id: `std-${std.type}-${std.level}`,
      name: `${std.type} ${std.level}`,
      type: std.type,
      level: std.level,
      price: 100,
      maxParticipants: 16,
      status: 'ATIVA'
    }));

    const initialCats = availableCats.map(std => {
      const matchCat = categories.find(c => c.tournamentId === t.id && (c.masterCategoryId === std.id || (c.type === std.type && c.level === std.level)));
      return {
        masterCategoryId: std.id,
        name: std.name || `${std.type} ${std.level}`,
        type: std.type,
        level: std.level,
        price: matchCat ? matchCat.price : (std.price || 100),
        maxParticipants: matchCat ? (matchCat.maxParticipants || 16) : (std.maxParticipants || 16),
        enabled: !!matchCat
      };
    });
    setTourCategories(initialCats);

    setIsTourModalOpen(true);
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveGames = tourForm.games === 4 ? 4 : 6;
    const effectiveThaiBreak = effectiveGames === 6 ? tourForm.thaiBreak === true : false;

    const payload = {
      ...tourForm,
      arenaId: session?.role === 'ARENA_ADMIN' ? session.arenaId : tourForm.arenaId,
      venueId: tourForm.venueId,
      courtsUsed: Number(tourForm.courtsUsed) || 1,
      games: effectiveGames,
      thaiBreak: effectiveThaiBreak,
      enabledCategories: tourCategories.map(c => ({
        ...c,
        games: effectiveGames,
        thaiBreak: effectiveThaiBreak
      }))
    };

    try {
      const url = editingTournament ? `/api/tournaments/${editingTournament.id}` : '/api/tournaments';
      const method = editingTournament ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar o torneio.');
      }

      showSuccess(editingTournament ? 'Torneio e categorias atualizados!' : 'Torneio e categorias criados com sucesso!');
      setIsTourModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar torneio.');
    }
  };

  const handleDeleteTournament = (id: string) => {
    requestConfirmation(
      'Excluir Torneio',
      'Deseja realmente excluir este torneio permanentemente? Todas as categorias, inscrições e duplas vinculadas a ele também serão excluídas.',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir torneio.');
          }

          showSuccess('Torneio excluído com sucesso!');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir.');
        }
      }
    );
  };

  // REAL API CATEGORIAS CRUD (EXCLUSIVO SUPER ADMIN - PRÉ-CADASTRO DO SISTEMA)
  const handleOpenCategoryCreate = () => {
    if (!session || session.role !== 'SUPER_ADMIN') {
      showError('Acesso restrito: Apenas o Super Admin pode cadastrar categorias.');
      return;
    }
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      tournamentId: 'GLOBAL',
      type: 'MASCULINO',
      level: 'C',
      price: 100,
      maxParticipants: 16,
      games: 4,
      thaiBreak: false,
      status: 'ATIVA',
      description: ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenCategoryEdit = (c: Category) => {
    if (!session || session.role !== 'SUPER_ADMIN') {
      showError('Acesso restrito: Apenas o Super Admin pode editar categorias.');
      return;
    }
    setEditingCategory(c);
    setCategoryForm({
      name: c.name || `${c.type} ${c.level}`,
      tournamentId: c.tournamentId || 'GLOBAL',
      type: c.type,
      level: c.level,
      price: c.price,
      maxParticipants: c.maxParticipants || 16,
      games: c.games === 6 ? 6 : 4,
      thaiBreak: c.thaiBreak === true,
      status: c.status || 'ATIVA',
      description: c.description || ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleDuplicateCategory = (c: Category) => {
    if (!session || session.role !== 'SUPER_ADMIN') {
      showError('Acesso restrito: Apenas o Super Admin pode duplicar categorias.');
      return;
    }
    setEditingCategory(null);
    setCategoryForm({
      name: `${c.name || `${c.type} ${c.level}`} (Cópia)`,
      tournamentId: c.tournamentId || 'GLOBAL',
      type: c.type,
      level: c.level,
      price: c.price,
      maxParticipants: c.maxParticipants || 16,
      games: c.games === 6 ? 6 : 4,
      thaiBreak: c.thaiBreak === true,
      status: 'ATIVA',
      description: c.description || ''
    });
    setIsCategoryModalOpen(true);
    showSuccess(`Dados copiados de "${c.name || `${c.type} ${c.level}`}". Ajuste os campos e clique em Salvar.`);
  };

  const handleToggleCategoryStatus = async (c: Category) => {
    if (!session || session.role !== 'SUPER_ADMIN') return;
    const nextStatus = c.status === 'INATIVA' ? 'ATIVA' : 'INATIVA';
    try {
      const res = await fetch(`/api/categories/${c.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar status');
      showSuccess(`Categoria ${nextStatus === 'ATIVA' ? 'ativada' : 'desativada'} com sucesso!`);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao processar status.');
    }
  };

  const handleResetCategoriesPresets = async () => {
    if (!session || session.role !== 'SUPER_ADMIN') return;
    requestConfirmation(
      'Restaurar Categorias Oficiais',
      'Deseja carregar todas as categorias oficiais padrão do Beach Tennis (Open, A, B, C, D, Iniciante, Principiante e Mistas) no sistema?',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch('/api/categories?action=presets', {
            method: 'POST',
            headers: {
              'x-user-role': session.role
            }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Erro ao restaurar categorias.');
          showSuccess(`Categorias oficiais restauradas/sincronizadas com sucesso! (${data.count || 0} novas adicionadas)`);
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao restaurar padrões.');
        }
      },
      'Sincronizar Categorias'
    );
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || session.role !== 'SUPER_ADMIN') {
      showError('Acesso negado: Apenas o Super Admin tem permissão para gerenciar categorias.');
      return;
    }
    setErrorMsg(null);

    const payload = {
      name: categoryForm.name.trim() || `${categoryForm.type} ${categoryForm.level}`,
      tournamentId: categoryForm.tournamentId || 'GLOBAL',
      type: categoryForm.type,
      level: categoryForm.level,
       price: Number(categoryForm.price),
       maxParticipants: Number(categoryForm.maxParticipants),
       games: categoryForm.games,
       thaiBreak: categoryForm.thaiBreak,
       status: categoryForm.status,
      description: categoryForm.description.trim()
    };

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-user-arena-id': session.arenaId || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar a categoria.');
      }

      showSuccess(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria pré-cadastrada com sucesso!');
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao processar categoria.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (!session) return;
    requestConfirmation(
      'Excluir Categoria',
      'Deseja realmente excluir esta categoria? As inscrições e jogos vinculados a ela serão afetados.',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
              'x-user-role': session.role
            }
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir categoria.');
          }

          showSuccess('Categoria excluída com sucesso.');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir.');
        }
      }
    );
  };

  // Dynamic Registrations CRUD
  const handleOpenRegistrationCreate = (targetTourId?: string) => {
    const tId = targetTourId || selectedRegTournamentId || tournaments[0]?.id || '';
    const tour = tournaments.find(t => t.id === tId);
    if (tour && !isTournamentVigente(tour)) {
      showError(`Inscrições encerradas. O período vigente deste torneio expirou em ${new Date(tour.endDate).toLocaleDateString('pt-BR')}. Não é permitido inscrever atletas após o término. Gere uma nova edição deste torneio.`);
      return;
    }
    setRegForm({
      tournamentId: tId,
      categoryId: '',
      selectedAthleteIds: [],
      status: 'PENDENTE_PAGAMENTO'
    });
    setIsRegModalOpen(true);
  };

  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.tournamentId || !regForm.categoryId || regForm.selectedAthleteIds.length === 0) {
      showError('Por favor selecione o torneio, a categoria e pelo menos um atleta.');
      return;
    }

    const targetTour = tournaments.find(t => t.id === regForm.tournamentId);
    if (targetTour && !isTournamentVigente(targetTour)) {
      showError(`Inscrições encerradas. O período vigente deste torneio expirou em ${new Date(targetTour.endDate).toLocaleDateString('pt-BR')}. Gere uma nova edição.`);
      return;
    }

    try {
      const results = await Promise.all(
        regForm.selectedAthleteIds.map(async (athleteId) => {
          const res = await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tournamentId: regForm.tournamentId,
              categoryId: regForm.categoryId,
              athleteId: athleteId,
              status: regForm.status
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Falha ao registrar inscrição.');
          return data;
        })
      );
      showSuccess(results.length + ' atleta(s) inscrito(s) com sucesso!');
      setIsRegModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar inscrição.';
      showError(msg);
    }
  };

  const handleCancelRegistration = (id: string) => {
    requestConfirmation(
      'Cancelar Inscrição',
      'Deseja realmente cancelar esta inscrição e liberar a vaga na categoria?',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Falha ao cancelar inscrição.');
          showSuccess('Inscrição cancelada!');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao cancelar.');
        }
      },
      'Sim, Cancelar'
    );
  };

  const handleUpdateRegistrationStatus = async (id: string, newStatus: 'PENDENTE_PAGAMENTO' | 'CONFIRMADA' | 'CANCELADA') => {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar status.');
      showSuccess('Status da inscrição atualizado com sucesso!');
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao atualizar status.');
    }
  };

  // Dynamic Duos CRUD
  const handleOpenDuoCreate = (tourId?: string) => {
    setDuoForm({
      tournamentId: tourId || selectedDuoTournamentId || tournaments[0]?.id || '',
      categoryId: '',
      player1Id: '',
      player2Id: ''
    });
    setIsDuoModalOpen(true);
  };

  const handleCreateDuo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duoForm.player1Id || !duoForm.player2Id || !duoForm.categoryId) {
      showError('Selecione os dois jogadores da dupla.');
      return;
    }
    try {
      const res = await fetch('/api/duos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duoForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar dupla.');
      showSuccess('Dupla formada com sucesso!');
      setIsDuoModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao criar dupla.');
    }
  };

  const handleDeleteDuo = (id: string) => {
    requestConfirmation(
      'Desfazer Dupla',
      'Deseja realmente desfazer esta dupla de jogo?',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/duos/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Falha ao desfazer dupla.');
          showSuccess('Dupla desfeita com sucesso!');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao desfazer.');
        }
      },
      'Desfazer'
    );
  };

  // Dynamic Matches CRUD & Generator
  const handleOpenMatchCreate = (tourId?: string) => {
    setMatchForm({
      tournamentId: tourId || selectedMatchTournamentId || tournaments[0]?.id || '',
      categoryId: '',
      stage: 'Fase de Grupos',
      groupName: 'Grupo Único',
      duo1Id: '',
      duo2Id: '',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      court: 'Quadra 1'
    });
    setIsMatchModalOpen(true);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar jogo.');
      showSuccess('Jogo agendado com sucesso!');
      setIsMatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao criar jogo.');
    }
  };

  const handleDeleteMatch = (id: string) => {
    requestConfirmation(
      'Excluir Partida',
      'Deseja realmente excluir esta partida do chaveamento?',
      async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Falha ao excluir partida.');
          showSuccess('Partida excluída com sucesso.');
          fetchData();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir.');
        }
      }
    );
  };

  const handleOpenGenMatches = (tourId?: string) => {
    setGenForm({
      tournamentId: tourId || selectedMatchTournamentId || tournaments[0]?.id || '',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      court: 'Quadra 1'
    });
    setIsGenModalOpen(true);
  };

  const handleGenerateMatches = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar jogos.');
      showSuccess(`${data.count} jogos gerados com sucesso para a categoria!`);
      setIsGenModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao gerar.');
    }
  };

  // Persisted Scoring & WO handlers
  const handleLaunchResult = (match: any) => {
    setSelectedMatch(match);
    const matchGames = match.games !== undefined ? match.games : 4;
    const matchThaiBreak = match.thaiBreak === true;
    setResultForm({
      score: match.score || '',
      winnerDuoId: match.duo1Id || '',
      scoreA: 4,
      scoreB: 2,
      winnerTeam: 'TEAM_A',
      games: matchGames,
      thaiBreak: matchThaiBreak,
      isDraw: false,
      tieBreakerReason: ''
    });
    setIsResultModalOpen(true);
  };

  const handleSaveResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      const payload = resultForm.isDraw ? {
        score: resultForm.score,
        winnerDuoId: '',
        scoreA: resultForm.scoreA,
        scoreB: resultForm.scoreB,
        isDraw: true,
        isWO: false
      } : {
        score: resultForm.score,
        winnerDuoId: resultForm.winnerDuoId,
        scoreA: resultForm.scoreA,
        scoreB: resultForm.scoreB,
        isWO: false
      };

      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar resultado.');
      
      const freedCourt = data.freedCourt || selectedMatch.court;
      if (data.nextMatchSuggestion) {
        setCourtFreedNotice({
          freedCourt,
          nextMatchSuggestion: data.nextMatchSuggestion
        });
        showSuccess(`Placar registrado com sucesso! A ${freedCourt} foi liberada.`);
      } else {
        showSuccess(`Placar salvo com sucesso! A ${freedCourt} agora está livre.`);
      }

      if (data.tieBreaker) {
        showSuccess(`Resultado registrado! Empate resolvido: ${data.tieBreaker}`);
      }
      setIsResultModalOpen(false);
      fetchData();
      if (selectedTreeTournamentId && selectedTreeCategoryId) {
        fetchTreeData(selectedTreeTournamentId, selectedTreeCategoryId);
      }
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar placar.');
    }
  };

  const handleToggleWO = (match: any) => {
    setSelectedMatch(match);
    setWoForm({
      winnerDuoId: match.duo1Id || '',
      winnerTeam: 'TEAM_A'
    });
    setIsWoModalOpen(true);
  };

  const handleSaveWoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      const payload = {
        winnerDuoId: woForm.winnerDuoId,
        isWO: true
      };

      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar WO.');
      
      const freedCourt = data.freedCourt || selectedMatch.court;
      if (data.nextMatchSuggestion) {
        setCourtFreedNotice({
          freedCourt,
          nextMatchSuggestion: data.nextMatchSuggestion
        });
        showSuccess(`W.O. registrado! ${freedCourt} liberada para o próximo jogo.`);
      } else {
        showSuccess(`W.O. registrado com sucesso! ${freedCourt} liberada.`);
      }

      setIsWoModalOpen(false);
      fetchData();
      if (selectedTreeTournamentId && selectedTreeCategoryId) {
        fetchTreeData(selectedTreeTournamentId, selectedTreeCategoryId);
      }
    } catch (err: any) {
      showError(err.message || 'Erro ao registrar WO.');
    }
  };

  // Computed listings
  const filteredAthletes = athletes.filter(a => {
    const search = searchAthlete.toLowerCase();
    return a.name.toLowerCase().includes(search) || a.cpf.includes(search);
  });

  const filteredArenas = arenas.filter(a => {
    return a.name.toLowerCase().includes(searchArena.toLowerCase()) || 
           a.city.toLowerCase().includes(searchArena.toLowerCase());
  });

  const filteredVenues = venues.filter(v => {
    const s = searchVenue.toLowerCase();
    return v.name.toLowerCase().includes(s) || 
           v.city.toLowerCase().includes(s) ||
           (v.address && v.address.toLowerCase().includes(s));
  });

  const filteredTournaments = tournaments.filter(t => {
    return t.name.toLowerCase().includes(searchTournament.toLowerCase()) ||
           t.seriesName.toLowerCase().includes(searchTournament.toLowerCase());
  });

  const filteredCategories = categories.filter(c => {
    const search = searchCategory.toLowerCase();
    const matchesSearch = !searchCategory || 
      (c.name && c.name.toLowerCase().includes(search)) ||
      (c.tournamentName && c.tournamentName.toLowerCase().includes(search)) ||
      c.type.toLowerCase().includes(search) ||
      c.level.toLowerCase().includes(search);

    const matchesTournament = filterCategoryTournament === 'ALL' || 
      (filterCategoryTournament === 'GLOBAL' ? (!c.tournamentId || c.tournamentId === 'GLOBAL') : c.tournamentId === filterCategoryTournament);
    const matchesType = filterCategoryType === 'ALL' || c.type === filterCategoryType;
    const matchesLevel = filterCategoryLevel === 'ALL' || c.level === filterCategoryLevel;
    const matchesStatus = filterCategoryStatus === 'ALL' || (c.status || 'ATIVA') === filterCategoryStatus;

    return matchesSearch && matchesTournament && matchesType && matchesLevel && matchesStatus;
  });

  // RENDER LOGIN VIEW
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 z-10 shadow-sm space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 justify-center items-center shadow-xs">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">BtControl</h1>
            <p className="text-xs text-slate-500 font-medium">Gestão Profissional de Beach Tennis</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Acesso Rápido para Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button 
                type="button"
                onClick={() => setLoginForm({ username: 'admin', password: 'admin123' })}
                className="bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 p-2.5 rounded-xl text-slate-700 transition text-left group cursor-pointer"
              >
                <strong className="block text-slate-900 group-hover:text-emerald-700 transition-colors">Super Admin</strong>
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">admin / admin123</span>
              </button>

              <button 
                type="button"
                onClick={() => setLoginForm({ username: 'ipanema', password: 'ipa123' })}
                className="bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 p-2.5 rounded-xl text-slate-700 transition text-left group cursor-pointer"
              >
                <strong className="block text-slate-900 group-hover:text-emerald-700 transition-colors">Ipanema Admin</strong>
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">ipanema / ipa123</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">Nome de Usuário</label>
              <input 
                type="text"
                required
                placeholder="Digite seu usuário..."
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">Senha de Acesso</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition font-mono"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Acessar Sistema
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">BtControl</span>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 font-medium">Beach Tennis Hub</p>
            </div>
          </div>

          <nav className="p-3.5 space-y-1 text-xs">
            <button 
              onClick={() => { setActiveTab('dashboard'); handleCloseArenaManagement(); }}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>{session.role === 'SUPER_ADMIN' ? 'Painel Geral' : 'Painel da Arena'}</span>
            </button>

            {/* ÍCONE / MENU CADASTRAR */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsCadastrarExpanded(!isCadastrarExpanded)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer ${
                  ['athletes', 'arenas', 'venues', 'categories'].includes(activeTab)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    ['athletes', 'arenas', 'venues', 'categories'].includes(activeTab)
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <FolderPlus className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="font-bold tracking-tight text-[13px]">Cadastrar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono tabular-nums font-bold border border-slate-200">
                    {session.role === 'SUPER_ADMIN' ? '4' : '2'}
                  </span>
                  {isCadastrarExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isCadastrarExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden pl-3.5 pr-1 pt-1.5 space-y-1 border-l border-slate-200 ml-4 my-1"
                  >
                    {/* Opção 1: Atletas Globais */}
                    <button 
                      onClick={() => { setActiveTab('athletes'); handleCloseArenaManagement(); }}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        activeTab === 'athletes' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'athletes' ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span>{session.role === 'SUPER_ADMIN' ? 'Atletas Globais' : 'Atletas da Arena'}</span>
                    </button>

                    {/* Opção 2: Organizadores */}
                    {session.role === 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => { setActiveTab('arenas'); handleCloseArenaManagement(); }}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                          activeTab === 'arenas' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Organizadores</span>
                      </button>
                    )}

                    {/* Opção 3: Arenas (Locais) */}
                    <button 
                      onClick={() => { setActiveTab('venues'); handleCloseArenaManagement(); }}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        activeTab === 'venues' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Arenas (Locais)</span>
                    </button>

                    {/* Opção 4: Categorias (Super Admin) */}
                    {session.role === 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => { setActiveTab('categories'); handleCloseArenaManagement(); }}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                          activeTab === 'categories' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'categories' ? 'text-emerald-600' : 'text-slate-500'}`} />
                          <span>Categorias</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-semibold">ADMIN</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-200 my-2 pt-2">
              <span className="px-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Torneios &amp; Jogos</span>
            </div>

            <button 
              onClick={() => handleNavTab('tournaments')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'tournaments' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <Trophy className={`w-4 h-4 shrink-0 ${activeTab === 'tournaments' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Torneios</span>
            </button>

            <button 
              onClick={() => handleNavTab('registrations')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'registrations' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <ClipboardList className={`w-4 h-4 shrink-0 ${activeTab === 'registrations' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Inscrições</span>
            </button>

            <button 
              onClick={() => handleNavTab('duos')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'duos' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'duos' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Duplas</span>
            </button>

            <button 
              onClick={() => handleNavTab('matches')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'matches' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'matches' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Jogos / Quadras</span>
            </button>

            <button 
              onClick={() => handleNavTab('results')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'results' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <Award className={`w-4 h-4 shrink-0 ${activeTab === 'results' ? 'text-amber-600' : 'text-amber-500'}`} />
              <span>Resultados / WO</span>
            </button>

            <button 
              onClick={() => handleNavTab('reports')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
            >
              <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Relatórios</span>
            </button>

            {/* GUIA MATA-MATA (CHAVEAMENTO EM ÁRVORE) */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsMataMataExpanded(!isMataMataExpanded)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer ${
                  activeTab === 'bracket-tree'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    activeTab === 'bracket-tree'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    <GitFork className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="font-bold tracking-tight text-[13px]">Mata-Mata</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono font-bold border border-amber-200">
                    Árvore
                  </span>
                  {isMataMataExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isMataMataExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden pl-3.5 pr-1 pt-1.5 space-y-1 border-l border-slate-200 ml-4 my-1"
                  >
                    <button 
                      onClick={() => handleNavTab('bracket-tree')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        activeTab === 'bracket-tree' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Árvore de Torneio</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MÓDULO INDEPENDENTE: SUPER 8 */}
            {canPerform('super8', 'view') && (
              <div className="pt-1">
                <div className="border-t border-slate-200 my-2 pt-2">
                  <span className="px-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Modalidade Individual</span>
                </div>
                <button
                  onClick={() => { handleNavTab('super8'); handleCloseArenaManagement(); }}
                  className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    activeTab === 'super8'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className={`w-4 h-4 shrink-0 ${activeTab === 'super8' ? 'text-amber-600' : 'text-amber-500'}`} />
                    <span>Super 8</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                    INDIV
                  </span>
                </button>
              </div>
            )}

            {/* GUIA CONFIGURAÇÕES (GERAL, USUÁRIOS E PERFIS) */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer ${
                  ['settings', 'profiles', 'users'].includes(activeTab)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    ['settings', 'profiles', 'users'].includes(activeTab)
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-bold tracking-tight text-[13px]">Configurações</span>
                </div>
                {isSettingsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isSettingsExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden pl-3.5 pr-1 pt-1.5 space-y-1 border-l border-slate-200 ml-4 my-1"
                  >
                    <button 
                      onClick={() => { setActiveTab('users'); setSettingsSubTab('users'); }}
                      className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        activeTab === 'users' || (activeTab === 'settings' && settingsSubTab === 'users')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'users' ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span>Usuários</span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                        {systemUsers.length}
                      </span>
                    </button>

                    <button 
                      onClick={() => { setActiveTab('profiles'); setSettingsSubTab('profiles'); }}
                      className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        activeTab === 'profiles' || (activeTab === 'settings' && settingsSubTab === 'profiles')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'profiles' ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span>Perfis</span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                        {systemProfiles.length}
                      </span>
                    </button>

                    <button 
                      onClick={() => { setActiveTab('settings'); setSettingsSubTab('general'); }}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        activeTab === 'settings' && settingsSubTab === 'general'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>Preferências Gerais</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/80 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 uppercase">
              {session.username.substring(0, 2)}
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 leading-none truncate">{session.name}</p>
              <span className="text-[10px] text-emerald-700 font-medium">{session.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin da Arena'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl transition font-semibold border border-slate-200 hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" /> Sair
          </button>
        </div>
      </aside>

      {/* CORE VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-white">
        
        {/* Mobile Navbar Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl bg-slate-100 active:bg-slate-200 transition flex items-center justify-center min-w-[38px] min-h-[38px]"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5 text-emerald-600" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavTab('dashboard')}>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-slate-900">
                BtControl
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeTab === 'dashboard' ? 'Painel' : 
               activeTab === 'tournaments' ? 'Torneios' : 
               activeTab === 'matches' ? 'Jogos' : 
               activeTab === 'duos' ? 'Duplas' : 
               activeTab === 'registrations' ? 'Inscrições' : 
               activeTab === 'athletes' ? 'Atletas' : 
               activeTab === 'results' ? 'Resultados' : 
               activeTab === 'arenas' ? 'Arenas' : 
               activeTab === 'venues' ? 'Locais' : 
               activeTab === 'categories' ? 'Categorias' : 
               activeTab === 'bracket-tree' ? 'Mata-Mata' :
               activeTab === 'super8' ? 'Super 8' : activeTab}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 rounded-xl bg-slate-100 active:bg-slate-200 transition"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Drawer Slide-over */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white border-r border-slate-200 z-50 flex flex-col justify-between md:hidden shadow-2xl"
              >
                <div className="flex flex-col overflow-y-auto">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-base font-extrabold text-slate-900">
                          BtControl
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">Menu Principal</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg bg-slate-100"
                      aria-label="Fechar menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="p-3 space-y-1 text-xs">
                    <button 
                      onClick={() => { handleNavTab('dashboard'); handleCloseArenaManagement(); }}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                      <Activity className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{session.role === 'SUPER_ADMIN' ? 'Painel Geral' : 'Painel da Arena'}</span>
                    </button>

                    {/* Cadastrar accordion no mobile */}
                    <div className="pt-1">
                      <button 
                        type="button"
                        onClick={() => setIsCadastrarExpanded(!isCadastrarExpanded)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold transition-all ${
                          ['athletes', 'arenas', 'venues', 'categories'].includes(activeTab)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                            <FolderPlus className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <span className="font-bold tracking-tight text-[13px]">Cadastrar</span>
                        </div>
                        {isCadastrarExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>

                      {isCadastrarExpanded && (
                        <div className="pl-3.5 pr-1 pt-1 space-y-1 border-l border-slate-200 ml-4 my-1">
                          <button 
                            onClick={() => { handleNavTab('athletes'); handleCloseArenaManagement(); }}
                            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'athletes' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{session.role === 'SUPER_ADMIN' ? 'Atletas Globais' : 'Atletas da Arena'}</span>
                          </button>

                          {session.role === 'SUPER_ADMIN' && (
                            <>
                              <button 
                                onClick={() => { handleNavTab('arenas'); handleCloseArenaManagement(); }}
                                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'arenas' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                <Shield className="w-3.5 h-3.5 text-amber-600" />
                                <span>Organizadores</span>
                              </button>

                              <button 
                                onClick={() => { handleNavTab('venues'); handleCloseArenaManagement(); }}
                                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'venues' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                <Building className="w-3.5 h-3.5 text-teal-600" />
                                <span>Arenas Físicas</span>
                              </button>

                              <button 
                                onClick={() => { handleNavTab('categories'); handleCloseArenaManagement(); }}
                                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'categories' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Categorias</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 my-2 pt-2">
                      <span className="px-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Torneios &amp; Jogos</span>
                    </div>

                    <button 
                      onClick={() => handleNavTab('tournaments')}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'tournaments' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Trophy className="w-4 h-4 text-emerald-600" />
                      <span>Torneios</span>
                    </button>

                    <button 
                      onClick={() => handleNavTab('registrations')}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'registrations' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <ClipboardList className="w-4 h-4 text-emerald-600" />
                      <span>Inscrições</span>
                    </button>

                    <button 
                      onClick={() => handleNavTab('duos')}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'duos' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Duplas</span>
                    </button>

                    <button 
                      onClick={() => handleNavTab('matches')}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'matches' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Jogos / Quadras</span>
                    </button>

                    <button 
                      onClick={() => handleNavTab('results')}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'results' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Resultados / WO</span>
                    </button>

                    <button 
                      onClick={() => handleNavTab('reports')}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-semibold transition-all ${activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Relatórios</span>
                    </button>

                    {/* Guia Mata-Mata no Mobile */}
                    <div className="pt-1">
                      <button 
                        type="button"
                        onClick={() => setIsMataMataExpanded(!isMataMataExpanded)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold transition-all ${
                          activeTab === 'bracket-tree'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                            <GitFork className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <span className="font-bold tracking-tight text-[13px]">Mata-Mata</span>
                        </div>
                        {isMataMataExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>

                      {isMataMataExpanded && (
                        <div className="pl-3.5 pr-1 pt-1 space-y-1 border-l border-slate-200 ml-4 my-1">
                          <button 
                            onClick={() => handleNavTab('bracket-tree')}
                            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'bracket-tree' ? 'bg-amber-50 text-amber-800' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-600" />
                            <span>Árvore de Torneio</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Módulo Independente Super 8 no Mobile */}
                    {canPerform('super8', 'view') && (
                      <div className="pt-1">
                        <div className="border-t border-slate-200 my-2 pt-2">
                          <span className="px-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Modalidade Individual</span>
                        </div>
                        <button
                          onClick={() => { handleNavTab('super8'); handleCloseArenaManagement(); }}
                          className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl font-semibold transition-all ${
                            activeTab === 'super8'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span>Super 8</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                            INDIV
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Configurações accordion no mobile */}
                    <div className="pt-1">
                      <button 
                        type="button"
                        onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-semibold transition-all ${
                          ['settings', 'profiles', 'users'].includes(activeTab)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center">
                            <Settings className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <span className="font-bold tracking-tight text-[13px]">Configurações</span>
                        </div>
                        {isSettingsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>

                      {isSettingsExpanded && (
                        <div className="pl-3.5 pr-1 pt-1 space-y-1 border-l border-slate-200 ml-4 my-1">
                          <button 
                            onClick={() => { setActiveTab('users'); setSettingsSubTab('users'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'users' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Usuários ({systemUsers.length})</span>
                          </button>

                          <button 
                            onClick={() => { setActiveTab('profiles'); setSettingsSubTab('profiles'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'profiles' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Perfis ({systemProfiles.length})</span>
                          </button>

                          <button 
                            onClick={() => { setActiveTab('settings'); setSettingsSubTab('general'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${activeTab === 'settings' && settingsSubTab === 'general' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span>Geral</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </nav>
                </div>

                <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 uppercase">
                      {session.username.substring(0, 2)}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 leading-none truncate">{session.name}</p>
                      <span className="text-[10px] text-emerald-700 font-medium">{session.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin da Arena'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl transition font-semibold border border-slate-200 hover:border-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" /> Sair
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Notifications inside Viewport */}
        <div className="p-3.5 sm:p-5 md:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto flex flex-col gap-4 sm:gap-6">

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 text-sm font-medium">Carregando painel de controle...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* VIEW 1: DASHBOARD */}
              {activeTab === 'dashboard' && (session.role === 'ARENA_ADMIN' || !selectedArena) && (
                <motion.div key="db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Hero Banner */}
                  <div className="bg-gradient-to-br from-white via-white to-emerald-50/50 border border-slate-200 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xs">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            {session.role === 'SUPER_ADMIN' ? 'Central Geral de Controle' : 'Painel do Organizador'}
                          </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          Bem-vindo ao BtControl
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                          {session.role === 'SUPER_ADMIN' 
                            ? 'Gestão unificada em tempo real de organizadores, arenas com quadras, torneios, categorias e atletas cadastrados.'
                            : `Painel de gerenciamento exclusivo de ${arenas.find(a => a.id === session.arenaId)?.name || session.name}.`}
                        </p>
                      </div>

                      {/* Quick Shortcuts */}
                      <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                        <button 
                          onClick={handleOpenTournamentCreate}
                          className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Novo Torneio
                        </button>
                        <button 
                          onClick={handleOpenVenueCreate}
                          className="flex items-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5 text-amber-600" /> Nova Arena (Local)
                        </button>
                        <button 
                          onClick={handleOpenAthleteCreate}
                          className="flex items-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-600" /> Cadastrar Atleta
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition shadow-xs group">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Atletas Cadastrados</p>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
                        {session.role === 'SUPER_ADMIN' ? athletes.length : arenaAthletes.length}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {session.role === 'SUPER_ADMIN' ? 'Total na plataforma' : 'Vinculados à sua arena'}
                      </p>
                    </div>

                    {session.role === 'SUPER_ADMIN' ? (
                      <div className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition shadow-xs group">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organizadores</p>
                          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Shield className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">{arenas.length}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Clubes e entidades gestoras</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition shadow-xs group">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Meu Organizador</p>
                          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Shield className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-sm font-bold text-amber-700 mt-3 truncate">
                          {arenas.find(a => a.id === session.arenaId)?.name || session.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Perfil autenticado</p>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition shadow-xs group">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Arenas Físicas (Locais)</p>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                          <Building className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-extrabold text-teal-700 font-mono tabular-nums">{venues.length}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({venues.reduce((acc, v) => acc + (v.courtsCount || 0), 0)} quadras)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Espaços com quadras ativas</p>
                    </div>

                    <div className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition shadow-xs group">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Torneios</p>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <Trophy className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">{tournaments.length}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {tournaments.filter(t => t.status === 'INSCRICOES_ABERTAS' || t.status === 'EM_ANDAMENTO').length} em andamento / abertos
                      </p>
                    </div>
                  </div>

                  {/* Summary Section: Active Tournaments */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-600" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Torneios em Destaque</h2>
                      </div>
                      <button 
                        onClick={() => setActiveTab('tournaments')} 
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold transition cursor-pointer"
                      >
                        Ver Todos →
                      </button>
                    </div>

                    {tournaments.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl space-y-2 bg-slate-50/50">
                        <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-medium text-slate-600">Nenhum torneio cadastrado no momento.</p>
                        <button 
                          onClick={handleOpenTournamentCreate} 
                          className="text-xs text-emerald-700 hover:underline font-semibold inline-block cursor-pointer"
                        >
                          Clique aqui para criar o primeiro torneio
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournaments.slice(0, 3).map(t => {
                          const venueObj = venues.find(v => v.id === t.venueId);
                          return (
                            <div key={t.id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">{t.seriesName}</span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                    t.status === 'INSCRICOES_ABERTAS' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                    t.status === 'EM_ANDAMENTO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {t.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{t.name}</h3>
                                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                                  <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span className="truncate">{venueObj?.name || 'Local a definir'}</span>
                                </p>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                                <span className="tabular-nums font-medium">{t.courtsUsed || 4} quadras</span>
                                <button 
                                  onClick={() => setActiveTab('tournaments')} 
                                  className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                                >
                                  Gerenciar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 2: ATHLETES */}
              {activeTab === 'athletes' && !selectedArena && (
                <motion.div key="ath" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        Gestão Global de Atletas
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Base centralizada de atletas cadastrados com controle de CPF, gênero, contato e status.
                      </p>
                    </div>
                    <button 
                      onClick={handleOpenAthleteCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/15"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Atleta
                    </button>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou CPF..." 
                      value={searchAthlete}
                      onChange={(e) => setSearchAthlete(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-4 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                    <div className="text-[11px] text-slate-500 whitespace-nowrap px-1">
                      Total: <strong className="text-slate-900 font-mono">{filteredAthletes.length}</strong> {filteredAthletes.length === 1 ? 'atleta' : 'atletas'}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-md">
                    <table className="w-full min-w-[620px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                          <th className="p-4">Nome</th>
                          <th className="p-4">CPF</th>
                          <th className="p-4">Gênero</th>
                          <th className="p-4">Contato</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredAthletes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-500">
                              Nenhum atleta encontrado com o filtro informado.
                            </td>
                          </tr>
                        ) : (
                          filteredAthletes.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 transition">
                              <td className="p-4 font-bold text-slate-900">{a.name}</td>
                              <td className="p-4 font-mono text-slate-700">{formatCPF(a.cpf)}</td>
                              <td className="p-4 text-slate-700">{a.gender === 'M' ? 'Masculino' : a.gender === 'F' ? 'Feminino' : 'Misto'}</td>
                              <td className="p-4 text-slate-700">{a.email || a.phone || '—'}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                  a.status === 'ATIVO' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleOpenAthleteEdit(a)} 
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                                  title="Editar Atleta"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* VIEW 3: ORGANIZADORES (SUPER_ADMIN ONLY) - FULL CRUD */}
              {activeTab === 'arenas' && !selectedArena && (
                <motion.div key="arenas_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        Gestão de Organizadores
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Clubes e entidades responsáveis pelos campeonatos, credenciais de acesso e administração de atletas vinculados.
                      </p>
                    </div>
                    <button 
                      onClick={handleOpenArenaCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/15"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Novo Organizador
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar organizadores por nome ou cidade..." 
                      value={searchArena}
                      onChange={(e) => setSearchArena(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-4 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                    <div className="text-[11px] text-slate-500 whitespace-nowrap px-1">
                      Total: <strong className="text-slate-900 font-mono">{filteredArenas.length}</strong> {filteredArenas.length === 1 ? 'organizador' : 'organizadores'}
                    </div>
                  </div>

                  {/* Arenas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredArenas.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-200 bg-slate-50 rounded-2xl space-y-2">
                        <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhum organizador cadastrado no momento.</p>
                        <button 
                          onClick={handleOpenArenaCreate}
                          className="text-xs text-emerald-600 hover:underline font-bold inline-block"
                        >
                          Clique aqui para cadastrar um organizador
                        </button>
                      </div>
                    ) : (
                      filteredArenas.map(arena => {
                        const tourCount = tournaments.filter(t => t.arenaId === arena.id).length;
                        return (
                          <div 
                            key={arena.id} 
                            className="bg-white border border-slate-200 hover:border-slate-200 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group"
                          >
                            <div className="space-y-3.5">
                              {/* Card Header: Name + Status */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-emerald-600 transition-colors">
                                    {arena.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <span>{arena.city} - {arena.state}</span>
                                  </p>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  arena.status === 'ATIVA' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}>
                                  {arena.status}
                                </span>
                              </div>

                              {/* Details: Owner, Phone, Email */}
                              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="truncate">
                                  <span className="text-slate-500 font-medium">Responsável:</span>{' '}
                                  <strong className="text-slate-800">{arena.owner || 'Não informado'}</strong>
                                </p>
                                {arena.phone && (
                                  <p className="truncate font-mono">
                                    <span className="text-slate-500 font-sans font-medium">Telefone:</span>{' '}
                                    <span className="text-slate-700">{formatPhone(arena.phone)}</span>
                                  </p>
                                )}
                                {arena.email && (
                                  <p className="truncate">
                                    <span className="text-slate-500 font-medium">E-mail:</span>{' '}
                                    <span className="text-slate-700">{arena.email}</span>
                                  </p>
                                )}
                                <div className="pt-1.5 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                                  <span>Torneios gerenciados:</span>
                                  <strong className="text-emerald-600 font-mono">{tourCount}</strong>
                                </div>
                              </div>

                              {/* Admin Credentials Preview */}
                              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono text-[11px] text-slate-700 space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-600" /> Acesso Administrador</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Usuário:</span>
                                  <strong className="text-slate-800">{arena.adminUsername || '—'}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Senha:</span>
                                  <strong className="text-slate-800">{arena.adminPassword || '••••••'}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Full CRUD Actions */}
                            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-200 gap-2">
                              <button 
                                onClick={() => handleOpenArenaManagement(arena)} 
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition"
                                title="Ver atletas vinculados"
                              >
                                <Users className="w-3.5 h-3.5" /> Atletas
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => handleOpenArenaEdit(arena)} 
                                  className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-200"
                                  title="Editar Organizador e Credenciais"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Editar
                                </button>
                                <button 
                                  onClick={() => handleDeleteArena(arena)} 
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Excluir Organizador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 3B: ARENAS (LOCAIS FÍSICOS DOS EVENTOS COM CONTROLE DE QUADRAS) */}
              {activeTab === 'venues' && (
                <motion.div key="venues_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Building className="w-5 h-5 text-amber-600" />
                        Arenas (Locais dos Eventos)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Espaços e complexos esportivos onde os jogos acontecem, com o total de quadras físicas disponíveis.
                      </p>
                    </div>
                    <button 
                      onClick={handleOpenVenueCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/15"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Nova Arena (Local)
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar arenas por nome, cidade ou endereço..." 
                      value={searchVenue}
                      onChange={(e) => setSearchVenue(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-4 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                    <div className="text-[11px] text-slate-500 whitespace-nowrap px-1">
                      Total: <strong className="text-slate-900 font-mono">{filteredVenues.length}</strong> {filteredVenues.length === 1 ? 'arena' : 'arenas'}
                    </div>
                  </div>

                  {/* Venues Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredVenues.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-200 bg-slate-50 rounded-2xl space-y-2">
                        <Building className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhuma arena física cadastrada no momento.</p>
                        <button 
                          onClick={handleOpenVenueCreate} 
                          className="text-xs text-emerald-600 hover:underline font-bold inline-block"
                        >
                          Clique aqui para cadastrar a primeira arena
                        </button>
                      </div>
                    ) : (
                      filteredVenues.map(venue => {
                        const linkedTourneys = tournaments.filter(t => t.venueId === venue.id).length;
                        return (
                          <div 
                            key={venue.id} 
                            className="bg-white border border-slate-200 hover:border-slate-200 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group"
                          >
                            <div className="space-y-3.5">
                              {/* Header: Name + Status */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-emerald-600 transition-colors">
                                    {venue.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{venue.city} - {venue.state}</span>
                                  </p>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  venue.status === 'ATIVA' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}>
                                  {venue.status}
                                </span>
                              </div>

                              {/* Number of Courts Badge */}
                              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                                    <Layers className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Estrutura de Jogos</span>
                                    <p className="text-sm font-black text-emerald-700 font-mono">
                                      {venue.courtsCount} {venue.courtsCount === 1 ? 'Quadra' : 'Quadras'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                                  No local
                                </span>
                              </div>

                              {/* Location details */}
                              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                {venue.address && (
                                  <p className="truncate">
                                    <span className="text-slate-500 font-medium">Endereço:</span>{' '}
                                    <span className="text-slate-700">{venue.address}</span>
                                  </p>
                                )}
                                {venue.contactPhone && (
                                  <p className="truncate font-mono">
                                    <span className="text-slate-500 font-sans font-medium">Contato:</span>{' '}
                                    <span className="text-slate-700">{formatPhone(venue.contactPhone)}</span>
                                  </p>
                                )}
                                <div className="pt-1.5 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                                  <span>Torneios sediados:</span>
                                  <strong className="text-emerald-600 font-mono">{linkedTourneys}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: CRUD Actions */}
                            <div className="flex items-center justify-end mt-4 pt-3.5 border-t border-slate-200 gap-2">
                              <button 
                                onClick={() => handleOpenVenueEdit(venue)} 
                                className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
                                title="Editar dados da arena e quantidade de quadras"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteVenue(venue)} 
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Excluir Arena"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 4: TORNEIOS */}
              {activeTab === 'tournaments' && (
                <motion.div key="tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-emerald-600" />
                        Gestão de Torneios
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Gerenciamento completo de edições de campeonatos, quadras utilizadas e organizadores.</p>
                    </div>
                    <button 
                      onClick={handleOpenTournamentCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/15"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Torneio
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar torneios por nome ou série..." 
                      value={searchTournament}
                      onChange={(e) => setSearchTournament(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-4 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                    <div className="text-[11px] text-slate-500 whitespace-nowrap px-1">
                      Total: <strong className="text-slate-900 font-mono">{filteredTournaments.length}</strong> {filteredTournaments.length === 1 ? 'torneio' : 'torneios'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-200 bg-slate-50 rounded-2xl space-y-2">
                        <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhum torneio cadastrado nesta arena/filtro.</p>
                        <button 
                          onClick={handleOpenTournamentCreate} 
                          className="text-xs text-emerald-600 hover:underline font-bold inline-block"
                        >
                          Clique aqui para cadastrar um torneio
                        </button>
                      </div>
                    ) : (
                      filteredTournaments.map(t => {
                        const arenaObj = arenas.find(a => a.id === t.arenaId);
                        const venueObj = venues.find(v => v.id === t.venueId);
                        return (
                          <div key={t.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-200 transition shadow-md group">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Série: {t.seriesName}</span>
                                    <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                      Duplas
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-slate-900 text-base mt-1 group-hover:text-emerald-600 transition-colors">{t.name}</h3>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  t.status === 'INSCRICOES_ABERTAS' ? 'bg-sky-50 text-sky-600 border-sky-200' : 
                                  t.status === 'EM_ANDAMENTO' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                  'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {t.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-1.5 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Organizador: <strong className="text-slate-800">{arenaObj?.name || 'Não informado'}</strong></p>
                                <p className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Local: <strong className="text-teal-700">{venueObj?.name || t.venueName || 'Local a definir'}</strong></p>
                                <p className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Quadras no evento: <strong className="text-emerald-700 font-mono">{t.courtsUsed || 4} quadras</strong> {venueObj && <span className="text-[10px] text-slate-500">({venueObj.courtsCount} no local)</span>}</p>
                                <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Período: <span className="font-mono text-slate-700">{new Date(t.startDate).toLocaleDateString('pt-BR')}</span> até <span className="font-mono text-slate-700">{new Date(t.endDate).toLocaleDateString('pt-BR')}</span></p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-200">
                              <button 
                                onClick={() => setActiveTab('categories')}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition flex items-center gap-1"
                              >
                                <Layers className="w-3 h-3" /> Categorias
                              </button>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleOpenTournamentEdit(t)} 
                                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                                  title="Editar Torneio"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTournament(t.id)} 
                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                  title="Excluir Torneio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 5: CATEGORIAS (ACESSO EXCLUSIVO SUPER ADMIN) */}
              {activeTab === 'categories' && (
                session.role !== 'SUPER_ADMIN' ? (
                  <motion.div key="cat-denied" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="my-12 max-w-lg mx-auto bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
                      <Shield className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 inline-block mb-3">
                      Acesso Restrito
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Permissão Super Admin Obrigatória</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      Apenas o <strong>Administrador Geral (SUPER_ADMIN)</strong> possui permissão para cadastrar, editar e gerenciar as categorias do sistema.
                    </p>
                    <button 
                      onClick={() => setActiveTab('dashboard')} 
                      className="py-2.5 px-6 bg-slate-100 hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-200 hover:border-slate-300"
                    >
                      Voltar ao Painel Principal
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-600" /> Super Admin
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Pré-Cadastro de Categorias Oficiais</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Layers className="w-6 h-6 text-emerald-600" />
                          Cadastro e Gestão de Categorias
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          Cadastre previamente as categorias oficiais de disputa (níveis, tipos, taxas base e limite de vagas). Ao criar um torneio, os organizadores selecionam quais categorias cadastradas farão parte do evento.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={handleResetCategoriesPresets}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200 hover:border-slate-300 cursor-pointer"
                          title="Restaurar categorias oficiais padrão do Beach Tennis"
                        >
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Padrões Oficiais</span>
                        </button>

                        <button 
                          onClick={handleOpenCategoryCreate} 
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-600/15 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Categoria
                        </button>
                      </div>
                    </div>

                    {/* KPI Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Total de Categorias</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900 font-mono">{categories.length}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">cadastradas</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Categorias Ativas</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-emerald-600 font-mono">
                            {categories.filter(c => c.status !== 'INATIVA').length}
                          </span>
                          <span className="text-[10px] text-slate-500">para torneios</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Taxa Média Base</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900 font-mono">
                            R$ {categories.length > 0 
                              ? (categories.reduce((acc, c) => acc + (c.price || 0), 0) / categories.length).toFixed(0)
                              : '0'}
                          </span>
                          <span className="text-[10px] text-slate-500">por inscrição</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Capacidade Padrão</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-600 font-mono">
                            {categories.reduce((acc, c) => acc + (c.maxParticipants || 16), 0)}
                          </span>
                          <span className="text-[10px] text-slate-500">vagas sugeridas</span>
                        </div>
                      </div>
                    </div>

                    {/* Filters & Search Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-80">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Buscar por nome, tipo ou nível..." 
                            value={searchCategory}
                            onChange={(e) => setSearchCategory(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
                          {/* Filter by Type */}
                          <select 
                            value={filterCategoryType}
                            onChange={(e) => setFilterCategoryType(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                          >
                            <option value="ALL">Todos os Tipos</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMININO">Feminino</option>
                            <option value="MISTA">Mista</option>
                          </select>

                          {/* Filter by Level */}
                          <select 
                            value={filterCategoryLevel}
                            onChange={(e) => setFilterCategoryLevel(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                          >
                            <option value="ALL">Todos os Níveis</option>
                            <option value="OPEN">Open / Livre</option>
                            <option value="A">Nível A</option>
                            <option value="B">Nível B</option>
                            <option value="C">Nível C</option>
                            <option value="D">Nível D</option>
                            <option value="INICIANTE">Iniciante</option>
                            <option value="PRINCIPIANTE">Principiante</option>
                          </select>

                          {/* Filter by Status */}
                          <select 
                            value={filterCategoryStatus}
                            onChange={(e) => setFilterCategoryStatus(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                          >
                            <option value="ALL">Todos os Status</option>
                            <option value="ATIVA">Apenas Ativas</option>
                            <option value="INATIVA">Apenas Inativas</option>
                          </select>

                          {/* Filter by Scope */}
                          <select 
                            value={filterCategoryTournament}
                            onChange={(e) => setFilterCategoryTournament(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                          >
                            <option value="ALL">Todos os Escopos</option>
                            <option value="GLOBAL">Pré-Cadastradas no Sistema</option>
                            {tournaments.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        {(searchCategory || filterCategoryTournament !== 'ALL' || filterCategoryType !== 'ALL' || filterCategoryLevel !== 'ALL' || filterCategoryStatus !== 'ALL') && (
                          <button 
                            onClick={() => {
                              setSearchCategory('');
                              setFilterCategoryTournament('ALL');
                              setFilterCategoryType('ALL');
                              setFilterCategoryLevel('ALL');
                              setFilterCategoryStatus('ALL');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold whitespace-nowrap cursor-pointer px-2"
                          >
                            Limpar Filtros
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                        <span>Exibindo <strong>{filteredCategories.length}</strong> de <strong>{categories.length}</strong> categorias cadastradas</span>
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Categorias prontas para vincular na criação de novos torneios
                        </span>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                              <th className="p-4">Categoria & Nível</th>
                              <th className="p-4">Origem / Escopo</th>
                              <th className="p-4">Taxa Base</th>
                              <th className="p-4">Vagas Sugeridas</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Ações (Super Admin)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {filteredCategories.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-500">
                                  <div className="flex flex-col items-center justify-center gap-3">
                                    <Layers className="w-10 h-10 text-slate-600 mb-1" />
                                    <p className="font-bold text-slate-900 text-sm">Nenhuma categoria encontrada com os filtros atuais.</p>
                                    <p className="text-xs text-slate-500 max-w-md">
                                      Você pode sincronizar as categorias padrão oficiais do Beach Tennis com 1 clique ou cadastrar uma nova categoria manualmente.
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                      <button 
                                        onClick={handleResetCategoriesPresets}
                                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Carregar Categorias Padrão
                                      </button>
                                      <button 
                                        onClick={handleOpenCategoryCreate}
                                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Cadastrar Categoria
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredCategories.map(c => {
                                const isGlobal = !c.tournamentId || c.tournamentId === 'GLOBAL';
                                const currentTournament = tournaments.find(t => t.id === c.tournamentId);
                                const isAtiva = c.status !== 'INATIVA';

                                // Badge type styling
                                const getTypeBadge = (type: string) => {
                                  switch (type) {
                                    case 'MASCULINO':
                                      return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
                                    case 'FEMININO':
                                      return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
                                    case 'MISTA':
                                      return 'bg-purple-50 text-purple-700 border-purple-200';
                                    default:
                                      return 'bg-slate-500/15 text-slate-700 border-slate-500/30';
                                  }
                                };

                                return (
                                  <tr key={c.id} className="hover:bg-slate-50 transition group">
                                    <td className="p-4">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase font-mono ${getTypeBadge(c.type)}`}>
                                            {c.type}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-mono font-bold">
                                            Nível {c.level}
                                          </span>
                                        </div>
                                        <div className="font-bold text-slate-900 text-sm mt-0.5">
                                          {c.name || `${c.type} ${c.level}`}
                                        </div>
                                        {c.description && (
                                          <span className="text-[10px] text-slate-500 line-clamp-1">{c.description}</span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="p-4">
                                      {isGlobal ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
                                          <Sparkles className="w-3 h-3 text-emerald-600" />
                                          Pré-cadastrada no Sistema
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="font-semibold text-slate-900 leading-snug">{c.tournamentName}</div>
                                          <span className="text-[10px] text-slate-500">Vinculada a torneio</span>
                                        </div>
                                      )}
                                    </td>

                                    <td className="p-4">
                                      <div className="font-mono text-emerald-700 text-sm font-black">
                                        R$ {c.price.toFixed(2)}
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-medium">taxa padrão</span>
                                    </td>

                                    <td className="p-4">
                                      <div className="font-mono text-slate-900 text-xs font-bold">
                                        {c.maxParticipants || 16} vagas
                                      </div>
                                      <span className="text-[10px] text-slate-500">duplas / atletas</span>
                                    </td>

                                    <td className="p-4">
                                      <button 
                                        onClick={() => handleToggleCategoryStatus(c)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                          isAtiva 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
                                        }`}
                                        title={isAtiva ? 'Clique para desativar esta categoria' : 'Clique para ativar esta categoria'}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isAtiva ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                        {isAtiva ? 'ATIVA' : 'INATIVA'}
                                      </button>
                                    </td>

                                    <td className="p-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                          onClick={() => handleOpenCategoryEdit(c)} 
                                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition flex items-center gap-1 border border-slate-200 hover:border-slate-300 cursor-pointer"
                                          title="Editar Categoria"
                                        >
                                          <Edit2 className="w-3 h-3 text-emerald-600" /> Editar
                                        </button>

                                        <button 
                                          onClick={() => handleDuplicateCategory(c)} 
                                          className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition flex items-center gap-1 border border-slate-200 hover:border-slate-300 cursor-pointer"
                                          title="Duplicar como Nova Categoria"
                                        >
                                          <Plus className="w-3 h-3 text-amber-600" /> Clonar
                                        </button>

                                        <button 
                                          onClick={() => handleDeleteCategory(c.id)} 
                                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                                          title="Excluir Categoria"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )
              )}

              {/* VIEW 6: INSCRIÇÕES */}
              {activeTab === 'registrations' && (
                <motion.div key="reg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {!selectedRegTournamentId ? (
                    /* PASSO 1: TELA DE BUSCA E SELEÇÃO DE TORNEIO */
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div>
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-emerald-600" />
                            Inscrições de Atletas · Selecionar Edição do Torneio
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Selecione a edição do torneio abaixo para visualizar a lista de atletas inscritos e cadastrar novas inscrições.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.role === 'SUPER_ADMIN' ? (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" /> Super Admin · Todas as Arenas
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" /> Organização · {selectedArena?.name || session.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Filtro e Busca de Torneios */}
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="relative md:col-span-6">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              placeholder="Buscar torneio por nome da edição ou série..."
                              value={searchRegTournamentTerm}
                              onChange={(e) => setSearchRegTournamentTerm(e.target.value)}
                              className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {session.role === 'SUPER_ADMIN' && (
                            <div className="md:col-span-3">
                              <select 
                                value={filterRegArenaId} 
                                onChange={(e) => setFilterRegArenaId(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                <option value="ALL">Todas as Arenas ({arenas.length})</option>
                                {arenas.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={session.role === 'SUPER_ADMIN' ? "md:col-span-3" : "md:col-span-6"}>
                            <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200 text-xs">
                              <button
                                type="button"
                                onClick={() => setFilterRegStatus('ALL')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterRegStatus === 'ALL'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Todos ({tournaments.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterRegStatus('VIGENTE')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterRegStatus === 'VIGENTE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🟢 Vigentes ({tournaments.filter(t => isTournamentVigente(t)).length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterRegStatus('EXPIRADO')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterRegStatus === 'EXPIRADO'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🔴 Expirados ({tournaments.filter(t => !isTournamentVigente(t)).length})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Cards de Torneios */}
                      {(() => {
                        const filteredTournaments = tournaments.filter(t => {
                          const matchesSearch = 
                            t.name.toLowerCase().includes(searchRegTournamentTerm.toLowerCase()) ||
                            t.seriesName.toLowerCase().includes(searchRegTournamentTerm.toLowerCase());
                          
                          const matchesArena = 
                            filterRegArenaId === 'ALL' || t.arenaId === filterRegArenaId;

                          const vigente = isTournamentVigente(t);
                          const matchesStatus = 
                            filterRegStatus === 'ALL' ||
                            (filterRegStatus === 'VIGENTE' && vigente) ||
                            (filterRegStatus === 'EXPIRADO' && !vigente);

                          return matchesSearch && matchesArena && matchesStatus;
                        });

                        if (filteredTournaments.length === 0) {
                          return (
                            <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                              <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
                              <p className="font-semibold text-slate-700">Nenhum torneio encontrado para seleção.</p>
                              <p className="text-xs text-slate-500">
                                {searchRegTournamentTerm ? 'Tente ajustar os termos da busca.' : 'Crie uma nova edição de torneio na aba Torneios.'}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTournaments.map(t => {
                              const vigente = isTournamentVigente(t);
                              const arenaName = arenas.find(a => a.id === t.arenaId)?.name || 'Arena';
                              const tourRegistrations = registrations.filter(r => r.tournamentId === t.id && r.status !== 'CANCELADA');
                              const confirmedCount = tourRegistrations.filter(r => r.status === 'CONFIRMADA').length;
                              const tourCats = categories.filter(c => c.tournamentId === t.id);

                              return (
                                <div 
                                  key={t.id} 
                                  className={`bg-white border rounded-2xl p-5 space-y-4 transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                                    vigente 
                                      ? 'border-slate-200 hover:border-emerald-200' 
                                      : 'border-rose-200 bg-white/90'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                        {t.seriesName}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          🏟️ {arenaName}
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                          Duplas
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{new Date(t.startDate).toLocaleDateString('pt-BR')} até {new Date(t.endDate).toLocaleDateString('pt-BR')}</span>
                                      </p>
                                    </div>

                                    <div>
                                      {vigente ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          🟢 Período Vigente (Inscrições Abertas)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          🔴 Inscrições Encerradas (Expirou em {new Date(t.endDate).toLocaleDateString('pt-BR')})
                                        </span>
                                      )}
                                    </div>

                                    {/* Métricas rápidas */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Inscritos:</span>
                                        <strong className="text-slate-900 font-mono text-sm">{tourRegistrations.length}</strong>
                                        <span className="text-[10px] text-emerald-600 ml-1">({confirmedCount} conf.)</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Categorias:</span>
                                        <strong className="text-amber-700 font-mono text-sm">{tourCats.length}</strong>
                                        <span className="text-[10px] text-slate-500 ml-1">ativas</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-slate-200 space-y-2">
                                    <button 
                                      type="button"
                                      onClick={() => setSelectedRegTournamentId(t.id)}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                    >
                                      <span>Acessar Inscrições</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>

                                    {vigente ? (
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setSelectedRegTournamentId(t.id);
                                          handleOpenRegistrationCreate(t.id);
                                        }}
                                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-100 text-emerald-600 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Inscrever Novo Atleta
                                      </button>
                                    ) : (
                                      <p className="text-[10px] text-slate-500 text-center italic py-1">
                                        Período encerrado. Gere uma nova edição para receber inscrições.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* PASSO 2: TABELA DE INSCRITOS DO TORNEIO SELECIONADO */
                    (() => {
                      const currentTour = tournaments.find(t => t.id === selectedRegTournamentId);
                      const isVigente = isTournamentVigente(currentTour);
                      const currentArenaName = arenas.find(a => a.id === currentTour?.arenaId)?.name || 'Arena';
                      const tourCategories = categories.filter(c => c.tournamentId === selectedRegTournamentId);

                      // Registrations filtered by this tournament
                      const tourRegs = registrations.filter(r => {
                        if (r.tournamentId !== selectedRegTournamentId) return false;
                        if (filterRegCategory !== 'ALL' && r.categoryId !== filterRegCategory) return false;
                        if (filterRegPaymentStatus !== 'ALL' && r.status !== filterRegPaymentStatus) return false;
                        if (searchRegAthleteTerm && !r.athleteName.toLowerCase().includes(searchRegAthleteTerm.toLowerCase())) return false;
                        return true;
                      });

                      return (
                        <div className="space-y-4">
                          {/* Banner de Identificação do Torneio Selecionado */}
                          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRegTournamentId('');
                                    setFilterRegCategory('ALL');
                                    setFilterRegPaymentStatus('ALL');
                                  }}
                                  className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar de Torneio
                                </button>
                                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                  {currentTour?.seriesName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  🏟️ {currentArenaName}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Duplas
                                </span>
                              </div>

                              <h2 className="text-xl font-black text-slate-900">{currentTour?.name}</h2>

                              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                                <span className="font-mono flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                  {currentTour?.startDate && new Date(currentTour.startDate).toLocaleDateString('pt-BR')} até {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}
                                </span>
                                {isVigente ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    🟢 Período Vigente (Inscrições Abertas)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    🔴 Inscrições Encerradas (Expirou em {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Seletor Rápido de Torneio */}
                              <select 
                                value={selectedRegTournamentId} 
                                onChange={(e) => {
                                  setSelectedRegTournamentId(e.target.value);
                                  setFilterRegCategory('ALL');
                                }}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                {tournaments.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.seriesName ? `· ${t.seriesName}` : ''} ({isTournamentVigente(t) ? '🟢' : '🔴'})
                                  </option>
                                ))}
                              </select>

                              {/* Botão Inscrever */}
                              {isVigente ? (
                                <button 
                                  onClick={() => handleOpenRegistrationCreate(selectedRegTournamentId)}
                                  className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/15 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Inscrever Atleta
                                </button>
                              ) : (
                                <button 
                                  onClick={() => showError(`Inscrições encerradas. O período vigente deste torneio expirou em ${currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}. Não é mais permitido registrar inscrições nesta edição. Gere uma nova edição para receber inscrições.`)}
                                  className="flex items-center gap-2 py-2.5 px-4 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                                  title="Período expirado"
                                >
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Inscrições Fechadas
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Alerta de Período Expirado caso não seja vigente */}
                          {!isVigente && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>
                                  <strong>Atenção:</strong> O período vigente deste torneio encerrou em {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}. Novas inscrições estão bloqueadas. Para continuar cadastrando atletas, gere uma nova edição deste torneio.
                                </span>
                              </div>
                              <button 
                                onClick={handleOpenTournamentCreate}
                                className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition cursor-pointer"
                              >
                                Criar Nova Edição
                              </button>
                            </div>
                          )}

                          {/* SEGUNDO FILTRO: CATEGORIAS DO TORNEIO (Quando possui mais de 1 categoria) */}
                          {tourCategories.length > 1 ? (
                            <div className="bg-white border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Filtro de Categoria</span>
                                  <p className="text-xs text-slate-700 font-bold">Este torneio possui {tourCategories.length} categorias. Selecione a categoria que deseja visualizar:</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setFilterRegCategory('ALL')}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    filterRegCategory === 'ALL'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                  }`}
                                >
                                  <span>Todas as Categorias</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                    {registrations.filter(r => r.tournamentId === selectedRegTournamentId && r.status !== 'CANCELADA').length}
                                  </span>
                                </button>
                                {tourCategories.map(cat => {
                                  const catCount = registrations.filter(r => r.tournamentId === selectedRegTournamentId && r.categoryId === cat.id && r.status !== 'CANCELADA').length;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setFilterRegCategory(cat.id)}
                                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        filterRegCategory === cat.id
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                      }`}
                                    >
                                      <span>{cat.type} {cat.level} {cat.name ? `(${cat.name})` : ''}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                        {catCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : tourCategories.length === 1 ? (
                            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-700">
                              <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                Categoria Única: <strong className="text-slate-900">{tourCategories[0].type} {tourCategories[0].level} {tourCategories[0].name ? `(${tourCategories[0].name})` : ''}</strong>
                              </span>
                              <span className="text-slate-500 text-[11px] font-mono">1 categoria configurada</span>
                            </div>
                          ) : null}

                          {/* Barra de Filtros Interna da Tabela */}
                          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                              <div className="relative flex-1 sm:flex-none">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                  type="text"
                                  placeholder="Filtrar atleta..."
                                  value={searchRegAthleteTerm}
                                  onChange={(e) => setSearchRegAthleteTerm(e.target.value)}
                                  className="bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                                />
                              </div>

                              <select 
                                value={filterRegCategory} 
                                onChange={(e) => setFilterRegCategory(e.target.value)}
                                className="bg-white border border-slate-300 py-1.5 px-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                              >
                                <option value="ALL">Todas as Categorias ({tourCategories.length})</option>
                                {tourCategories.map(c => (
                                  <option key={c.id} value={c.id}>{c.type} {c.level} {c.name ? `(${c.name})` : ''}</option>
                                ))}
                              </select>

                              <select 
                                value={filterRegPaymentStatus} 
                                onChange={(e) => setFilterRegPaymentStatus(e.target.value)}
                                className="bg-white border border-slate-300 py-1.5 px-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                              >
                                <option value="ALL">Todos os Status</option>
                                <option value="CONFIRMADA">Confirmadas</option>
                                <option value="PENDENTE_PAGAMENTO">Pendentes</option>
                                <option value="CANCELADA">Canceladas</option>
                              </select>
                            </div>

                            <span className="text-xs text-slate-500 font-medium">
                              Inscrições nesta edição: <strong className="text-slate-900 font-mono">{tourRegs.length}</strong>
                            </span>
                          </div>

                          {/* Tabela de Inscrições */}
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-md">
                            <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                                  <th className="p-4">Atleta</th>
                                  <th className="p-4">Categoria</th>
                                  <th className="p-4">Data Inscrição</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4 text-right">Ação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {tourRegs.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 space-y-2">
                                      <p className="font-semibold text-slate-700">Nenhuma inscrição encontrada para este torneio.</p>
                                      {isVigente && (
                                        <button 
                                          type="button"
                                          onClick={() => handleOpenRegistrationCreate(selectedRegTournamentId)}
                                          className="text-xs text-emerald-600 hover:underline"
                                        >
                                          + Clique aqui para inscrever o primeiro atleta
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ) : (
                                  tourRegs.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition">
                                      <td className="p-4 font-bold text-slate-900">{r.athleteName}</td>
                                      <td className="p-4 font-semibold text-emerald-700">{r.categoryName}</td>
                                      <td className="p-4 font-mono text-slate-500">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>
                                      <td className="p-4">
                                        {r.status === 'CONFIRMADA' ? (
                                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wide">
                                            Confirmada
                                          </span>
                                        ) : r.status === 'PENDENTE_PAGAMENTO' ? (
                                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wide">
                                            Pendente de Pagamento
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-wide">
                                            Cancelada
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                          {r.status === 'PENDENTE_PAGAMENTO' && (
                                            <button 
                                              onClick={() => handleUpdateRegistrationStatus(r.id, 'CONFIRMADA')}
                                              className="py-1 px-2.5 bg-emerald-600 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm cursor-pointer"
                                              title="Confirmar Pagamento e Inscrição"
                                            >
                                              <Check className="w-3 h-3" /> Confirmar Pagamento
                                            </button>
                                          )}
                                          {r.status === 'CONFIRMADA' && (
                                            <button 
                                              onClick={() => handleUpdateRegistrationStatus(r.id, 'PENDENTE_PAGAMENTO')}
                                              className="py-1 px-2 bg-slate-100 text-amber-600 hover:text-slate-900 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                              title="Mudar Status para Pendente de Pagamento"
                                            >
                                              <AlertCircle className="w-3 h-3" /> Marcar Pendente
                                            </button>
                                          )}
                                          {r.status !== 'CANCELADA' && (
                                            <button 
                                              onClick={() => handleCancelRegistration(r.id)}
                                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                              title="Cancelar Inscrição"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              )}

              {/* VIEW 7: DUPLAS */}
              {activeTab === 'duos' && (
                <motion.div key="duos_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {!selectedDuoTournamentId ? (
                    /* PASSO 1: TELA DE BUSCA E SELEÇÃO DE TORNEIO (DUPLAS) */
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div>
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-600" />
                            Formação de Duplas · Selecionar Edição do Torneio
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Selecione a edição do torneio abaixo para visualizar as duplas formadas ou criar novas parcerias.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.role === 'SUPER_ADMIN' ? (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" /> Super Admin · Todas as Arenas
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" /> Organização · {selectedArena?.name || session.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Filtros e Busca de Torneios */}
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="relative md:col-span-6">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              placeholder="Buscar torneio por nome da edição ou série..."
                              value={searchDuoTournamentTerm}
                              onChange={(e) => setSearchDuoTournamentTerm(e.target.value)}
                              className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {session.role === 'SUPER_ADMIN' && (
                            <div className="md:col-span-3">
                              <select 
                                value={filterDuoArenaId} 
                                onChange={(e) => setFilterDuoArenaId(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                <option value="ALL">Todas as Arenas ({arenas.length})</option>
                                {arenas.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={session.role === 'SUPER_ADMIN' ? "md:col-span-3" : "md:col-span-6"}>
                            <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200 text-xs">
                              <button
                                type="button"
                                onClick={() => setFilterDuoStatus('ALL')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterDuoStatus === 'ALL'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Todos ({tournaments.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterDuoStatus('VIGENTE')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterDuoStatus === 'VIGENTE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🟢 Vigentes
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterDuoStatus('EXPIRADO')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterDuoStatus === 'EXPIRADO'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🔴 Expirados
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Cards de Torneios */}
                      {(() => {
                        const filteredTournaments = tournaments.filter(t => {
                          const matchesSearch = 
                            t.name.toLowerCase().includes(searchDuoTournamentTerm.toLowerCase()) ||
                            t.seriesName.toLowerCase().includes(searchDuoTournamentTerm.toLowerCase());
                          
                          const matchesArena = 
                            filterDuoArenaId === 'ALL' || t.arenaId === filterDuoArenaId;

                          const vigente = isTournamentVigente(t);
                          const matchesStatus = 
                            filterDuoStatus === 'ALL' ||
                            (filterDuoStatus === 'VIGENTE' && vigente) ||
                            (filterDuoStatus === 'EXPIRADO' && !vigente);

                          return matchesSearch && matchesArena && matchesStatus;
                        });

                        if (filteredTournaments.length === 0) {
                          return (
                            <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                              <Users className="w-10 h-10 text-slate-600 mx-auto" />
                              <p className="font-semibold text-slate-700">Nenhum torneio encontrado para seleção de duplas.</p>
                              <p className="text-xs text-slate-500">
                                {searchDuoTournamentTerm ? 'Tente ajustar os termos da busca.' : 'Cadastre ou aguarde torneios serem criados.'}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTournaments.map(t => {
                              const vigente = isTournamentVigente(t);
                              const arenaName = arenas.find(a => a.id === t.arenaId)?.name || 'Arena';
                              const tourDuos = duos.filter(d => d.tournamentId === t.id);
                              const tourCats = categories.filter(c => c.tournamentId === t.id);

                              return (
                                <div 
                                  key={t.id} 
                                  className={`bg-white border rounded-2xl p-5 space-y-4 transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                                    vigente 
                                      ? 'border-slate-200 hover:border-emerald-200' 
                                      : 'border-slate-200 bg-white/90'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                        {t.seriesName}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          🏟️ {arenaName}
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                          Duplas
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{new Date(t.startDate).toLocaleDateString('pt-BR')} até {new Date(t.endDate).toLocaleDateString('pt-BR')}</span>
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Duplas Formadas:</span>
                                        <strong className="text-slate-900 font-mono text-sm">
                                          {tourDuos.length}
                                        </strong>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Categorias:</span>
                                        <strong className="text-amber-700 font-mono text-sm">{tourCats.length}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-slate-200">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setSelectedDuoTournamentId(t.id);
                                        setFilterDuoCategory('ALL');
                                      }}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                    >
                                      <span>Acessar Duplas</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* PASSO 2: TELA DA EDIÇÃO SELECIONADA (DUPLAS) */
                    (() => {
                      const currentTour = tournaments.find(t => t.id === selectedDuoTournamentId);
                      const isVigente = isTournamentVigente(currentTour);
                      const currentArenaName = arenas.find(a => a.id === currentTour?.arenaId)?.name || 'Arena';
                      const tourCategories = categories.filter(c => c.tournamentId === selectedDuoTournamentId);

                      const displayedDuos = duos.filter(d => {
                        if (d.tournamentId !== selectedDuoTournamentId) return false;
                        if (filterDuoCategory !== 'ALL' && d.categoryId !== filterDuoCategory) return false;
                        return true;
                      });

                      return (
                        <div className="space-y-4">
                          {/* Banner de Identificação do Torneio Selecionado */}
                          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDuoTournamentId('');
                                    setFilterDuoCategory('ALL');
                                  }}
                                  className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar de Torneio
                                </button>
                                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                  {currentTour?.seriesName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  🏟️ {currentArenaName}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Duplas
                                </span>
                              </div>

                              <h2 className="text-xl font-black text-slate-900">{currentTour?.name}</h2>

                              <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{currentTour?.startDate && new Date(currentTour.startDate).toLocaleDateString('pt-BR')} até {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Seletor Rápido de Torneio */}
                              <select 
                                value={selectedDuoTournamentId} 
                                onChange={(e) => {
                                  setSelectedDuoTournamentId(e.target.value);
                                  setFilterDuoCategory('ALL');
                                }}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                {tournaments.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.seriesName ? `· ${t.seriesName}` : ''} ({isTournamentVigente(t) ? '🟢' : '🔴'})
                                  </option>
                                ))}
                              </select>

                              <button 
                                onClick={() => handleOpenDuoCreate(selectedDuoTournamentId)}
                                className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Formar Dupla
                              </button>
                            </div>
                          </div>

                          {/* SEGUNDO FILTRO: CATEGORIAS DO TORNEIO (Quando possui mais de 1 categoria) */}
                          {tourCategories.length > 1 ? (
                            <div className="bg-white border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Filtro de Categoria</span>
                                  <p className="text-xs text-slate-700 font-bold">Este torneio possui {tourCategories.length} categorias. Selecione a categoria que deseja visualizar:</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setFilterDuoCategory('ALL')}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    filterDuoCategory === 'ALL'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                  }`}
                                >
                                  <span>Todas as Categorias</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                    {duos.filter(d => d.tournamentId === selectedDuoTournamentId).length}
                                  </span>
                                </button>
                                {tourCategories.map(cat => {
                                  const catCount = duos.filter(d => d.tournamentId === selectedDuoTournamentId && d.categoryId === cat.id).length;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setFilterDuoCategory(cat.id)}
                                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        filterDuoCategory === cat.id
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                      }`}
                                    >
                                      <span>{cat.type} {cat.level} {cat.name ? `(${cat.name})` : ''}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                        {catCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : tourCategories.length === 1 ? (
                            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-700">
                              <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                Categoria Única: <strong className="text-slate-900">{tourCategories[0].type} {tourCategories[0].level} {tourCategories[0].name ? `(${tourCategories[0].name})` : ''}</strong>
                              </span>
                              <span className="text-slate-500 text-[11px] font-mono">1 categoria configurada</span>
                            </div>
                          ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {displayedDuos.length === 0 ? (
                                <div className="col-span-full p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                                  <Users className="w-10 h-10 text-slate-600 mx-auto" />
                                  <p className="font-semibold text-slate-700">Nenhuma dupla encontrada nesta categoria/torneio.</p>
                                  <p className="text-xs text-slate-500">Clique em &quot;Formar Dupla&quot; acima para combinar dois atletas já inscritos.</p>
                                </div>
                              ) : (
                                displayedDuos.map(d => (
                                  <div key={d.id} className="bg-white border border-slate-200 hover:border-slate-200 p-5 rounded-2xl flex justify-between items-center transition shadow-sm hover:shadow-md">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded uppercase tracking-wider">
                                        {d.categoryName}
                                      </span>
                                      <p className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                                        <span>{d.player1Name}</span>
                                        <span className="text-amber-600 font-extrabold">&</span>
                                        <span>{d.player2Name}</span>
                                      </p>
                                      <span className="text-[11px] text-slate-500 block">Torneio: <strong className="text-slate-700">{d.tournamentName}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                        {d.status}
                                      </span>
                                      <button 
                                        onClick={() => handleDeleteDuo(d.id)}
                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                        title="Desfazer Dupla"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              )}

              {/* VIEW 8: JOGOS */}
              {activeTab === 'matches' && (
                <motion.div key="matches_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {!selectedMatchTournamentId ? (
                    /* PASSO 1: TELA DE BUSCA E SELEÇÃO DE TORNEIO (JOGOS) */
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div>
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-600" />
                            Grade de Jogos e Quadras · Selecionar Edição do Torneio
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Selecione a edição do torneio abaixo para visualizar a grade de confrontos, gerar jogos e gerenciar as quadras.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.role === 'SUPER_ADMIN' ? (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" /> Super Admin · Todas as Arenas
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" /> Organização · {selectedArena?.name || session.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Filtros e Busca de Torneios */}
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="relative md:col-span-6">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              placeholder="Buscar torneio por nome da edição ou série..."
                              value={searchMatchTournamentTerm}
                              onChange={(e) => setSearchMatchTournamentTerm(e.target.value)}
                              className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {session.role === 'SUPER_ADMIN' && (
                            <div className="md:col-span-3">
                              <select 
                                value={filterMatchArenaId} 
                                onChange={(e) => setFilterMatchArenaId(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                <option value="ALL">Todas as Arenas ({arenas.length})</option>
                                {arenas.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={session.role === 'SUPER_ADMIN' ? "md:col-span-3" : "md:col-span-6"}>
                            <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200 text-xs">
                              <button
                                type="button"
                                onClick={() => setFilterMatchStatus('ALL')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterMatchStatus === 'ALL'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Todos ({tournaments.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterMatchStatus('VIGENTE')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterMatchStatus === 'VIGENTE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🟢 Vigentes
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterMatchStatus('EXPIRADO')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterMatchStatus === 'EXPIRADO'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🔴 Expirados
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Cards de Torneios */}
                      {(() => {
                        const filteredTournaments = tournaments.filter(t => {
                          const matchesSearch = 
                            t.name.toLowerCase().includes(searchMatchTournamentTerm.toLowerCase()) ||
                            t.seriesName.toLowerCase().includes(searchMatchTournamentTerm.toLowerCase());
                          
                          const matchesArena = 
                            filterMatchArenaId === 'ALL' || t.arenaId === filterMatchArenaId;

                          const vigente = isTournamentVigente(t);
                          const matchesStatus = 
                            filterMatchStatus === 'ALL' ||
                            (filterMatchStatus === 'VIGENTE' && vigente) ||
                            (filterMatchStatus === 'EXPIRADO' && !vigente);

                          return matchesSearch && matchesArena && matchesStatus;
                        });

                        if (filteredTournaments.length === 0) {
                          return (
                            <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                              <Activity className="w-10 h-10 text-slate-600 mx-auto" />
                              <p className="font-semibold text-slate-700">Nenhum torneio encontrado para jogos.</p>
                              <p className="text-xs text-slate-500">
                                {searchMatchTournamentTerm ? 'Tente ajustar os termos da busca.' : 'Aguarde torneios serem criados.'}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTournaments.map(t => {
                              const vigente = isTournamentVigente(t);
                              const arenaName = arenas.find(a => a.id === t.arenaId)?.name || 'Arena';
                              const tourMatches = matches.filter(m => m.tournamentId === t.id);
                              const tourCats = categories.filter(c => c.tournamentId === t.id);

                              return (
                                <div 
                                  key={t.id} 
                                  className={`bg-white border rounded-2xl p-5 space-y-4 transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                                    vigente 
                                      ? 'border-slate-200 hover:border-emerald-200' 
                                      : 'border-slate-200 bg-white/90'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                        {t.seriesName}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          🏟️ {arenaName}
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                          Duplas
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{new Date(t.startDate).toLocaleDateString('pt-BR')} até {new Date(t.endDate).toLocaleDateString('pt-BR')}</span>
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Partidas Geradas:</span>
                                        <strong className="text-slate-900 font-mono text-sm">
                                          {tourMatches.length}
                                        </strong>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Categorias:</span>
                                        <strong className="text-amber-700 font-mono text-sm">{tourCats.length}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-slate-200">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setSelectedMatchTournamentId(t.id);
                                        setFilterMatchCategory('ALL');
                                      }}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                    >
                                      <span>Acessar Jogos / Quadras</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* PASSO 2: TELA DA EDIÇÃO SELECIONADA (JOGOS) */
                    (() => {
                      const currentTour = tournaments.find(t => t.id === selectedMatchTournamentId);
                      const isVigente = isTournamentVigente(currentTour);
                      const currentArenaName = arenas.find(a => a.id === currentTour?.arenaId)?.name || 'Arena';
                      const tourCategories = categories.filter(c => c.tournamentId === selectedMatchTournamentId);

                      return (
                        <div className="space-y-4">
                          {/* Banner de Identificação do Torneio Selecionado */}
                          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMatchTournamentId('');
                                    setFilterMatchCategory('ALL');
                                  }}
                                  className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar de Torneio
                                </button>
                                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                  {currentTour?.seriesName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  🏟️ {currentArenaName}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Duplas
                                </span>
                              </div>

                              <h2 className="text-xl font-black text-slate-900">{currentTour?.name}</h2>

                              <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{currentTour?.startDate && new Date(currentTour.startDate).toLocaleDateString('pt-BR')} até {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                              {/* Seletor Rápido de Torneio */}
                              <select 
                                value={selectedMatchTournamentId} 
                                onChange={(e) => {
                                  setSelectedMatchTournamentId(e.target.value);
                                  setFilterMatchCategory('ALL');
                                }}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                {tournaments.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.seriesName ? `· ${t.seriesName}` : ''} ({isTournamentVigente(t) ? '🟢' : '🔴'})
                                  </option>
                                ))}
                              </select>

                              <button 
                                onClick={() => handleOpenGenMatches(selectedMatchTournamentId)}
                                className="flex items-center gap-2 py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs transition shadow-md shadow-amber-500/15 cursor-pointer"
                              >
                                <Activity className="w-4 h-4" /> Gerar Jogos Automaticamente
                              </button>

                              <button 
                                onClick={() => handleOpenMatchCreate(selectedMatchTournamentId)}
                                className="flex items-center gap-2 py-2 px-3.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Agendar Jogo Manual
                              </button>
                            </div>
                          </div>

                          {/* SEGUNDO FILTRO: CATEGORIAS DO TORNEIO (Quando possui mais de 1 categoria) */}
                          {tourCategories.length > 1 ? (
                            <div className="bg-white border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Filtro de Categoria</span>
                                  <p className="text-xs text-slate-700 font-bold">Este torneio possui {tourCategories.length} categorias. Selecione a categoria que deseja visualizar:</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setFilterMatchCategory('ALL')}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    filterMatchCategory === 'ALL'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                  }`}
                                >
                                  <span>Todas as Categorias</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                    {matches.filter(m => m.tournamentId === selectedMatchTournamentId).length}
                                  </span>
                                </button>
                                {tourCategories.map(cat => {
                                  const catCount = matches.filter(m => m.tournamentId === selectedMatchTournamentId && m.categoryId === cat.id).length;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setFilterMatchCategory(cat.id)}
                                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        filterMatchCategory === cat.id
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                      }`}
                                    >
                                      <span>{cat.type} {cat.level} {cat.name ? `(${cat.name})` : ''}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                        {catCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : tourCategories.length === 1 ? (
                            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-700">
                              <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                Categoria Única: <strong className="text-slate-900">{tourCategories[0].type} {tourCategories[0].level} {tourCategories[0].name ? `(${tourCategories[0].name})` : ''}</strong>
                              </span>
                              <span className="text-slate-500 text-[11px] font-mono">1 categoria configurada</span>
                            </div>
                          ) : null}

                          {/* Toolbar de Jogos */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-emerald-600" />
                              Partidas do Torneio de Duplas
                            </span>
                            <span className="text-xs text-slate-500">
                              Total de Jogos: <strong className="text-slate-900 font-mono">{
                                matches.filter(m => m.tournamentId === selectedMatchTournamentId && (filterMatchCategory === 'ALL' || m.categoryId === filterMatchCategory)).length
                              }</strong>
                            </span>
                          </div>

                          {/* Matches List */}
                          <div className="space-y-4">
                            {(() => {
                              const displayedMatches = matches.filter(m => {
                                if (m.tournamentId !== selectedMatchTournamentId) return false;
                                if (filterMatchCategory !== 'ALL' && m.categoryId !== filterMatchCategory) return false;
                                return true;
                              });

                              if (displayedMatches.length === 0) {
                                return (
                                  <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                                    <Activity className="w-10 h-10 text-slate-600 mx-auto" />
                                    <p className="font-semibold text-slate-700">Nenhum jogo encontrado com os filtros selecionados.</p>
                                    <p className="text-xs text-slate-500">Utilize o gerador automático acima para criar os confrontos da chave ou agende manualmente.</p>
                                  </div>
                                );
                              }

                              // Traditional rendering
                              return (
                        <div className="space-y-3">
                          {displayedMatches.map(m => (
                            <div key={m.id} className="bg-white border border-slate-200 hover:border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-sm hover:shadow-md">
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded uppercase tracking-wider">
                                  {m.stage} {m.groupName && `· ${m.groupName}`}
                                </span>
                                <p className="text-sm font-bold text-slate-900 mt-1.5">
                                  {m.duo1Name} <span className="text-amber-600 font-extrabold mx-1">VS</span> {m.duo2Name}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">{m.categoryName}</p>
                                <p className="text-[11px] text-slate-500">Torneio: <strong className="text-slate-500">{m.tournamentName}</strong></p>
                              </div>
                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-left sm:text-right text-xs text-slate-500 space-y-1.5">
                                  <div className="flex items-center sm:justify-end gap-2 flex-wrap">
                                    <button 
                                      type="button"
                                      onClick={() => handleOpenChangeCourt(m)}
                                      className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-mono font-bold transition shadow-sm group"
                                      title="Clique para transferir esta partida para outra quadra"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                      <span>{m.court}</span>
                                      <span className="text-[10px] text-emerald-700 font-sans font-medium underline ml-0.5">Trocar</span>
                                    </button>
                                    <span className="font-mono text-slate-700 font-semibold">@ {m.time}</span>
                                  </div>
                                  <div>
                                    <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                      m.status === 'FINALIZADA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                                      m.status === 'WO' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
                                      'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                      {m.status} {m.score && `(${m.score})`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => handleLaunchResult(m)} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition shadow-sm cursor-pointer"
                                  >
                                    Placar
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMatch(m.id)}
                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                    title="Excluir Jogo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                      })()}
                    </div>
                  </div>
                );
              })()
            )}
          </motion.div>
        )}

              {/* VIEW 9: RESULTADOS & WO */}
              {activeTab === 'results' && (
                <motion.div key="results_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {!selectedResultTournamentId ? (
                    /* PASSO 1: TELA DE BUSCA E SELEÇÃO DE TORNEIO (RESULTADOS) */
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div>
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-600" />
                            Lançamento de Resultados & W.O. · Selecionar Edição do Torneio
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Selecione a edição do torneio abaixo para registrar placares oficiais e lançar ausências (W.O.).
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.role === 'SUPER_ADMIN' ? (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" /> Super Admin · Todas as Arenas
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" /> Organização · {selectedArena?.name || session.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Filtros e Busca de Torneios */}
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="relative md:col-span-6">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              placeholder="Buscar torneio por nome da edição ou série..."
                              value={searchResultTournamentTerm}
                              onChange={(e) => setSearchResultTournamentTerm(e.target.value)}
                              className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {session.role === 'SUPER_ADMIN' && (
                            <div className="md:col-span-3">
                              <select 
                                value={filterResultArenaId} 
                                onChange={(e) => setFilterResultArenaId(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                <option value="ALL">Todas as Arenas ({arenas.length})</option>
                                {arenas.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={session.role === 'SUPER_ADMIN' ? "md:col-span-3" : "md:col-span-6"}>
                            <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200 text-xs">
                              <button
                                type="button"
                                onClick={() => setFilterResultStatus('ALL')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterResultStatus === 'ALL'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Todos ({tournaments.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterResultStatus('VIGENTE')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterResultStatus === 'VIGENTE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🟢 Vigentes
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterResultStatus('EXPIRADO')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterResultStatus === 'EXPIRADO'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🔴 Expirados
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Cards de Torneios */}
                      {(() => {
                        const filteredTournaments = tournaments.filter(t => {
                          const matchesSearch = 
                            t.name.toLowerCase().includes(searchResultTournamentTerm.toLowerCase()) ||
                            t.seriesName.toLowerCase().includes(searchResultTournamentTerm.toLowerCase());
                          
                          const matchesArena = 
                            filterResultArenaId === 'ALL' || t.arenaId === filterResultArenaId;

                          const vigente = isTournamentVigente(t);
                          const matchesStatus = 
                            filterResultStatus === 'ALL' ||
                            (filterResultStatus === 'VIGENTE' && vigente) ||
                            (filterResultStatus === 'EXPIRADO' && !vigente);

                          return matchesSearch && matchesArena && matchesStatus;
                        });

                        if (filteredTournaments.length === 0) {
                          return (
                            <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                              <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                              <p className="font-semibold text-slate-700">Nenhum torneio encontrado para lançamento de resultados.</p>
                              <p className="text-xs text-slate-500">
                                {searchResultTournamentTerm ? 'Tente ajustar os termos da busca.' : 'Gere jogos primeiro na aba Jogos / Quadras.'}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTournaments.map(t => {
                              const vigente = isTournamentVigente(t);
                              const arenaName = arenas.find(a => a.id === t.arenaId)?.name || 'Arena';
                              const tourMatches = matches.filter(m => m.tournamentId === t.id);
                              const finalizedCount = tourMatches.filter(m => m.status === 'FINALIZADA' || m.status === 'WO').length;
                              const tourCats = categories.filter(c => c.tournamentId === t.id);

                              return (
                                <div 
                                  key={t.id} 
                                  className={`bg-white border rounded-2xl p-5 space-y-4 transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                                    vigente 
                                      ? 'border-slate-200 hover:border-emerald-200' 
                                      : 'border-slate-200 bg-white/90'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                        {t.seriesName}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          🏟️ {arenaName}
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                          Duplas
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{new Date(t.startDate).toLocaleDateString('pt-BR')} até {new Date(t.endDate).toLocaleDateString('pt-BR')}</span>
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Concluídos / Total:</span>
                                        <strong className="text-slate-900 font-mono text-sm">
                                          {finalizedCount} / {tourMatches.length}
                                        </strong>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Categorias:</span>
                                        <strong className="text-amber-700 font-mono text-sm">{tourCats.length}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-slate-200">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setSelectedResultTournamentId(t.id);
                                        setFilterResultCategory('ALL');
                                      }}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                    >
                                      <span>Acessar Resultados / WO</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* PASSO 2: TELA DA EDIÇÃO SELECIONADA (RESULTADOS) */
                    (() => {
                      const currentTour = tournaments.find(t => t.id === selectedResultTournamentId);
                      const currentArenaName = arenas.find(a => a.id === currentTour?.arenaId)?.name || 'Arena';
                      const tourCategories = categories.filter(c => c.tournamentId === selectedResultTournamentId);

                      const displayedResults = matches.filter(m => {
                        if (m.tournamentId !== selectedResultTournamentId) return false;
                        if (filterResultCategory !== 'ALL' && m.categoryId !== filterResultCategory) return false;
                        return true;
                      });

                      return (
                        <div className="space-y-4">
                          {/* Banner de Identificação do Torneio Selecionado */}
                          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResultTournamentId('');
                                    setFilterResultCategory('ALL');
                                  }}
                                  className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar de Torneio
                                </button>
                                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                  {currentTour?.seriesName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  🏟️ {currentArenaName}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Duplas
                                </span>
                              </div>

                              <h2 className="text-xl font-black text-slate-900">{currentTour?.name}</h2>

                              <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{currentTour?.startDate && new Date(currentTour.startDate).toLocaleDateString('pt-BR')} até {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Seletor Rápido de Torneio */}
                              <select 
                                value={selectedResultTournamentId} 
                                onChange={(e) => {
                                  setSelectedResultTournamentId(e.target.value);
                                  setFilterResultCategory('ALL');
                                }}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                {tournaments.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.seriesName ? `· ${t.seriesName}` : ''} ({isTournamentVigente(t) ? '🟢' : '🔴'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* SEGUNDO FILTRO: CATEGORIAS DO TORNEIO (Quando possui mais de 1 categoria) */}
                          {tourCategories.length > 1 ? (
                            <div className="bg-white border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Filtro de Categoria</span>
                                  <p className="text-xs text-slate-700 font-bold">Este torneio possui {tourCategories.length} categorias. Selecione a categoria que deseja visualizar:</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setFilterResultCategory('ALL')}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    filterResultCategory === 'ALL'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                  }`}
                                >
                                  <span>Todas as Categorias</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                    {matches.filter(m => m.tournamentId === selectedResultTournamentId).length}
                                  </span>
                                </button>
                                {tourCategories.map(cat => {
                                  const catCount = matches.filter(m => m.tournamentId === selectedResultTournamentId && m.categoryId === cat.id).length;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setFilterResultCategory(cat.id)}
                                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        filterResultCategory === cat.id
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                      }`}
                                    >
                                      <span>{cat.type} {cat.level} {cat.name ? `(${cat.name})` : ''}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                        {catCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : tourCategories.length === 1 ? (
                            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-700">
                              <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                Categoria Única: <strong className="text-slate-900">{tourCategories[0].type} {tourCategories[0].level} {tourCategories[0].name ? `(${tourCategories[0].name})` : ''}</strong>
                              </span>
                              <span className="text-slate-500 text-[11px] font-mono">1 categoria configurada</span>
                            </div>
                          ) : null}

                          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                            {displayedResults.length === 0 ? (
                              <div className="p-12 text-center text-slate-500 border border-slate-200 rounded-xl bg-slate-50/70">
                                Nenhum jogo encontrado para registrar placar no torneio/categoria selecionada.
                              </div>
                            ) : (
                              displayedResults.map(m => (
                                <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4 hover:border-slate-200 transition">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-xs font-bold text-slate-500">{m.categoryName} · {m.stage}</p>
                                      {m.round && (
                                        <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                          Rodada {m.round} · Jogo {m.matchNumber}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                      {m.duo1Name} 
                                      <span className="text-amber-600 font-extrabold mx-2">vs</span> 
                                      {m.duo2Name}
                                    </p>
                                    {m.score && (
                                      <p className="text-xs font-mono font-bold text-emerald-600 mt-1.5 flex items-center gap-1.5">
                                        <span className="text-slate-500 font-sans font-medium text-[11px]">Placar Oficial:</span> {m.score}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    {m.status === 'PENDENTE' ? (
                                      <>
                                        <button 
                                          onClick={() => handleLaunchResult(m)} 
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                                        >
                                          Lançar Placar
                                        </button>
                                        <button 
                                          onClick={() => handleToggleWO(m)} 
                                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-1.5 rounded-xl text-xs border border-rose-200 transition cursor-pointer"
                                        >
                                          Lançar WO
                                        </button>
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-700 font-mono flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                                          <Check className="w-4 h-4 text-emerald-600" /> {m.status === 'WO' ? 'W.O.' : m.isDraw ? 'Empate' : 'Finalizado'} ({m.score})
                                        </span>
                                        {m.tieBreaker && (
                                          <span className="text-[9px] text-amber-600 font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg" title={m.tieBreaker}>
                                            {m.tieBreaker.length > 30 ? m.tieBreaker.substring(0, 30) + '...' : m.tieBreaker}
                                          </span>
                                        )}
                                        <button 
                                          onClick={() => handleLaunchResult(m)} 
                                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-200 transition cursor-pointer"
                                        >
                                          Editar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              )}

              {/* VIEW 10: RELATÓRIOS & LEADERBOARDS */}
              {activeTab === 'reports' && (
                <motion.div key="reports_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {!selectedReportTournamentId ? (
                    /* PASSO 1: TELA DE BUSCA E SELEÇÃO DE TORNEIO (RELATÓRIOS) */
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div>
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Relatórios & Classificação · Selecionar Edição do Torneio
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Selecione a edição do torneio abaixo para visualizar relatórios detalhados, líderes e classificação geral.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.role === 'SUPER_ADMIN' ? (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" /> Super Admin · Todas as Arenas
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" /> Organização · {selectedArena?.name || session.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Filtros e Busca de Torneios */}
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="relative md:col-span-6">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              placeholder="Buscar torneio por nome da edição ou série..."
                              value={searchReportTournamentTerm}
                              onChange={(e) => setSearchReportTournamentTerm(e.target.value)}
                              className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {session.role === 'SUPER_ADMIN' && (
                            <div className="md:col-span-3">
                              <select 
                                value={filterReportArenaId} 
                                onChange={(e) => setFilterReportArenaId(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                <option value="ALL">Todas as Arenas ({arenas.length})</option>
                                {arenas.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={session.role === 'SUPER_ADMIN' ? "md:col-span-3" : "md:col-span-6"}>
                            <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200 text-xs">
                              <button
                                type="button"
                                onClick={() => setFilterReportStatus('ALL')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterReportStatus === 'ALL'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Todos ({tournaments.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterReportStatus('VIGENTE')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterReportStatus === 'VIGENTE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🟢 Vigentes
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterReportStatus('EXPIRADO')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                                  filterReportStatus === 'EXPIRADO'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                🔴 Expirados
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Cards de Torneios */}
                      {(() => {
                        const filteredTournaments = tournaments.filter(t => {
                          const matchesSearch = 
                            t.name.toLowerCase().includes(searchReportTournamentTerm.toLowerCase()) ||
                            t.seriesName.toLowerCase().includes(searchReportTournamentTerm.toLowerCase());
                          
                          const matchesArena = 
                            filterReportArenaId === 'ALL' || t.arenaId === filterReportArenaId;

                          const vigente = isTournamentVigente(t);
                          const matchesStatus = 
                            filterReportStatus === 'ALL' ||
                            (filterReportStatus === 'VIGENTE' && vigente) ||
                            (filterReportStatus === 'EXPIRADO' && !vigente);

                          return matchesSearch && matchesArena && matchesStatus;
                        });

                        if (filteredTournaments.length === 0) {
                          return (
                            <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                              <Award className="w-10 h-10 text-slate-600 mx-auto" />
                              <p className="font-semibold text-slate-700">Nenhum torneio encontrado para relatórios.</p>
                              <p className="text-xs text-slate-500">
                                {searchReportTournamentTerm ? 'Tente ajustar os termos da busca.' : 'Aguarde torneios serem cadastrados.'}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTournaments.map(t => {
                              const vigente = isTournamentVigente(t);
                              const arenaName = arenas.find(a => a.id === t.arenaId)?.name || 'Arena';
                              const tourMatches = matches.filter(m => m.tournamentId === t.id);
                              const tourCats = categories.filter(c => c.tournamentId === t.id);

                              return (
                                <div 
                                  key={t.id} 
                                  className={`bg-white border rounded-2xl p-5 space-y-4 transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                                    vigente 
                                      ? 'border-slate-200 hover:border-emerald-200' 
                                      : 'border-slate-200 bg-white/90'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                        {t.seriesName}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          🏟️ {arenaName}
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                          Duplas
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{new Date(t.startDate).toLocaleDateString('pt-BR')} até {new Date(t.endDate).toLocaleDateString('pt-BR')}</span>
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Partidas:</span>
                                        <strong className="text-slate-900 font-mono text-sm">
                                          {tourMatches.length}
                                        </strong>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[10px]">Categorias:</span>
                                        <strong className="text-amber-700 font-mono text-sm">{tourCats.length}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-slate-200">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setSelectedReportTournamentId(t.id);
                                        setFilterReportCategory('ALL');
                                      }}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                    >
                                      <span>Acessar Relatório</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* PASSO 2: TELA DA EDIÇÃO SELECIONADA (RELATÓRIOS) */
                    (() => {
                      const currentTour = tournaments.find(t => t.id === selectedReportTournamentId);
                      const currentArenaName = arenas.find(a => a.id === currentTour?.arenaId)?.name || 'Arena';
                      const tourCategories = categories.filter(c => c.tournamentId === selectedReportTournamentId);

                      const displayedCategories = tourCategories.filter(c => {
                        if (filterReportCategory !== 'ALL' && c.id !== filterReportCategory) return false;
                        return true;
                      });

                      return (
                        <div className="space-y-5">
                          {/* Banner de Identificação do Torneio Selecionado */}
                          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReportTournamentId('');
                                    setFilterReportCategory('ALL');
                                  }}
                                  className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar de Torneio
                                </button>
                                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                                  {currentTour?.seriesName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  🏟️ {currentArenaName}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Duplas
                                </span>
                              </div>

                              <h2 className="text-xl font-black text-slate-900">{currentTour?.name}</h2>

                              <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{currentTour?.startDate && new Date(currentTour.startDate).toLocaleDateString('pt-BR')} até {currentTour?.endDate && new Date(currentTour.endDate).toLocaleDateString('pt-BR')}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Seletor Rápido de Torneio */}
                              <select 
                                value={selectedReportTournamentId} 
                                onChange={(e) => {
                                  setSelectedReportTournamentId(e.target.value);
                                  setFilterReportCategory('ALL');
                                }}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                              >
                                {tournaments.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.seriesName ? `· ${t.seriesName}` : ''} ({isTournamentVigente(t) ? '🟢' : '🔴'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* SEGUNDO FILTRO: CATEGORIAS DO TORNEIO (Quando possui mais de 1 categoria) */}
                          {tourCategories.length > 1 ? (
                            <div className="bg-white border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Filtro de Categoria</span>
                                  <p className="text-xs text-slate-700 font-bold">Este torneio possui {tourCategories.length} categorias. Selecione a categoria que deseja visualizar:</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setFilterReportCategory('ALL')}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    filterReportCategory === 'ALL'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                  }`}
                                >
                                  <span>Todas as Categorias</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono tabular-nums">
                                    {tourCategories.length}
                                  </span>
                                </button>
                                {tourCategories.map(cat => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFilterReportCategory(cat.id)}
                                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      filterReportCategory === cat.id
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                                    }`}
                                  >
                                    <span>{cat.type} {cat.level} {cat.name ? `(${cat.name})` : ''}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : tourCategories.length === 1 ? (
                            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-700">
                              <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                Categoria Única: <strong className="text-slate-900">{tourCategories[0].type} {tourCategories[0].level} {tourCategories[0].name ? `(${tourCategories[0].name})` : ''}</strong>
                              </span>
                              <span className="text-slate-500 text-[11px] font-mono">1 categoria configurada</span>
                            </div>
                          ) : null}

                          {/* Leaderboard dos Relatórios por Categoria */}
                          <div className="space-y-6">
                            {displayedCategories.length === 0 ? (
                              <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl">
                                Nenhuma categoria encontrada para o torneio selecionado.
                              </div>
                            ) : (
                              displayedCategories.map(cat => {
                                // Traditional Duos leaderboard
                                const catDuos = duos.filter(d => d.categoryId === cat.id && d.tournamentId === currentTour?.id);
                                const leaderboard = catDuos.map(duo => {
                                  const wins = matches.filter(m => 
                                    m.categoryId === cat.id && 
                                    m.tournamentId === currentTour?.id &&
                                    (m.status === 'FINALIZADA' || m.status === 'WO') && 
                                    m.winnerDuoId === duo.id
                                  ).length;
                                  
                                  const totalPlayed = matches.filter(m => 
                                    m.categoryId === cat.id && 
                                    m.tournamentId === currentTour?.id &&
                                    (m.status === 'FINALIZADA' || m.status === 'WO') && 
                                    (m.duo1Id === duo.id || m.duo2Id === duo.id)
                                  ).length;

                                  return { duo, wins, totalPlayed };
                                }).sort((a, b) => b.wins - a.wins);

                                return (
                                  <div key={cat.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                      <div>
                                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Duplas · Classificação</span>
                                        <h3 className="font-black text-slate-900 text-base mt-0.5">{cat.name || `${cat.type} ${cat.level}`}</h3>
                                      </div>
                                    </div>

                                    {leaderboard.length === 0 ? (
                                      <p className="text-xs text-slate-500 text-center py-6">Nenhuma dupla formada nesta categoria.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {leaderboard.map((item, index) => (
                                          <div key={item.duo.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="truncate text-slate-800">
                                              {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : `${index + 1}º `}
                                              <strong className="text-slate-900">{item.duo.player1Name} &amp; {item.duo.player2Name}</strong>
                                            </span>
                                            <span className="font-mono text-emerald-600 font-bold shrink-0 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                                              {item.wins} Vitórias / {item.totalPlayed} Jogos
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              )}

              {/* VIEW: CHAVEAMENTO MATA-MATA (ÁRVORE DE TORNEIO) */}
              {activeTab === 'bracket-tree' && (
                <motion.div 
                  key="bracket_tree_view" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Header Banner */}
                  <div className="bg-white border border-amber-200 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <GitFork className="w-3.5 h-3.5 text-amber-600" /> Fase Mata-Mata Oficial
                        </span>
                        <span className="text-xs text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          Árvore Eliminatória
                        </span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                          Exclusivo Mata-Mata (Sem Grupos)
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Tabela &amp; Árvore de Confrontos Eliminatórios
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                        Acompanhe o chaveamento do mata-mata até a grande final com taça de campeão, vagas diretas (BYE) automáticas e atualização de placares em tempo real.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedTreeTournamentId && selectedTreeCategoryId) {
                            fetchTreeData(selectedTreeTournamentId, selectedTreeCategoryId);
                          }
                        }}
                        disabled={loadingTree}
                        className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Activity className={`w-3.5 h-3.5 text-amber-600 ${loadingTree ? 'animate-spin' : ''}`} />
                        <span>Atualizar Árvore</span>
                      </button>
                    </div>
                  </div>

                  {/* Selector Bar: Torneio e Categoria */}
                  {(() => {
                    const eligibleTournaments = tournaments.filter(t => 
                      session.role === 'SUPER_ADMIN' || t.arenaId === session.arenaId
                    );

                    const activeTour = eligibleTournaments.find(t => t.id === selectedTreeTournamentId) || eligibleTournaments[0];
                    const activeTourId = activeTour?.id || '';

                    const eligibleCategories = categories.filter(c => 
                      c.tournamentId === activeTourId
                    );

                    const activeCat = eligibleCategories.find(c => c.id === selectedTreeCategoryId) || eligibleCategories[0];
                    const activeCatId = activeCat?.id || '';

                    if (eligibleTournaments.length === 0) {
                      return (
                        <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-3xl space-y-3">
                          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
                          <p className="font-bold text-slate-900 text-base">Nenhum torneio convencional com mata-mata encontrado.</p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            O chaveamento em árvore é exclusivo para torneios convencionais de duplas. Crie um novo torneio de duplas na aba Torneios para visualizar a chave do mata-mata.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Selector Controls */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            {/* Torneio Selector */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-600" /> Torneio Convencional
                              </label>
                              <select
                                value={activeTourId}
                                onChange={(e) => {
                                  const tourId = e.target.value;
                                  setSelectedTreeTournamentId(tourId);
                                  const tourCats = categories.filter(c => c.tournamentId === tourId);
                                  const firstCat = tourCats[0];
                                  if (firstCat) {
                                    setSelectedTreeCategoryId(firstCat.id);
                                    fetchTreeData(tourId, firstCat.id);
                                  } else {
                                    setSelectedTreeCategoryId('');
                                    setTreeData(null);
                                  }
                                }}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                              >
                                {eligibleTournaments.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.seriesName ? `· ${t.seriesName}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Categoria Selector */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Categoria de Duplas
                              </label>
                              <select
                                value={activeCatId}
                                onChange={(e) => {
                                  const catId = e.target.value;
                                  setSelectedTreeCategoryId(catId);
                                  if (activeTourId && catId) {
                                    fetchTreeData(activeTourId, catId);
                                  }
                                }}
                                disabled={eligibleCategories.length === 0}
                                className="bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium disabled:opacity-50"
                              >
                                {eligibleCategories.length === 0 ? (
                                  <option value="">Nenhuma categoria de duplas</option>
                                ) : (
                                  eligibleCategories.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.name || `${c.type} ${c.level}`}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>

                          {/* Quick Info & Byes Count */}
                          {treeData && (
                            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-mono block">Chave Eliminatória</span>
                                <span className="text-xs font-black text-amber-700">
                                  {treeData.byesInfo.bracketSize} Duplas
                                </span>
                              </div>
                              {treeData.byesInfo.byesCount > 0 && (
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 font-mono block">Vagas Diretas</span>
                                  <span className="text-xs font-black text-emerald-600">
                                    {treeData.byesInfo.byesCount} BYE
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Loading State */}
                        {loadingTree && (
                          <div className="p-16 text-center border border-slate-200 rounded-3xl bg-slate-50 space-y-3">
                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs font-bold text-slate-700">Carregando chaveamento da árvore eliminatória...</p>
                            <p className="text-[11px] text-slate-500">Montando os confrontos e posições do mata-mata.</p>
                          </div>
                        )}

                        {/* Empty Category State */}
                        {!loadingTree && eligibleCategories.length === 0 && (
                          <div className="p-12 text-center text-slate-500 border border-slate-200 bg-slate-50 rounded-3xl space-y-3">
                            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                            <p className="font-bold text-slate-900 text-base">Nenhuma categoria de duplas para este torneio.</p>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              Adicione categorias de duplas nas configurações do torneio para gerar a árvore eliminatória.
                            </p>
                          </div>
                        )}

                        {/* Tree Bracket Rendering */}
                        {!loadingTree && treeData && (
                          <TournamentTreeBracket
                            data={treeData}
                            onOpenScoreModal={handleOpenTreeScoreModal}
                            onGenerateElimination={handleGenerateTreeElimination}
                            canManage={session.role === 'SUPER_ADMIN' || (activeTour && activeTour.arenaId === session.arenaId)}
                            loading={loadingTree}
                          />
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* VIEW: MÓDULO INDEPENDENTE SUPER 8 */}
              {activeTab === 'super8' && canPerform('super8', 'view') && (
                <Super8Module
                  session={{
                    id: session.id,
                    username: session.username,
                    role: session.role,
                    arenaId: session.arenaId,
                    name: session.name
                  }}
                  arenas={arenas}
                  venues={venues}
                  athletes={athletes}
                  canCreate={canPerform('super8', 'create')}
                  canEdit={canPerform('super8', 'edit')}
                  canDelete={canPerform('super8', 'delete')}
                  showSuccess={showSuccess}
                  showError={showError}
                  requestConfirmation={({ title, message, confirmLabel, onConfirm }) => {
                    requestConfirmation(
                      title,
                      message,
                      async () => {
                        setConfirmDialog(null);
                        await onConfirm();
                      },
                      confirmLabel || 'Confirmar'
                    );
                  }}
                  onDataChanged={() => fetchData()}
                />
              )}

              {/* VIEW 11: CONFIGURAÇÕES COM USUÁRIOS E PERFIS */}
              {(activeTab === 'settings' || activeTab === 'profiles' || activeTab === 'users') && (
                <motion.div key="settings_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Top Bar com Navegação em Abas dentro de Configurações */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          Painel Administrativo
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2.5">
                        <Settings className="w-5 h-5 text-emerald-600" /> Configurações do Sistema
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Gerencie preferências gerais, permissões de acesso por perfil e a central de usuários cadastrados.
                      </p>
                    </div>

                    {/* Botões das 3 Sub-Abas */}
                    <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-slate-200 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('settings'); setSettingsSubTab('general'); }}
                        className={`flex items-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                          settingsSubTab === 'general' && activeTab === 'settings'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" /> Geral
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveTab('users'); setSettingsSubTab('users'); }}
                        className={`flex items-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                          activeTab === 'users' || settingsSubTab === 'users'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" /> Usuários
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          activeTab === 'users' || settingsSubTab === 'users' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {systemUsers.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveTab('profiles'); setSettingsSubTab('profiles'); }}
                        className={`flex items-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                          activeTab === 'profiles' || settingsSubTab === 'profiles'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" /> Perfis & Permissões
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          activeTab === 'profiles' || settingsSubTab === 'profiles' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {systemProfiles.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Renderização condicional das 3 telas */}
                  {(activeTab === 'users' || settingsSubTab === 'users') ? (
                    <UsersManager
                      users={systemUsers}
                      profiles={systemProfiles}
                      arenas={arenas}
                      onReload={() => fetchData()}
                      showSuccess={showSuccess}
                      showError={showError}
                      requestConfirmation={requestConfirmation}
                      sessionRole={session?.role}
                      userId={session?.id}
                    />
                  ) : (activeTab === 'profiles' || settingsSubTab === 'profiles') ? (
                    <ProfilesManager
                      profiles={systemProfiles}
                      onReload={() => fetchData()}
                      showSuccess={showSuccess}
                      showError={showError}
                      requestConfirmation={requestConfirmation}
                      sessionRole={session?.role}
                      userId={session?.id}
                    />
                  ) : (
                    /* SUB-ABA: GERAL */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sessão Autenticada</p>
                          <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                            {session.name}
                            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              @{session.username}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Papel no Sistema: <span className="text-emerald-600 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{session.role}</span>
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-200 space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Atalhos Administrativos</p>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => { setActiveTab('users'); setSettingsSubTab('users'); }}
                              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition cursor-pointer"
                            >
                              <Users className="w-4 h-4 text-emerald-600 mb-1" />
                              <strong className="text-slate-900 text-xs block">Gerenciar Usuários</strong>
                              <span className="text-[10px] text-slate-500">Criar, desativar e vincular</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => { setActiveTab('profiles'); setSettingsSubTab('profiles'); }}
                              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition cursor-pointer"
                            >
                              <Shield className="w-4 h-4 text-emerald-600 mb-1" />
                              <strong className="text-slate-900 text-xs block">Perfis & Flags</strong>
                              <span className="text-[10px] text-slate-500">Permissões de tela e ações</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resumo de Segurança</p>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">Controle de Acesso por Perfil (RBAC)</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Permissões são aplicadas na interface e validadas nos endpoints das APIs do backend, impedindo acessos e modificações não autorizadas.
                          </p>

                          <div className="mt-4 space-y-2 text-xs">
                            <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500">Total de Usuários:</span>
                              <strong className="text-slate-900 font-mono">{systemUsers.length}</strong>
                            </div>
                            <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500">Perfis de Acesso Ativos:</span>
                              <strong className="text-emerald-600 font-mono">{systemProfiles.length}</strong>
                            </div>
                            <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500">Usuários Ativos:</span>
                              <strong className="text-emerald-700 font-mono">{systemUsers.filter(u => u.status === 'ATIVO').length}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Sincronização com Atletas e Arenas</span>
                          <span className="text-emerald-600 font-bold">🟢 Automática</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </div>

      {/* DETAILED ATHLETE VINCULATOR OVERLAY */}
      {selectedArena && (activeTab === 'athletes' || activeTab === 'arenas') && (
        <div className="fixed inset-0 md:left-64 z-40 bg-white flex flex-col overflow-y-auto border-l border-slate-200 shadow-xl">
          <div className="p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex flex-wrap gap-2.5">
                {session.role === 'SUPER_ADMIN' ? (
                  <button 
                    onClick={handleCloseArenaManagement}
                    className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-slate-900 py-2 px-4 bg-white hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-600" /> Voltar para Arenas
                  </button>
                ) : (
                  <button 
                    onClick={() => { setActiveTab('dashboard'); }}
                    className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-slate-900 py-2 px-4 bg-white hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-600" /> Voltar ao Painel
                  </button>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs font-bold text-rose-700 hover:bg-rose-50 py-2 px-4 bg-white rounded-xl transition border border-rose-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" /> Sair do Sistema
                </button>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Gerenciando Atletas da Arena:</p>
                <p className="text-lg font-black text-slate-900">{selectedArena.name}</p>
                <p className="text-xs text-slate-500">{selectedArena.city} - {selectedArena.state}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Atletas Vinculados à Arena
                    </h2>
                  </div>
                  <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    {arenaAthletes.length} vinculados
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                  <table className="w-full min-w-[500px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Atleta</th>
                        <th className="py-3 px-4">CPF</th>
                        <th className="py-3 px-4">Gênero</th>
                        <th className="py-3 px-4 text-center">Status na Arena</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {arenaAthletes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">Nenhum atleta vinculado ainda nesta arena.</td>
                        </tr>
                      ) : (
                        arenaAthletes.map(ath => (
                          <tr key={ath.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900">{ath.name}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{formatCPF(ath.cpf)}</td>
                            <td className="py-3 px-4 text-slate-700">{ath.gender === 'M' ? 'Masc' : ath.gender === 'F' ? 'Fem' : 'Misto'}</td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center">
                                <button 
                                  onClick={() => handleToggleArenaAthleteStatus(ath.id, ath.arenaStatus)}
                                  className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                    ath.arenaStatus === 'ATIVO' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' 
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
                                  }`}
                                >
                                  {ath.arenaStatus === 'ATIVO' ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>ATIVO</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3.5 h-3.5 text-rose-600" />
                                      <span>BLOQUEADO</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-600" /> Vincular Atletas Globais
                </h2>
                
                {/* Global Athlete Search Bar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Buscar no Cadastro Global</label>
                  <input 
                    type="text"
                    placeholder="Digite Nome ou CPF..."
                    value={searchGlobalQuery}
                    onChange={(e) => setSearchGlobalQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-200 bg-slate-50">
                  {(() => {
                    const cleanQuery = searchGlobalQuery.replace(/\D/g, '');
                    const cleanSearchLower = searchGlobalQuery.toLowerCase().trim();

                    // If search is empty, show default non-arena athletes
                    if (!cleanSearchLower) {
                      if (nonArenaAthletes.length === 0) {
                        return <p className="p-4 text-center text-slate-500 text-xs">Todos os atletas cadastrados já estão vinculados.</p>;
                      }
                      return nonArenaAthletes.map(ath => (
                        <div key={ath.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition">
                          <div>
                            <p className="text-xs font-semibold text-slate-900 leading-none">{ath.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">CPF: {formatCPF(ath.cpf)}</p>
                          </div>
                          <button 
                            onClick={() => handleAssociateAthlete(ath.id)}
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Vincular
                          </button>
                        </div>
                      ));
                    }

                    // Otherwise, search inside entire global registry (athletes list)
                    const matchesSearch = athletes.filter(a => {
                      const cleanCpf = a.cpf.replace(/\D/g, '');
                      if (cleanQuery && cleanCpf.includes(cleanQuery)) return true;
                      return a.name.toLowerCase().includes(cleanSearchLower);
                    });

                    if (matchesSearch.length === 0) {
                      return (
                        <div className="p-5 text-center space-y-3">
                          <p className="text-slate-500 text-xs">Nenhum atleta encontrado no cadastro global.</p>
                          <button
                            onClick={() => {
                              const isNumericCandidate = cleanQuery.length >= 3 && /^\d+$/.test(cleanQuery);
                              setAthleteForm({
                                name: isNumericCandidate ? '' : searchGlobalQuery,
                                cpf: isNumericCandidate ? formatCPF(cleanQuery) : '',
                                birthDate: '',
                                gender: 'M',
                                phone: '',
                                email: '',
                                status: 'ATIVO'
                              });
                              setEditingAthlete(null);
                              setIsAthleteModalOpen(true);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                          >
                            Cadastrar Novo Atleta Global
                          </button>
                        </div>
                      );
                    }

                    return matchesSearch.map(ath => {
                      const isLinked = arenaAthletes.some(aa => aa.id === ath.id);
                      return (
                        <div key={ath.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition">
                          <div>
                            <p className="text-xs font-semibold text-slate-900 leading-none">{ath.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">CPF: {formatCPF(ath.cpf)}</p>
                          </div>
                          {isLinked ? (
                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 py-1 px-2.5 rounded-lg">
                              Já Vinculado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleAssociateAthlete(ath.id)}
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Vincular
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Athlete Modal */}
      {isAthleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                {editingAthlete ? 'Editar Atleta' : 'Novo Atleta'}
              </h3>
              <button onClick={() => setIsAthleteModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveAthlete} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">CPF</label>
                  <input type="text" required placeholder="000.000.000-00" disabled={!!editingAthlete} value={athleteForm.cpf} onChange={(e) => setAthleteForm({ ...athleteForm, cpf: formatCPF(e.target.value) })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 disabled:opacity-50" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Nome Completo</label>
                  <input type="text" required minLength={3} placeholder="Nome do atleta" value={athleteForm.name} onChange={(e) => setAthleteForm({ ...athleteForm, name: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Nascimento</label>
                  <input type="date" required value={athleteForm.birthDate} onChange={(e) => setAthleteForm({ ...athleteForm, birthDate: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Gênero</label>
                  <select value={athleteForm.gender} onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value as any })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="MISTO">Misto</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Telefone</label>
                  <input type="text" required placeholder="(00) 00000-0000" value={athleteForm.phone} onChange={(e) => setAthleteForm({ ...athleteForm, phone: formatPhone(e.target.value) })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-emerald-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">E-mail</label>
                  <input type="email" required placeholder="email@atleta.com" value={athleteForm.email} onChange={(e) => setAthleteForm({ ...athleteForm, email: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsAthleteModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Voltar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/10 cursor-pointer">Salvar Atleta</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Organizador Modal */}
      {isArenaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                {editingArena ? 'Configurar Organizador' : 'Novo Organizador'}
              </h3>
              <button onClick={() => setIsArenaModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveArena} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-700 font-semibold">Nome do Organizador (Clube / Federação / Empresa)</label>
                  <input type="text" required placeholder="Ex: Beach Tennis Tour Brasil, Clube dos Atletas..." value={arenaForm.name} onChange={(e) => setArenaForm({ ...arenaForm, name: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Responsável</label>
                  <input type="text" required placeholder="Nome do responsável" value={arenaForm.owner} onChange={(e) => setArenaForm({ ...arenaForm, owner: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Telefone</label>
                  <input type="text" required placeholder="(00) 00000-0000" value={arenaForm.phone} onChange={(e) => setArenaForm({ ...arenaForm, phone: formatPhone(e.target.value) })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">E-mail</label>
                  <input type="email" required placeholder="contato@organizador.com" value={arenaForm.email} onChange={(e) => setArenaForm({ ...arenaForm, email: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Status</label>
                  <select value={arenaForm.status} onChange={(e) => setArenaForm({ ...arenaForm, status: e.target.value as any })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500">
                    <option value="ATIVA">ATIVA</option>
                    <option value="INATIVA">INATIVA</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Cidade</label>
                  <input type="text" required placeholder="Cidade" value={arenaForm.city} onChange={(e) => setArenaForm({ ...arenaForm, city: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Estado (UF)</label>
                  <input type="text" required maxLength={2} placeholder="Ex: RJ" value={arenaForm.state} onChange={(e) => setArenaForm({ ...arenaForm, state: e.target.value.toUpperCase() })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-sky-500" />
                </div>

                <div className="sm:col-span-2 border-t border-slate-200 pt-4 space-y-2">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-600" /> Acesso Administrador do Organizador</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-500">Usuário (Username)</label>
                      <input type="text" required placeholder="user" value={arenaForm.adminUsername} onChange={(e) => setArenaForm({ ...arenaForm, adminUsername: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-emerald-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-500">Senha</label>
                      <input type="text" required placeholder="password" value={arenaForm.adminPassword} onChange={(e) => setArenaForm({ ...arenaForm, adminPassword: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsArenaModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md shadow-sky-600/15 cursor-pointer">
                  {editingArena ? 'Salvar Organizador' : 'Cadastrar Organizador'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Venue (Arena Física - Local onde os eventos acontecem) Modal */}
      {isVenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-600" />
                {editingVenue ? 'Editar Arena (Local do Evento)' : 'Nova Arena (Local do Evento)'}
              </h3>
              <button onClick={() => setIsVenueModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveVenue} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-700 font-semibold">Nome da Arena (Local Físico)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Arena Sunset Santos, Posto 9 Beach Club..." 
                    value={venueForm.name} 
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-amber-200">
                  <div className="flex justify-between items-center">
                    <label className="text-amber-700 font-bold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      Quantidade Total de Quadras Físicas da Arena:
                    </label>
                    <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 font-bold">
                      {venueForm.courtsCount} {venueForm.courtsCount === 1 ? 'quadra' : 'quadras'}
                    </span>
                  </div>
                  <input 
                    type="number" 
                    required 
                    min={1} 
                    max={50} 
                    placeholder="Ex: 8" 
                    value={venueForm.courtsCount} 
                    onChange={(e) => setVenueForm({ ...venueForm, courtsCount: Math.max(1, Number(e.target.value)) })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono text-sm font-bold focus:outline-none focus:border-amber-500 mt-1" 
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Cada arena possui sua quantidade de quadras. Ao criar um torneio, o organizador poderá definir quantas quadras desta arena vai utilizar no dia do evento (dependendo do número de pessoas inscritas).
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-700 font-semibold">Endereço Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Av. Presidente Wilson, 120 - Praia do Gonzaga" 
                    value={venueForm.address} 
                    onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Cidade</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Santos" 
                    value={venueForm.city} 
                    onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Estado (UF)</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={2} 
                    placeholder="Ex: SP" 
                    value={venueForm.state} 
                    onChange={(e) => setVenueForm({ ...venueForm, state: e.target.value.toUpperCase() })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono uppercase focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Telefone de Contato</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000" 
                    value={venueForm.contactPhone} 
                    onChange={(e) => setVenueForm({ ...venueForm, contactPhone: formatPhone(e.target.value) })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Status da Arena</label>
                  <select 
                    value={venueForm.status} 
                    onChange={(e) => setVenueForm({ ...venueForm, status: e.target.value as any })} 
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ATIVA">ATIVA</option>
                    <option value="INATIVA">INATIVA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsVenueModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-md shadow-amber-500/15 cursor-pointer">
                  {editingVenue ? 'Salvar Arena' : 'Cadastrar Arena'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Torneio Modal (With active categories toggles inside! - Requested Feature!) */}
      {isTourModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                {editingTournament ? 'Editar Torneio' : 'Nova Edição de Torneio'}
              </h3>
              <button onClick={() => setIsTourModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveTournament} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Nome da Série (Série Pai)</label>
                  <input type="text" required placeholder="Ex: Orion Open" value={tourForm.seriesName} onChange={(e) => setTourForm({ ...tourForm, seriesName: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Nome da Edição</label>
                  <input type="text" required placeholder="Ex: Orion Open - Etapa Verão" value={tourForm.name} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>

                {session?.role === 'SUPER_ADMIN' && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-600" /> Organizador Responsável
                    </label>
                    <select 
                      value={tourForm.arenaId} 
                      onChange={(e) => setTourForm({ ...tourForm, arenaId: e.target.value })} 
                      className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      {arenas.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.city} - {a.state})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Arena (Local do Evento) and Quadras Utilizadas no Dia */}
                <div className="flex flex-col gap-3 sm:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-emerald-600" />
                        Arena (Local onde os eventos acontecem)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Estrutura física do campeonato
                      </span>
                    </div>

                    <select 
                      value={tourForm.venueId} 
                      onChange={(e) => {
                        const selectedV = venues.find(v => v.id === e.target.value);
                        const maxCourts = selectedV ? (selectedV.courtsCount || 1) : 4;
                        setTourForm({ 
                          ...tourForm, 
                          venueId: e.target.value,
                          courtsUsed: maxCourts
                        });
                      }}
                      className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-emerald-600"
                    >
                      {venues.length === 0 ? (
                        <option value="">Nenhuma arena cadastrada (adicione em Arenas no menu)</option>
                      ) : (
                        venues.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} — {v.city}/{v.state} ({v.courtsCount} {v.courtsCount === 1 ? 'quadra' : 'quadras'} disponíveis no local)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Número de quadras que o organizador vai utilizar no dia do evento */}
                  {(() => {
                    const currentVenue = venues.find(v => v.id === tourForm.venueId) || venues[0];
                    const maxCourts = currentVenue ? currentVenue.courtsCount : 6;
                    return (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-amber-600" />
                              Número de Quadras Utilizadas no Dia do Evento:
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                              O organizador define quantas quadras da arena ({maxCourts} no total) vai utilizar no dia, dependendo do número de inscritos.
                            </p>
                          </div>
                          <span className="text-sm font-black text-amber-700 font-mono bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg shrink-0">
                            {tourForm.courtsUsed} {tourForm.courtsUsed === 1 ? 'quadra' : 'quadras'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min={1} 
                            max={maxCourts}
                            value={tourForm.courtsUsed} 
                            onChange={(e) => setTourForm({ ...tourForm, courtsUsed: Number(e.target.value) })}
                            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                          />
                          <div className="flex gap-1.5 shrink-0">
                            {[1, 2, 4, 6, maxCourts].filter((n, idx, arr) => n <= maxCourts && arr.indexOf(n) === idx).map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setTourForm({ ...tourForm, courtsUsed: num })}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border cursor-pointer ${
                                  tourForm.courtsUsed === num 
                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
                                }`}
                              >
                                {num === maxCourts ? `Todas (${num})` : `${num}Q`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-semibold">Data Início</label>
                    <input type="date" required value={tourForm.startDate} onChange={(e) => setTourForm({ ...tourForm, startDate: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-emerald-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-semibold">Data Término</label>
                    <input type="date" required value={tourForm.endDate} onChange={(e) => setTourForm({ ...tourForm, endDate: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-emerald-600" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-700 font-semibold">Status do Torneio</label>
                  <select value={tourForm.status} onChange={(e) => setTourForm({ ...tourForm, status: e.target.value as any })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600">
                    <option value="INSCRICOES_ABERTAS">Inscrições Abertas</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="FINALIZADO">Finalizado</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-slate-700 font-semibold flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">i</span>
                    Configurações de Pontuação
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 font-semibold">Quantidade de Games</label>
                      <select
                        value={tourForm.games}
                        onChange={(e) => setTourForm({ ...tourForm, games: Number(e.target.value) as 4 | 6 })}
                        className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
                      >
                        <option value={4}>4 Games</option>
                        <option value={6}>6 Games</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 font-semibold">Thai Break</label>
                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="checkbox"
                          checked={tourForm.thaiBreak}
                          onChange={(e) => setTourForm({ ...tourForm, thaiBreak: e.target.checked })}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                          disabled={tourForm.games !== 6}
                        />
                        <span className={`text-xs ${tourForm.games !== 6 ? 'text-slate-500' : 'text-slate-700'}`}>
                          Ativar Thai Break (7 pts no 6x6, 7x6 no placar)
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {tourForm.games === 4
                      ? '4 Games: um time fecha com 4 e o adversário 0-3.'
                      : tourForm.thaiBreak
                        ? '6 Games + Thai Break: 6-0 a 6-4, 7-5 (no 5x5), 7-6 (Thai Break de 7 pts).'
                        : '6 Games: primeiro a 6, adversário de 0-4.'}
                  </p>
                </div>

                {/* DYNAMIC CATEGORIES DEFINITIONS SECTOR (Loaded from pre-registered master categories) */}
                <div className="sm:col-span-2 border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-slate-800 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        Categorias do Torneio (Selecionadas do Pré-Cadastro)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Marque quais categorias pré-cadastradas no sistema farão parte deste torneio e ajuste a taxa ou vagas se desejar.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = tourCategories.map(c => ({ ...c, enabled: true }));
                          setTourCategories(updated);
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition cursor-pointer"
                      >
                        Marcar Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = tourCategories.map(c => ({ ...c, enabled: false }));
                          setTourCategories(updated);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-medium transition cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 max-h-60 overflow-y-auto bg-slate-50 p-1">
                    {tourCategories.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        Nenhuma categoria pré-cadastrada no sistema. Cadastre categorias no menu &quot;Cadastrar ➔ Categorias&quot;.
                      </div>
                    ) : (
                      tourCategories.map((std, idx) => (
                        <div key={`${std.type}-${std.level}-${idx}`} className="p-3 flex items-center justify-between gap-4">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={std.enabled} 
                              onChange={(e) => {
                                const next = [...tourCategories];
                                next[idx].enabled = e.target.checked;
                                setTourCategories(next);
                              }}
                              className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-900 font-bold">{std.name || `${std.type} ${std.level}`}</span>
                              <span className="block text-[9px] text-slate-500">Modalidade {std.type} • Nível {std.level}</span>
                            </div>
                          </label>

                          {/* Price & MaxParticipants Inputs (only enabled if category is checked) */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-mono text-[11px]">R$</span>
                              <input 
                                type="number" 
                                required={std.enabled}
                                disabled={!std.enabled}
                                min={0}
                                value={std.price}
                                onChange={(e) => {
                                  const next = [...tourCategories];
                                  next[idx].price = Number(e.target.value);
                                  setTourCategories(next);
                                }}
                                placeholder="Valor"
                                className="w-20 bg-white border border-slate-300 text-slate-800 text-xs py-1.5 px-2 rounded-lg font-mono text-right focus:outline-none focus:border-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 font-semibold text-[10px] uppercase">Vagas:</span>
                              <input 
                                type="number" 
                                required={std.enabled}
                                disabled={!std.enabled}
                                min={1}
                                value={std.maxParticipants}
                                onChange={(e) => {
                                  const next = [...tourCategories];
                                  next[idx].maxParticipants = Number(e.target.value);
                                  setTourCategories(next);
                                }}
                                placeholder="Vagas"
                                className="w-16 bg-white border border-slate-300 text-slate-800 text-xs py-1.5 px-2 rounded-lg font-mono text-center focus:outline-none focus:border-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                              <span className="text-slate-500 text-[10px] select-none lowercase">duplas</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-semibold text-[10px] uppercase">Games:</span>
                              <select
                                value={std.games || 4}
                                onChange={(e) => {
                                  const next = [...tourCategories];
                                  next[idx].games = Number(e.target.value);
                                  if (next[idx].games === 4) next[idx].thaiBreak = false;
                                  setTourCategories(next);
                                }}
                                disabled={!std.enabled}
                                className="w-16 bg-white border border-slate-300 text-slate-800 text-xs py-1 rounded-lg focus:outline-none focus:border-emerald-600 disabled:opacity-30"
                              >
                                <option value={4}>4G</option>
                                <option value={6}>6G</option>
                              </select>

                              <input
                                type="checkbox"
                                checked={Boolean(std.thaiBreak)}
                                onChange={(e) => {
                                  const next = [...tourCategories];
                                  next[idx].thaiBreak = e.target.checked;
                                  setTourCategories(next);
                                }}
                                disabled={!std.enabled || (std.games || 4) !== 6}
                                className="w-3.5 h-3.5 accent-amber-500 cursor-pointer disabled:opacity-30"
                                title="Thai Break"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setIsTourModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer">
                  {editingTournament ? 'Salvar Torneio' : 'Criar Torneio'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Modal (EXCLUSIVO SUPER ADMIN - PRÉ-CADASTRO GERAL) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    {editingCategory ? 'Editar Categoria' : 'Pré-Cadastrar Nova Categoria'}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-semibold">SUPER ADMIN</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Defina as características oficiais desta categoria. Ela ficará disponível para seleção em novos torneios.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div className="space-y-4">
                {/* Nome da Categoria */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-bold flex items-center justify-between">
                    <span>Nome da Categoria *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Exibido nos torneios e tabelas</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder={`Ex: ${categoryForm.type} ${categoryForm.level}`}
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 font-bold text-sm"
                  />
                </div>

                {/* Tipo de Competição */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-bold">Tipo de Competição *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['MASCULINO', 'FEMININO', 'MISTA'] as const).map(tipo => {
                      const selected = categoryForm.type === tipo;
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => {
                            const newName = categoryForm.name === '' || categoryForm.name === `${categoryForm.type} ${categoryForm.level}` 
                              ? `${tipo} ${categoryForm.level}` 
                              : categoryForm.name;
                            setCategoryForm({ ...categoryForm, type: tipo, name: newName });
                          }}
                          className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            selected 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-600/15' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-200'
                          }`}
                        >
                          {tipo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nível Técnico */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-bold">Nível Técnico *</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {(['PRINCIPIANTE', 'INICIANTE', 'D', 'C', 'B', 'A', 'OPEN'] as const).map(nv => {
                      const selected = categoryForm.level === nv;
                      return (
                        <button
                          key={nv}
                          type="button"
                          onClick={() => {
                            const newName = categoryForm.name === '' || categoryForm.name === `${categoryForm.type} ${categoryForm.level}` 
                              ? `${categoryForm.type} ${nv}` 
                              : categoryForm.name;
                            setCategoryForm({ ...categoryForm, level: nv, name: newName });
                          }}
                          className={`py-2 px-1 rounded-xl border text-center font-mono font-bold text-xs transition cursor-pointer ${
                            selected 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-200'
                          }`}
                        >
                          {nv}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Taxa de Inscrição */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-bold">Taxa Base de Inscrição (R$) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">R$</span>
                      <input 
                        type="number" 
                        required 
                        min={0}
                        step="5"
                        placeholder="100.00" 
                        value={categoryForm.price} 
                        onChange={(e) => setCategoryForm({ ...categoryForm, price: Number(e.target.value) })} 
                        className="w-full bg-white border border-slate-300 py-2.5 pl-10 pr-3 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 font-mono text-sm font-bold" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Valor padrão sugerido ao criar torneio</span>
                  </div>

                  {/* Limite de Vagas */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-bold">Vagas Padrão *</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      max={128}
                      placeholder="16" 
                      value={categoryForm.maxParticipants} 
                      onChange={(e) => setCategoryForm({ ...categoryForm, maxParticipants: Number(e.target.value) })} 
                      className="bg-white border border-slate-300 py-2.5 px-3 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 font-mono text-sm font-bold" 
                    />
                    <span className="text-[10px] text-slate-500">Capacidade sugerida de duplas/atletas</span>
                  </div>

                  {/* Games & Thai Break Settings */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-bold">Formato de Pontuação *</label>
                    <select
                      value={categoryForm.games}
                      onChange={(e) => setCategoryForm({ ...categoryForm, games: Number(e.target.value) as 4 | 6, thaiBreak: Number(e.target.value) === 6 ? categoryForm.thaiBreak : false })}
                      className="bg-white border border-slate-300 py-2.5 px-3 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 font-mono text-sm font-bold"
                    >
                      <option value={4}>4 Games</option>
                      <option value={6}>6 Games</option>
                    </select>
                    <span className="text-[10px] text-slate-500">4G: um time fecha 4x0-3. 6G: 6x0-4 ou Thai Break (7x5, 7x6)</span>
                  </div>

                  {categoryForm.games === 6 && (
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={categoryForm.thaiBreak}
                        onChange={(e) => setCategoryForm({ ...categoryForm, thaiBreak: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                      <label className="text-slate-700 font-semibold cursor-pointer">
                        Ativar Thai Break (7 pts no 6x6, placar 7x6)
                      </label>
                    </div>
                  )}
                </div>

                {/* Status Toggle & Descrição */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-bold">Status no Sistema</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, status: 'ATIVA' })}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          categoryForm.status === 'ATIVA'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ativa
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, status: 'INATIVA' })}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          categoryForm.status === 'INATIVA'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Inativa
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 font-bold">Escopo do Cadastro</label>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pré-Cadastro Geral do Sistema</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-bold">Descrição / Observações (Opcional)</label>
                  <textarea 
                    rows={2}
                    placeholder="Informações sobre regras de pontuação, restrições ou nível técnico..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="py-2.5 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer font-semibold">Cancelar</button>
                <button type="submit" className="py-2.5 px-6 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center gap-2">
                  <Check className="w-4 h-4 stroke-[3]" />
                  {editingCategory ? 'Salvar Alterações' : 'Cadastrar Categoria'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Enrollment (Inscrição) Modal */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Inscrever Atleta em Categoria
              </h3>
              <button onClick={() => setIsRegModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateRegistration} className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Torneio</label>
                <select 
                  value={regForm.tournamentId} 
                  onChange={(e) => setRegForm({ ...regForm, tournamentId: e.target.value, categoryId: '' })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="">Selecione o Torneio</option>
                  {tournaments.map(t => {
                    const vigente = isTournamentVigente(t);
                    const arenaName = arenas.find(a => a.id === t.arenaId)?.name;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.seriesName ? `· ${t.seriesName}` : ''} {session?.role === 'SUPER_ADMIN' && arenaName ? `[${arenaName}]` : ''} — {vigente ? '🟢 Vigente' : '🔴 Expirado (Fechado)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {(() => {
                const tourSelected = tournaments.find(t => t.id === regForm.tournamentId);
                if (tourSelected && !isTournamentVigente(tourSelected)) {
                  return (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Inscrições Encerradas (Período Expirado)</strong>
                        <span>O período vigente desta edição encerrou em {new Date(tourSelected.endDate).toLocaleDateString('pt-BR')}. Não é mais permitido registrar inscrições nesta edição. Gere uma nova edição para receber inscrições.</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Categoria</label>
                <select 
                  value={regForm.categoryId} 
                  onChange={(e) => setRegForm({ ...regForm, categoryId: e.target.value })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Selecione a Categoria</option>
                  {categories.filter(c => c.tournamentId === regForm.tournamentId).map(c => (
                    <option key={c.id} value={c.id}>{c.type} {c.level} (R$ {c.price})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-semibold">Atletas</label>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar atleta..."
                      value={searchRegAthleteCreate}
                      onChange={(e) => setSearchRegAthleteCreate(e.target.value)}
                      className="bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl max-h-48 overflow-y-auto">
                  {athletes
                    .filter(a => a.status === 'ATIVO' && (!searchRegAthleteCreate || a.name.toLowerCase().includes(searchRegAthleteCreate.toLowerCase()) || a.cpf.includes(searchRegAthleteCreate)))
                    .map(a => (
                      <label key={a.id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regForm.selectedAthleteIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegForm({ ...regForm, selectedAthleteIds: [...regForm.selectedAthleteIds, a.id] });
                            } else {
                              setRegForm({ ...regForm, selectedAthleteIds: regForm.selectedAthleteIds.filter(id => id !== a.id) });
                            }
                          }}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                        <span className="text-slate-800">{a.name} ({formatCPF(a.cpf)})</span>
                      </label>
                    ))}
                </div>
                {regForm.selectedAthleteIds.length > 0 && (
                  <p className="text-xs text-emerald-600">{regForm.selectedAthleteIds.length} atleta(s) selecionado(s)</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Status da Inscrição</label>
                <select 
                  value={regForm.status} 
                  onChange={(e) => setRegForm({ ...regForm, status: e.target.value as any })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="PENDENTE_PAGAMENTO">Pendente de Pagamento</option>
                  <option value="CONFIRMADA">Confirmada</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsRegModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                {(() => {
                  const tourSelected = tournaments.find(t => t.id === regForm.tournamentId);
                  const isVigente = isTournamentVigente(tourSelected);
                  return (
                    <button 
                      type="submit" 
                      disabled={!regForm.tournamentId || !isVigente}
                      className="py-2.5 px-5 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      {isVigente ? 'Confirmar Inscrição' : 'Inscrições Encerradas'}
                    </button>
                  );
                })()}
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Duo (Dupla) Modal */}
      {isDuoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Formar Nova Dupla
              </h3>
              <button onClick={() => setIsDuoModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateDuo} className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Torneio</label>
                <select 
                  value={duoForm.tournamentId} 
                  onChange={(e) => setDuoForm({ ...duoForm, tournamentId: e.target.value, categoryId: '', player1Id: '', player2Id: '' })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Selecione o Torneio</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Categoria</label>
                <select 
                  value={duoForm.categoryId} 
                  onChange={(e) => setDuoForm({ ...duoForm, categoryId: e.target.value, player1Id: '', player2Id: '' })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Selecione a Categoria</option>
                  {categories.filter(c => c.tournamentId === duoForm.tournamentId).map(c => (
                    <option key={c.id} value={c.id}>{c.type} {c.level}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Jogador 1 (Inscrito nesta categoria)</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar jogador 1..."
                    value={searchDuoPlayer1}
                    onChange={(e) => setSearchDuoPlayer1(e.target.value)}
                    className="bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 mb-1"
                  />
                </div>
                <select
                  value={duoForm.player1Id}
                  onChange={(e) => setDuoForm({ ...duoForm, player1Id: e.target.value })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Selecione Jogador 1</option>
                  {(() => {
                    const existingDuoPlayerIdsInCat = new Set(
                      duos
                        .filter(d => d.categoryId === duoForm.categoryId)
                        .flatMap(d => [d.player1Id || d.player1, d.player2Id || d.player2])
                    );
                    return registrations
                      .filter(r => 
                        r.categoryId === duoForm.categoryId && 
                        r.status === 'CONFIRMADA' && 
                        !existingDuoPlayerIdsInCat.has(r.athleteId) &&
                        r.athleteName && 
                        r.athleteName.toLowerCase().includes(searchDuoPlayer1.toLowerCase())
                      )
                      .map(r => <option key={r.athleteId} value={r.athleteId}>{r.athleteName}</option>);
                  })()}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Jogador 2 (Inscrito nesta categoria)</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar jogador 2..."
                    value={searchDuoPlayer2}
                    onChange={(e) => setSearchDuoPlayer2(e.target.value)}
                    className="bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 mb-1"
                  />
                </div>
                <select
                  value={duoForm.player2Id}
                  onChange={(e) => setDuoForm({ ...duoForm, player2Id: e.target.value })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Selecione Jogador 2</option>
                  {(() => {
                    const existingDuoPlayerIdsInCat = new Set(
                      duos
                        .filter(d => d.categoryId === duoForm.categoryId)
                        .flatMap(d => [d.player1Id || d.player1, d.player2Id || d.player2])
                    );
                    return registrations
                      .filter(r => 
                        r.categoryId === duoForm.categoryId && 
                        r.status === 'CONFIRMADA' && 
                        r.athleteId !== duoForm.player1Id && 
                        !existingDuoPlayerIdsInCat.has(r.athleteId) &&
                        r.athleteName && 
                        r.athleteName.toLowerCase().includes(searchDuoPlayer2.toLowerCase())
                      )
                      .map(r => <option key={r.athleteId} value={r.athleteId}>{r.athleteName}</option>);
                  })()}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsDuoModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer">Formar Dupla</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Match (Jogo) Modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Agendar Partida Manual
              </h3>
              <button onClick={() => setIsMatchModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateMatch} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-700 font-semibold">Torneio</label>
                  <select 
                    value={matchForm.tournamentId} 
                    onChange={(e) => setMatchForm({ ...matchForm, tournamentId: e.target.value, categoryId: '', duo1Id: '', duo2Id: '' })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Selecione o Torneio</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-700 font-semibold">Categoria</label>
                  <select 
                    value={matchForm.categoryId} 
                    onChange={(e) => setMatchForm({ ...matchForm, categoryId: e.target.value, duo1Id: '', duo2Id: '' })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Selecione a Categoria</option>
                    {categories.filter(c => c.tournamentId === matchForm.tournamentId).map(c => (
                      <option key={c.id} value={c.id}>{c.type} {c.level}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Fase</label>
                  <input type="text" required value={matchForm.stage} onChange={(e) => setMatchForm({ ...matchForm, stage: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Grupo (Opcional)</label>
                  <input type="text" value={matchForm.groupName} onChange={(e) => setMatchForm({ ...matchForm, groupName: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-700 font-semibold">Dupla 1</label>
                  <select 
                    value={matchForm.duo1Id} 
                    onChange={(e) => setMatchForm({ ...matchForm, duo1Id: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Selecione Dupla 1</option>
                    {duos.filter(d => d.categoryId === matchForm.categoryId).map(d => (
                      <option key={d.id} value={d.id}>{d.player1Name} + {d.player2Name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-700 font-semibold">Dupla 2</label>
                  <select 
                    value={matchForm.duo2Id} 
                    onChange={(e) => setMatchForm({ ...matchForm, duo2Id: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Selecione Dupla 2</option>
                    {duos.filter(d => d.categoryId === matchForm.categoryId && d.id !== matchForm.duo1Id).map(d => (
                      <option key={d.id} value={d.id}>{d.player1Name} + {d.player2Name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Data</label>
                  <input type="date" required value={matchForm.date} onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-emerald-600" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Horário</label>
                  <input type="text" required placeholder="14:00" value={matchForm.time} onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-emerald-600" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-700 font-semibold flex items-center justify-between">
                    <span>Quadra (Local)</span>
                    <span className="text-[10px] text-slate-500">Selecione ou personalize</span>
                  </label>
                  {(() => {
                    const tour = tournaments.find(t => t.id === matchForm.tournamentId);
                    const courtsCount = tour?.courtsUsed && tour.courtsUsed >= 1 ? tour.courtsUsed : 4;
                    const quickCourts = Array.from({ length: courtsCount }, (_, i) => `Quadra ${i + 1}`);

                    return (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {quickCourts.map(cName => (
                            <button
                              key={cName}
                              type="button"
                              onClick={() => setMatchForm({ ...matchForm, court: cName })}
                              className={`py-1 px-3 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                                matchForm.court === cName
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                              }`}
                            >
                              {cName}
                            </button>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Quadra 1, Quadra Central..."
                          value={matchForm.court} 
                          onChange={(e) => setMatchForm({ ...matchForm, court: e.target.value })} 
                          className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 w-full font-mono text-xs focus:outline-none focus:border-emerald-600" 
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsMatchModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer">Agendar Partida</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dynamic Match Generator Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-600" /> Gerador de Jogos Automático</h3>
              <button onClick={() => setIsGenModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleGenerateMatches} className="p-6 space-y-4 text-xs">
              {(() => {
                const tour = tournaments.find(t => t.id === genForm.tournamentId);

                return (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 font-semibold">Torneio</label>
                      <select 
                        value={genForm.tournamentId} 
                        onChange={(e) => setGenForm({ ...genForm, tournamentId: e.target.value, categoryId: '' })}
                        className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Selecione o Torneio</option>
                        {tournaments.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 font-semibold">Categoria</label>
                      <select 
                        value={genForm.categoryId} 
                        onChange={(e) => setGenForm({ ...genForm, categoryId: e.target.value })}
                        className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Selecione a Categoria</option>
                        {categories.filter(c => c.tournamentId === genForm.tournamentId).map(c => (
                          <option key={c.id} value={c.id}>{c.type} {c.level} {c.name ? `(${c.name})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Esta ferramenta apagará as partidas pendentes e gerará novos jogos no formato <strong>Todos contra Todos (Round Robin)</strong> para as duplas cadastradas na categoria.
                    </p>

                    {tour && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                        <p className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-600" />
                          Local: <strong className="text-slate-900">{tour.venueName || 'Arena Local'}</strong>
                        </p>
                        <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          Quadras do evento: <strong className="font-mono">{tour.courtsUsed || 4} quadras</strong>
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 font-semibold">Data dos Jogos</label>
                        <input type="date" required value={genForm.date} onChange={(e) => setGenForm({ ...genForm, date: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-amber-500" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 font-semibold">Prefixo Quadra</label>
                        <input type="text" required value={genForm.court} onChange={(e) => setGenForm({ ...genForm, court: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button type="button" onClick={() => setIsGenModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                      <button 
                        type="submit" 
                        className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition shadow-md shadow-amber-500/15 cursor-pointer"
                      >
                        Gerar Jogos Chaveados
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </motion.div>
        </div>
      )}

      {/* Lançar Placar Modal */}
      {isResultModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                Lançar Resultado de Partida
              </h3>
              <button onClick={() => setIsResultModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveResultSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-center border border-slate-200">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{selectedMatch.categoryName}</p>
                  {selectedMatch.round && (
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      Rodada {selectedMatch.round} · Jogo {selectedMatch.matchNumber}
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-slate-900 mt-1.5">{selectedMatch.duo1Name} <span className="text-amber-600 font-extrabold mx-1">vs</span> {selectedMatch.duo2Name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedMatch.court} @ {selectedMatch.time}</p>
              </div>

              {/* Traditional Duo Scoring */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Placar (Sets / Games)</label>
                <input type="text" required placeholder="Ex: 6/4 6/3 ou 6/1 3/6 10/7" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono text-center text-sm font-bold focus:border-emerald-600 focus:outline-none" />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isDraw"
                  checked={resultForm.isDraw || false}
                  onChange={(e) => setResultForm({ ...resultForm, isDraw: e.target.checked, winnerDuoId: e.target.checked ? '' : (resultForm.winnerDuoId || selectedMatch.duo1Id) })}
                  className="w-4 h-4 accent-slate-400 cursor-pointer"
                />
                <label htmlFor="isDraw" className="text-slate-700 font-semibold cursor-pointer">
                  Empate (ninguém vence)
                </label>
              </div>

              {!resultForm.isDraw && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Dupla Vencedora</label>
                  <select
                    value={resultForm.winnerDuoId || selectedMatch.duo1Id}
                    onChange={(e) => setResultForm({ ...resultForm, winnerDuoId: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value={selectedMatch.duo1Id}>{selectedMatch.duo1Name}</option>
                    <option value={selectedMatch.duo2Id}>{selectedMatch.duo2Name}</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsResultModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10 cursor-pointer">Salvar Placar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lançar WO Modal */}
      {isWoModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Lançar W.O. (Ausência)
              </h3>
              <button onClick={() => setIsWoModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveWoSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-center border border-rose-200">
                <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">{selectedMatch.categoryName}</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMatch.duo1Name} <span className="text-slate-500">vs</span> {selectedMatch.duo2Name}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  A dupla ausente será derrotada por W.O. (6/0 6/0 oficial).
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Quem compareceu à quadra (Vencedor)</label>
                <select 
                  value={woForm.winnerDuoId} 
                  onChange={(e) => setWoForm({ ...woForm, winnerDuoId: e.target.value })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value={selectedMatch.duo1Id}>{selectedMatch.duo1Name}</option>
                  <option value={selectedMatch.duo2Id}>{selectedMatch.duo2Name}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsWoModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer">Confirmar W.O.</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quick Change Match Court Modal */}
      {isChangeCourtModalOpen && targetMatchForCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Alterar Quadra da Partida
              </h3>
              <button onClick={() => setIsChangeCourtModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveChangedCourt} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 border border-slate-200">
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {targetMatchForCourt.categoryName}
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {targetMatchForCourt.duo1Name} <span className="text-amber-600 font-extrabold mx-1">vs</span> {targetMatchForCourt.duo2Name}
                </p>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200 mt-2">
                  <span>Horário: <strong className="text-slate-800 font-mono">{targetMatchForCourt.time}</strong></span>
                  <span>Quadra Atual: <strong className="text-amber-600 font-mono">{targetMatchForCourt.court}</strong></span>
                </div>
              </div>

              {(() => {
                const tour = tournaments.find(t => t.id === targetMatchForCourt.tournamentId);
                const courtsCount = tour?.courtsUsed && tour.courtsUsed >= 1 ? tour.courtsUsed : 4;
                const quickCourts = Array.from({ length: courtsCount }, (_, i) => `Quadra ${i + 1}`);

                return (
                  <div className="space-y-2">
                    <label className="text-slate-700 font-semibold block">
                      Selecione uma das quadras alocadas para o torneio:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {quickCourts.map(cName => (
                        <button
                          key={cName}
                          type="button"
                          onClick={() => setSelectedCourtName(cName)}
                          className={`py-2 px-3 rounded-xl font-bold font-mono text-xs transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedCourtName === cName
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-200 hover:bg-white'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {cName}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Ou digite o nome de outra quadra:</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Quadra Central, Quadra 5..." 
                  value={selectedCourtName} 
                  onChange={(e) => setSelectedCourtName(e.target.value)} 
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-emerald-600" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsChangeCourtModalOpen(false)} className="py-2 px-4 text-slate-500 hover:text-slate-900 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/10 cursor-pointer">
                  Salvar Nova Quadra
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {confirmDialog.title}
              </h3>
              <button 
                onClick={() => setConfirmDialog(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {confirmDialog.confirmLabel || 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* FLOATING GLOBAL NOTIFICATIONS TOAST */}
      <div className="fixed top-4 right-4 z-[100] max-w-sm space-y-2 pointer-events-none">
        <AnimatePresence>
          {errorMsg && (
            <motion.div key="error-toast" 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-white border border-rose-200 text-rose-700 text-xs p-4 rounded-2xl flex items-start gap-3 shadow-xl"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Erro / Alerta</p>
                <p className="mt-0.5 text-slate-700 leading-relaxed font-semibold">{errorMsg}</p>
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div key="success-toast" 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-white border border-emerald-200 text-emerald-700 text-xs p-4 rounded-2xl flex items-start gap-3 shadow-xl"
            >
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Sucesso!</p>
                <p className="mt-0.5 text-slate-700 leading-relaxed font-semibold">{successMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DE SUGESTÃO DE PRÓXIMO JOGO NA QUADRA LIBERADA */}
      {courtFreedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white border border-emerald-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 " />
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Quadra Liberada: {courtFreedNotice.freedCourt}
                </h3>
              </div>
              <button 
                onClick={() => setCourtFreedNotice(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Quadra Disponível Agora
                  </span>
                  <span className="text-emerald-600 font-mono font-bold text-xs">{courtFreedNotice.freedCourt}</span>
                </div>
                <p className="text-slate-700 text-xs">
                  O placar anterior foi lançado e a quadra foi automaticamente liberada pelo sistema.
                </p>
              </div>

              {courtFreedNotice.nextMatchSuggestion ? (
                <div className="space-y-3">
                  <p className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Sugestão de Próximo Jogo para Iniciar Nesta Quadra:
                  </p>

                  <div className="bg-slate-50 border border-amber-200 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {courtFreedNotice.nextMatchSuggestion.categoryName || 'Categoria'}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">
                        {courtFreedNotice.nextMatchSuggestion.stage}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {courtFreedNotice.nextMatchSuggestion.duo1Name} 
                      <span className="text-amber-600 font-black mx-1.5">vs</span> 
                      {courtFreedNotice.nextMatchSuggestion.duo2Name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                      <span>Horário previsto: <strong className="text-slate-800 font-mono">{courtFreedNotice.nextMatchSuggestion.time || '14:00'}</strong></span>
                      <span className="text-emerald-600 font-bold">Pronto para chamada</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-900 text-xs">Todos os jogos desta rodada já foram iniciados!</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">A quadra permanecerá livre aguardando os próximos chaveamentos.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCourtFreedNotice(null)}
                  className="py-2 px-4 rounded-xl text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  Fechar
                </button>
                {courtFreedNotice.nextMatchSuggestion && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`/api/matches/${courtFreedNotice.nextMatchSuggestion.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ court: courtFreedNotice.freedCourt })
                        });
                        showSuccess(`Partida direcionada para a ${courtFreedNotice.freedCourt}!`);
                        setCourtFreedNotice(null);
                        fetchData();
                        setActiveTab('matches');
                      } catch {
                        setCourtFreedNotice(null);
                      }
                    }}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/10 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Iniciar Jogo Nesta Quadra
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xs border-t border-slate-200 shadow-xl px-2 py-1.5 flex justify-around items-center">
        <button
          type="button"
          onClick={() => { handleNavTab('dashboard'); handleCloseArenaManagement(); }}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Início</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavTab('tournaments')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl transition ${
            activeTab === 'tournaments' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Torneios</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavTab('matches')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl transition ${
            activeTab === 'matches' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Jogos</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavTab('duos')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl transition ${
            activeTab === 'duos' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Duplas</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl transition ${
            ['athletes', 'arenas', 'venues', 'categories', 'registrations', 'results', 'reports', 'settings', 'bracket-tree', 'super8', 'profiles', 'users'].includes(activeTab)
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Mais</span>
        </button>
      </nav>
    </div>
  );
}
