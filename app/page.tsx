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
  AlertTriangle
} from 'lucide-react';

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
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN';
  arenaId: string | null;
  name: string;
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
  isDuo?: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  tournamentId?: string;
  masterCategoryId?: string;
  name?: string;
  type: 'SUPER 8' | 'MISTA' | 'MASCULINO' | 'FEMININO';
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  maxParticipants?: number;
  status?: 'ATIVA' | 'INATIVA';
  description?: string;
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
  categoryName: string;
  stage: string;
  groupName?: string;
  duo1: string;
  duo2: string;
  date: string;
  time: string;
  court: string;
  status: 'PENDENTE' | 'FINALIZADA' | 'WO';
  score?: string;
  winnerDuo?: string;
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
  { type: 'MISTA' as const, level: 'OPEN' as const },
  
  { type: 'SUPER 8' as const, level: 'OPEN' as const }
];

export default function Home() {
  // Authentication State
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'athletes' | 'arenas' | 'venues' | 'tournaments' | 'categories' | 'registrations' | 'duos' | 'matches' | 'results' | 'reports' | 'settings'
  >('dashboard');

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
    isDuo: true
  });

  // Interactive categories selection state inside tournament modal (Selected from system's pre-registered categories!)
  const [tourCategories, setTourCategories] = useState<{
    masterCategoryId?: string;
    name?: string;
    type: 'SUPER 8' | 'MISTA' | 'MASCULINO' | 'FEMININO';
    level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
    price: number;
    maxParticipants: number;
    enabled: boolean;
  }[]>([]);

  // Categorias CRUD Modals (Super Admin Master Registry)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    tournamentId: 'GLOBAL',
    type: 'MASCULINO' as 'SUPER 8' | 'MISTA' | 'MASCULINO' | 'FEMININO',
    level: 'C' as 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN',
    price: 100,
    maxParticipants: 16,
    status: 'ATIVA' as 'ATIVA' | 'INATIVA',
    description: ''
  });

  // New persistent form/modal states
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    tournamentId: '',
    categoryId: '',
    athleteId: '',
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

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [resultForm, setResultForm] = useState({
    score: '6/4 6/3',
    winnerDuoId: ''
  });
  const [woForm, setWoForm] = useState({
    winnerDuoId: ''
  });

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

      const [resAthletes, resArenas, resVenues, resTournaments, resCategories, resRegistrations, resDuos, resMatches] = await Promise.all([
        fetch('/api/athletes'),
        fetch('/api/arenas'),
        fetch('/api/venues'),
        fetch(tournamentsUrl),
        fetch(categoriesUrl),
        fetch(registrationsUrl),
        fetch(duosUrl),
        fetch(matchesUrl)
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
    setTourForm({
      name: '',
      seriesName: '',
      arenaId: session?.arenaId || (arenas[0]?.id || ''),
      venueId: initialVenue?.id || '',
      courtsUsed: initialVenue ? Math.min(4, initialVenue.courtsCount) : 4,
      startDate: '',
      endDate: '',
      status: 'INSCRICOES_ABERTAS',
      isDuo: true
    });

    // Carregar as categorias pré-cadastradas no sistema para seleção no torneio
    const masterCats = categories.filter(c => !c.tournamentId || c.tournamentId === 'GLOBAL');
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
    setTourForm({
      name: t.name,
      seriesName: t.seriesName,
      arenaId: t.arenaId,
      venueId: t.venueId || (matchedVenue?.id || ''),
      courtsUsed: t.courtsUsed || (matchedVenue ? Math.min(4, matchedVenue.courtsCount) : 4),
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      isDuo: t.isDuo !== undefined ? t.isDuo : true
    });

    // Mapear categorias pré-cadastradas sincronizando com as ativadas para este torneio
    const masterCats = categories.filter(c => !c.tournamentId || c.tournamentId === 'GLOBAL');
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

    const payload = {
      ...tourForm,
      arenaId: session?.role === 'ARENA_ADMIN' ? session.arenaId : tourForm.arenaId,
      venueId: tourForm.venueId,
      courtsUsed: Number(tourForm.courtsUsed) || 1,
      enabledCategories: tourCategories // Send categories matrix to API
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
      'Deseja carregar todas as categorias oficiais padrão do Beach Tennis (Open, A, B, C, D, Iniciante, Principiante, Mistas e Super 8) no sistema?',
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
  const handleOpenRegistrationCreate = () => {
    setRegForm({
      tournamentId: tournaments[0]?.id || '',
      categoryId: '',
      athleteId: '',
      status: 'PENDENTE_PAGAMENTO'
    });
    setIsRegModalOpen(true);
  };

  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.tournamentId || !regForm.categoryId || !regForm.athleteId) {
      showError('Por favor preencha todos os campos.');
      return;
    }
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao registrar inscrição.');
      showSuccess('Atleta inscrito com sucesso!');
      setIsRegModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao realizar inscrição.');
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
  const handleOpenDuoCreate = () => {
    setDuoForm({
      tournamentId: tournaments[0]?.id || '',
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
  const handleOpenMatchCreate = () => {
    setMatchForm({
      tournamentId: tournaments[0]?.id || '',
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

  const handleOpenGenMatches = () => {
    setGenForm({
      tournamentId: tournaments[0]?.id || '',
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
    setResultForm({
      score: '6/4 6/3',
      winnerDuoId: match.duo1Id
    });
    setIsResultModalOpen(true);
  };

  const handleSaveResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: resultForm.score,
          winnerDuoId: resultForm.winnerDuoId,
          isWO: false
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar resultado.');
      showSuccess('Resultado registrado com sucesso!');
      setIsResultModalOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar placar.');
    }
  };

  const handleToggleWO = (match: any) => {
    setSelectedMatch(match);
    setWoForm({
      winnerDuoId: match.duo1Id
    });
    setIsWoModalOpen(true);
  };

  const handleSaveWoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerDuoId: woForm.winnerDuoId,
          isWO: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar WO.');
      showSuccess('Partida encerrada por WO.');
      setIsWoModalOpen(false);
      fetchData();
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
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-8 z-10 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 p-0.5 justify-center items-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0f172a] rounded-[14px] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">BtControl</h1>
            <p className="text-xs text-slate-400 font-medium">Gestão Profissional de Beach Tennis</p>
          </div>

          <div className="bg-[#090d16] border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Acesso Rápido para Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button 
                type="button"
                onClick={() => setLoginForm({ username: 'admin', password: 'admin123' })}
                className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 p-2.5 rounded-xl text-slate-200 transition text-left group"
              >
                <strong className="block text-white group-hover:text-emerald-400 transition-colors">Super Admin</strong>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">admin / admin123</span>
              </button>

              <button 
                type="button"
                onClick={() => setLoginForm({ username: 'ipanema', password: 'ipa123' })}
                className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 p-2.5 rounded-xl text-slate-200 transition text-left group"
              >
                <strong className="block text-white group-hover:text-emerald-400 transition-colors">Ipanema Admin</strong>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">ipanema / ipa123</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Nome de Usuário</label>
              <input 
                type="text"
                required
                placeholder="Digite seu usuário..."
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="bg-[#090d16] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Senha de Acesso</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-[#090d16] border border-slate-700/80 rounded-xl py-2.5 px-3.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0d1424] border-r border-slate-800/80 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-amber-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">BtControl</span>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5 font-medium">Beach Tennis Hub</p>
            </div>
          </div>

          <nav className="p-3.5 space-y-1 text-xs">
            <button 
              onClick={() => { setActiveTab('dashboard'); handleCloseArenaManagement(); }}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{session.role === 'SUPER_ADMIN' ? 'Painel Geral' : 'Painel da Arena'}</span>
            </button>

            {/* ÍCONE / MENU CADASTRAR */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsCadastrarExpanded(!isCadastrarExpanded)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-bold transition-all ${
                  ['athletes', 'arenas', 'venues', 'categories'].includes(activeTab)
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    ['athletes', 'arenas', 'venues', 'categories'].includes(activeTab)
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    <FolderPlus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-black tracking-tight text-[13px]">Cadastrar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800/80 text-emerald-400 font-mono font-bold border border-slate-700/60">
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
                    className="overflow-hidden pl-3.5 pr-1 pt-1.5 space-y-1 border-l-2 border-emerald-500/20 ml-4 my-1"
                  >
                    {/* Opção 1: Atletas Globais */}
                    <button 
                      onClick={() => { setActiveTab('athletes'); handleCloseArenaManagement(); }}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                        activeTab === 'athletes' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{session.role === 'SUPER_ADMIN' ? 'Atletas Globais' : 'Atletas da Arena'}</span>
                    </button>

                    {/* Opção 2: Organizadores */}
                    {session.role === 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => { setActiveTab('arenas'); handleCloseArenaManagement(); }}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                          activeTab === 'arenas' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Organizadores</span>
                      </button>
                    )}

                    {/* Opção 3: Arenas (Locais) */}
                    <button 
                      onClick={() => { setActiveTab('venues'); handleCloseArenaManagement(); }}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                        activeTab === 'venues' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Arenas (Locais)</span>
                    </button>

                    {/* Opção 4: Categorias (Super Admin) - Cadastro vem ANTES dos torneios */}
                    {session.role === 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => { setActiveTab('categories'); handleCloseArenaManagement(); }}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                          activeTab === 'categories' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          <span>Categorias</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-semibold">ADMIN</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-800/80 my-2 pt-2">
              <span className="px-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Torneios & Jogos</span>
            </div>

            <button 
              onClick={() => setActiveTab('tournaments')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'tournaments' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Trophy className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Torneios</span>
            </button>

            <button 
              onClick={() => setActiveTab('registrations')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'registrations' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <ClipboardList className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Inscrições</span>
            </button>

            <button 
              onClick={() => setActiveTab('duos')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'duos' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Duplas</span>
            </button>

            <button 
              onClick={() => setActiveTab('matches')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'matches' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Jogos / Quadras</span>
            </button>

            <button 
              onClick={() => setActiveTab('results')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'results' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Award className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Resultados / WO</span>
            </button>

            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'reports' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Relatórios</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Configurações</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#090d16] text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 uppercase">
              {session.username.substring(0, 2)}
            </div>
            <div className="truncate">
              <p className="font-bold text-white leading-none truncate">{session.name}</p>
              <span className="text-[10px] text-emerald-400/90 font-medium">{session.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin da Arena'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-rose-950/30 text-slate-300 hover:text-rose-400 rounded-xl transition font-semibold border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sair
          </button>
        </div>
      </aside>

      {/* CORE VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Mobile Navbar Header */}
        <header className="md:hidden sticky top-0 z-40 bg-[#0d1424] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-base font-black text-white bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">BtControl</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); handleCloseArenaManagement(); }}
              className={`p-1.5 px-3 rounded-lg text-xs font-semibold ${activeTab === 'dashboard' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
            >
              Menu
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Notifications inside Viewport */}
        <div className="p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-400 text-sm">Carregando painel de controle...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* VIEW 1: DASHBOARD */}
              {activeTab === 'dashboard' && (session.role === 'ARENA_ADMIN' || !selectedArena) && (
                <motion.div key="db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Hero Banner */}
                  <div className="bg-gradient-to-r from-[#0d1424] via-[#0f1930] to-[#0d1424] border border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            {session.role === 'SUPER_ADMIN' ? 'Central Geral de Controle' : 'Painel do Organizador'}
                          </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          Bem-vindo ao BtControl
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                          {session.role === 'SUPER_ADMIN' 
                            ? 'Gestão unificada em tempo real de organizadores, arenas com quadras, torneios, categorias e atletas cadastrados.'
                            : `Painel de gerenciamento exclusivo de ${arenas.find(a => a.id === session.arenaId)?.name || session.name}.`}
                        </p>
                      </div>

                      {/* Quick Shortcuts */}
                      <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                        <button 
                          onClick={handleOpenTournamentCreate}
                          className="flex items-center gap-2 py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Novo Torneio
                        </button>
                        <button 
                          onClick={handleOpenVenueCreate}
                          className="flex items-center gap-2 py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition"
                        >
                          <Building className="w-3.5 h-3.5 text-amber-400" /> Nova Arena (Local)
                        </button>
                        <button 
                          onClick={handleOpenAthleteCreate}
                          className="flex items-center gap-2 py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-400" /> Cadastrar Atleta
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl transition shadow-md group">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Atletas Cadastrados</p>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mt-2 font-mono">
                        {session.role === 'SUPER_ADMIN' ? athletes.length : arenaAthletes.length}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {session.role === 'SUPER_ADMIN' ? 'Total na plataforma' : 'Vinculados à sua arena'}
                      </p>
                    </div>

                    {session.role === 'SUPER_ADMIN' ? (
                      <div className="bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl transition shadow-md group">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Organizadores</p>
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Shield className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-3xl font-black text-white mt-2 font-mono">{arenas.length}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Clubes e entidades gestoras</p>
                      </div>
                    ) : (
                      <div className="bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl transition shadow-md group">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meu Organizador</p>
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Shield className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-sm font-bold text-amber-300 mt-3 truncate">
                          {arenas.find(a => a.id === session.arenaId)?.name || session.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Perfil autenticado</p>
                      </div>
                    )}

                    <div className="bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl transition shadow-md group">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Arenas Físicas (Locais)</p>
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                          <Building className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-teal-300 font-mono">{venues.length}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({venues.reduce((acc, v) => acc + (v.courtsCount || 0), 0)} quadras)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Espaços com quadras ativas</p>
                    </div>

                    <div className="bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl transition shadow-md group">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Torneios</p>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Trophy className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mt-2 font-mono">{tournaments.length}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {tournaments.filter(t => t.status === 'INSCRICOES_ABERTAS' || t.status === 'EM_ANDAMENTO').length} em andamento / abertos
                      </p>
                    </div>
                  </div>

                  {/* Summary Section: Active Tournaments */}
                  <div className="bg-[#0d1424] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Torneios em Destaque</h2>
                      </div>
                      <button 
                        onClick={() => setActiveTab('tournaments')} 
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition"
                      >
                        Ver Todos →
                      </button>
                    </div>

                    {tournaments.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl space-y-2">
                        <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhum torneio cadastrado no momento.</p>
                        <button 
                          onClick={handleOpenTournamentCreate} 
                          className="text-xs text-emerald-400 hover:underline font-bold inline-block"
                        >
                          Clique aqui para criar o primeiro torneio
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournaments.slice(0, 3).map(t => {
                          const venueObj = venues.find(v => v.id === t.venueId);
                          return (
                            <div key={t.id} className="bg-[#090e1a] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t.seriesName}</span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    t.status === 'INSCRICOES_ABERTAS' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                    t.status === 'EM_ANDAMENTO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                    {t.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <h3 className="font-bold text-white text-sm mt-1 truncate">{t.name}</h3>
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                                  <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="truncate">{venueObj?.name || 'Local a definir'}</span>
                                </p>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{t.courtsUsed || 4} quadras</span>
                                <button 
                                  onClick={() => setActiveTab('tournaments')} 
                                  className="text-emerald-400 hover:text-emerald-300 font-bold"
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
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        Gestão Global de Atletas
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Base centralizada de atletas cadastrados com controle de CPF, gênero, contato e status.
                      </p>
                    </div>
                    <button 
                      onClick={handleOpenAthleteCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Atleta
                    </button>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou CPF..." 
                      value={searchAthlete}
                      onChange={(e) => setSearchAthlete(e.target.value)}
                      className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    <div className="text-[11px] text-slate-400 whitespace-nowrap px-1">
                      Total: <strong className="text-white font-mono">{filteredAthletes.length}</strong> {filteredAthletes.length === 1 ? 'atleta' : 'atletas'}
                    </div>
                  </div>

                  <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/40 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px]">
                          <th className="p-4">Nome</th>
                          <th className="p-4">CPF</th>
                          <th className="p-4">Gênero</th>
                          <th className="p-4">Contato</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredAthletes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400">
                              Nenhum atleta encontrado com o filtro informado.
                            </td>
                          </tr>
                        ) : (
                          filteredAthletes.map(a => (
                            <tr key={a.id} className="hover:bg-slate-800/30 transition">
                              <td className="p-4 font-bold text-white">{a.name}</td>
                              <td className="p-4 font-mono text-slate-300">{formatCPF(a.cpf)}</td>
                              <td className="p-4 text-slate-300">{a.gender === 'M' ? 'Masculino' : a.gender === 'F' ? 'Feminino' : 'Misto'}</td>
                              <td className="p-4 text-slate-300">{a.email || a.phone || '—'}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                  a.status === 'ATIVO' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleOpenAthleteEdit(a)} 
                                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
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
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-400" />
                        Gestão de Organizadores
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Clubes e entidades responsáveis pelos campeonatos, credenciais de acesso e administração de atletas vinculados.
                      </p>
                    </div>
                    <button 
                      onClick={handleOpenArenaCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Novo Organizador
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar organizadores por nome ou cidade..." 
                      value={searchArena}
                      onChange={(e) => setSearchArena(e.target.value)}
                      className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    <div className="text-[11px] text-slate-400 whitespace-nowrap px-1">
                      Total: <strong className="text-white font-mono">{filteredArenas.length}</strong> {filteredArenas.length === 1 ? 'organizador' : 'organizadores'}
                    </div>
                  </div>

                  {/* Arenas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredArenas.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-800 bg-[#0d1424]/40 rounded-2xl space-y-2">
                        <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhum organizador cadastrado no momento.</p>
                        <button 
                          onClick={handleOpenArenaCreate}
                          className="text-xs text-emerald-400 hover:underline font-bold inline-block"
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
                            className="bg-[#0d1424] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group"
                          >
                            <div className="space-y-3.5">
                              {/* Card Header: Name + Status */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-emerald-400 transition-colors">
                                    {arena.name}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <span>{arena.city} - {arena.state}</span>
                                  </p>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  arena.status === 'ATIVA' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  {arena.status}
                                </span>
                              </div>

                              {/* Details: Owner, Phone, Email */}
                              <div className="text-xs text-slate-400 space-y-1 bg-[#090e1a] p-3 rounded-xl border border-slate-800/80">
                                <p className="truncate">
                                  <span className="text-slate-500 font-medium">Responsável:</span>{' '}
                                  <strong className="text-slate-200">{arena.owner || 'Não informado'}</strong>
                                </p>
                                {arena.phone && (
                                  <p className="truncate font-mono">
                                    <span className="text-slate-500 font-sans font-medium">Telefone:</span>{' '}
                                    <span className="text-slate-300">{formatPhone(arena.phone)}</span>
                                  </p>
                                )}
                                {arena.email && (
                                  <p className="truncate">
                                    <span className="text-slate-500 font-medium">E-mail:</span>{' '}
                                    <span className="text-slate-300">{arena.email}</span>
                                  </p>
                                )}
                                <div className="pt-1.5 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400">
                                  <span>Torneios gerenciados:</span>
                                  <strong className="text-emerald-400 font-mono">{tourCount}</strong>
                                </div>
                              </div>

                              {/* Admin Credentials Preview */}
                              <div className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Acesso Administrador</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Usuário:</span>
                                  <strong className="text-slate-200">{arena.adminUsername || '—'}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Senha:</span>
                                  <strong className="text-slate-200">{arena.adminPassword || '••••••'}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Full CRUD Actions */}
                            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-800 gap-2">
                              <button 
                                onClick={() => handleOpenArenaManagement(arena)} 
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                                title="Ver atletas vinculados"
                              >
                                <Users className="w-3.5 h-3.5" /> Atletas
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => handleOpenArenaEdit(arena)} 
                                  className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
                                  title="Editar Organizador e Credenciais"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Editar
                                </button>
                                <button 
                                  onClick={() => handleDeleteArena(arena)} 
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
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
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-amber-400" />
                        Arenas (Locais dos Eventos)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Espaços e complexos esportivos onde os jogos acontecem, com o total de quadras físicas disponíveis.
                      </p>
                    </div>
                    <button 
                      onClick={handleOpenVenueCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Nova Arena (Local)
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar arenas por nome, cidade ou endereço..." 
                      value={searchVenue}
                      onChange={(e) => setSearchVenue(e.target.value)}
                      className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    <div className="text-[11px] text-slate-400 whitespace-nowrap px-1">
                      Total: <strong className="text-white font-mono">{filteredVenues.length}</strong> {filteredVenues.length === 1 ? 'arena' : 'arenas'}
                    </div>
                  </div>

                  {/* Venues Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredVenues.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-800 bg-[#0d1424]/40 rounded-2xl space-y-2">
                        <Building className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhuma arena física cadastrada no momento.</p>
                        <button 
                          onClick={handleOpenVenueCreate} 
                          className="text-xs text-emerald-400 hover:underline font-bold inline-block"
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
                            className="bg-[#0d1424] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group"
                          >
                            <div className="space-y-3.5">
                              {/* Header: Name + Status */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-emerald-400 transition-colors">
                                    {venue.name}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{venue.city} - {venue.state}</span>
                                  </p>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  venue.status === 'ATIVA' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  {venue.status}
                                </span>
                              </div>

                              {/* Number of Courts Badge */}
                              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                                    <Layers className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Estrutura de Jogos</span>
                                    <p className="text-sm font-black text-emerald-300 font-mono">
                                      {venue.courtsCount} {venue.courtsCount === 1 ? 'Quadra' : 'Quadras'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-300 bg-[#090e1a] px-2.5 py-1 rounded-lg border border-slate-800 font-medium">
                                  No local
                                </span>
                              </div>

                              {/* Location details */}
                              <div className="text-xs text-slate-400 space-y-1 bg-[#090e1a] p-3 rounded-xl border border-slate-800/80">
                                {venue.address && (
                                  <p className="truncate">
                                    <span className="text-slate-500 font-medium">Endereço:</span>{' '}
                                    <span className="text-slate-300">{venue.address}</span>
                                  </p>
                                )}
                                {venue.contactPhone && (
                                  <p className="truncate font-mono">
                                    <span className="text-slate-500 font-sans font-medium">Contato:</span>{' '}
                                    <span className="text-slate-300">{formatPhone(venue.contactPhone)}</span>
                                  </p>
                                )}
                                <div className="pt-1.5 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400">
                                  <span>Torneios sediados:</span>
                                  <strong className="text-emerald-400 font-mono">{linkedTourneys}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: CRUD Actions */}
                            <div className="flex items-center justify-end mt-4 pt-3.5 border-t border-slate-800 gap-2">
                              <button 
                                onClick={() => handleOpenVenueEdit(venue)} 
                                className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                                title="Editar dados da arena e quantidade de quadras"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteVenue(venue)} 
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
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
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-emerald-400" />
                        Gestão de Torneios
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Gerenciamento completo de edições de campeonatos, quadras utilizadas e organizadores.</p>
                    </div>
                    <button 
                      onClick={handleOpenTournamentCreate} 
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Torneio
                    </button>
                  </div>

                  <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Buscar torneios por nome ou série..." 
                      value={searchTournament}
                      onChange={(e) => setSearchTournament(e.target.value)}
                      className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    <div className="text-[11px] text-slate-400 whitespace-nowrap px-1">
                      Total: <strong className="text-white font-mono">{filteredTournaments.length}</strong> {filteredTournaments.length === 1 ? 'torneio' : 'torneios'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-800 bg-[#0d1424]/40 rounded-2xl space-y-2">
                        <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhum torneio cadastrado nesta arena/filtro.</p>
                        <button 
                          onClick={handleOpenTournamentCreate} 
                          className="text-xs text-emerald-400 hover:underline font-bold inline-block"
                        >
                          Clique aqui para cadastrar um torneio
                        </button>
                      </div>
                    ) : (
                      filteredTournaments.map(t => {
                        const arenaObj = arenas.find(a => a.id === t.arenaId);
                        const venueObj = venues.find(v => v.id === t.venueId);
                        return (
                          <div key={t.id} className="bg-[#0d1424] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition shadow-md group">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Série: {t.seriesName}</span>
                                    <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                      {t.isDuo === false ? 'Individual' : 'Dupla'}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-white text-base mt-1 group-hover:text-emerald-400 transition-colors">{t.name}</h3>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  t.status === 'INSCRICOES_ABERTAS' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 
                                  t.status === 'EM_ANDAMENTO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                                  'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {t.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 space-y-1.5 pt-1 bg-[#090e1a] p-3 rounded-xl border border-slate-800/80">
                                <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Organizador: <strong className="text-slate-200">{arenaObj?.name || 'Não informado'}</strong></p>
                                <p className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Local: <strong className="text-teal-300">{venueObj?.name || t.venueName || 'Local a definir'}</strong></p>
                                <p className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Quadras no evento: <strong className="text-emerald-300 font-mono">{t.courtsUsed || 4} quadras</strong> {venueObj && <span className="text-[10px] text-slate-500">({venueObj.courtsCount} no local)</span>}</p>
                                <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Período: <span className="font-mono text-slate-300">{new Date(t.startDate).toLocaleDateString('pt-BR')}</span> até <span className="font-mono text-slate-300">{new Date(t.endDate).toLocaleDateString('pt-BR')}</span></p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-800">
                              <button 
                                onClick={() => setActiveTab('categories')}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1"
                              >
                                <Layers className="w-3 h-3" /> Categorias
                              </button>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleOpenTournamentEdit(t)} 
                                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                                  title="Editar Torneio"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTournament(t.id)} 
                                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition"
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
                  <motion.div key="cat-denied" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="my-12 max-w-lg mx-auto bg-[#0d1424] border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
                      <Shield className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-block mb-3">
                      Acesso Restrito
                    </span>
                    <h3 className="text-xl font-black text-white mb-2">Permissão Super Admin Obrigatória</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      Apenas o <strong>Administrador Geral (SUPER_ADMIN)</strong> possui permissão para cadastrar, editar e gerenciar as categorias do sistema.
                    </p>
                    <button 
                      onClick={() => setActiveTab('dashboard')} 
                      className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700 hover:border-slate-600"
                    >
                      Voltar ao Painel Principal
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1424] border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-400" /> Super Admin
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Pré-Cadastro de Categorias Oficiais</span>
                        </div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                          <Layers className="w-6 h-6 text-emerald-400" />
                          Cadastro e Gestão de Categorias
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                          Cadastre previamente as categorias oficiais de disputa (níveis, tipos, taxas base e limite de vagas). Ao criar um torneio, os organizadores selecionam quais categorias cadastradas farão parte do evento.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={handleResetCategoriesPresets}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700 hover:border-slate-600 cursor-pointer"
                          title="Restaurar categorias oficiais padrão do Beach Tennis"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Padrões Oficiais</span>
                        </button>

                        <button 
                          onClick={handleOpenCategoryCreate} 
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Categoria
                        </button>
                      </div>
                    </div>

                    {/* KPI Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-[#0d1424] border border-slate-800 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-400 font-medium block mb-1">Total de Categorias</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white font-mono">{categories.length}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">cadastradas</span>
                        </div>
                      </div>

                      <div className="bg-[#0d1424] border border-slate-800 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-400 font-medium block mb-1">Categorias Ativas</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-emerald-400 font-mono">
                            {categories.filter(c => c.status !== 'INATIVA').length}
                          </span>
                          <span className="text-[10px] text-slate-400">para torneios</span>
                        </div>
                      </div>

                      <div className="bg-[#0d1424] border border-slate-800 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-400 font-medium block mb-1">Taxa Média Base</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white font-mono">
                            R$ {categories.length > 0 
                              ? (categories.reduce((acc, c) => acc + (c.price || 0), 0) / categories.length).toFixed(0)
                              : '0'}
                          </span>
                          <span className="text-[10px] text-slate-400">por inscrição</span>
                        </div>
                      </div>

                      <div className="bg-[#0d1424] border border-slate-800 p-4 rounded-2xl">
                        <span className="text-[11px] text-slate-400 font-medium block mb-1">Capacidade Padrão</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono">
                            {categories.reduce((acc, c) => acc + (c.maxParticipants || 16), 0)}
                          </span>
                          <span className="text-[10px] text-slate-400">vagas sugeridas</span>
                        </div>
                      </div>
                    </div>

                    {/* Filters & Search Toolbar */}
                    <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-80">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Buscar por nome, tipo ou nível..." 
                            value={searchCategory}
                            onChange={(e) => setSearchCategory(e.target.value)}
                            className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
                          {/* Filter by Type */}
                          <select 
                            value={filterCategoryType}
                            onChange={(e) => setFilterCategoryType(e.target.value)}
                            className="bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="ALL">Todos os Tipos</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMININO">Feminino</option>
                            <option value="MISTA">Mista</option>
                            <option value="SUPER 8">Super 8</option>
                          </select>

                          {/* Filter by Level */}
                          <select 
                            value={filterCategoryLevel}
                            onChange={(e) => setFilterCategoryLevel(e.target.value)}
                            className="bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
                            className="bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="ALL">Todos os Status</option>
                            <option value="ATIVA">Apenas Ativas</option>
                            <option value="INATIVA">Apenas Inativas</option>
                          </select>

                          {/* Filter by Scope */}
                          <select 
                            value={filterCategoryTournament}
                            onChange={(e) => setFilterCategoryTournament(e.target.value)}
                            className="bg-[#090e1a] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold whitespace-nowrap cursor-pointer px-2"
                          >
                            Limpar Filtros
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>Exibindo <strong>{filteredCategories.length}</strong> de <strong>{categories.length}</strong> categorias cadastradas</span>
                        <span className="text-emerald-400/90 font-medium flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Categorias prontas para vincular na criação de novos torneios
                        </span>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                              <th className="p-4">Categoria & Nível</th>
                              <th className="p-4">Origem / Escopo</th>
                              <th className="p-4">Taxa Base</th>
                              <th className="p-4">Vagas Sugeridas</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Ações (Super Admin)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {filteredCategories.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                  <div className="flex flex-col items-center justify-center gap-3">
                                    <Layers className="w-10 h-10 text-slate-600 mb-1" />
                                    <p className="font-bold text-white text-sm">Nenhuma categoria encontrada com os filtros atuais.</p>
                                    <p className="text-xs text-slate-400 max-w-md">
                                      Você pode sincronizar as categorias padrão oficiais do Beach Tennis com 1 clique ou cadastrar uma nova categoria manualmente.
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                      <button 
                                        onClick={handleResetCategoriesPresets}
                                        className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Carregar Categorias Padrão
                                      </button>
                                      <button 
                                        onClick={handleOpenCategoryCreate}
                                        className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
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
                                      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                                    case 'FEMININO':
                                      return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
                                    case 'MISTA':
                                      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
                                    case 'SUPER 8':
                                      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                                    default:
                                      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
                                  }
                                };

                                return (
                                  <tr key={c.id} className="hover:bg-slate-800/30 transition group">
                                    <td className="p-4">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase font-mono ${getTypeBadge(c.type)}`}>
                                            {c.type}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                                            Nível {c.level}
                                          </span>
                                        </div>
                                        <div className="font-bold text-white text-sm mt-0.5">
                                          {c.name || `${c.type} ${c.level}`}
                                        </div>
                                        {c.description && (
                                          <span className="text-[10px] text-slate-400 line-clamp-1">{c.description}</span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="p-4">
                                      {isGlobal ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                                          <Sparkles className="w-3 h-3 text-emerald-400" />
                                          Pré-cadastrada no Sistema
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="font-semibold text-white leading-snug">{c.tournamentName}</div>
                                          <span className="text-[10px] text-slate-500">Vinculada a torneio</span>
                                        </div>
                                      )}
                                    </td>

                                    <td className="p-4">
                                      <div className="font-mono text-emerald-300 text-sm font-black">
                                        R$ {c.price.toFixed(2)}
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-medium">taxa padrão</span>
                                    </td>

                                    <td className="p-4">
                                      <div className="font-mono text-white text-xs font-bold">
                                        {c.maxParticipants || 16} vagas
                                      </div>
                                      <span className="text-[10px] text-slate-500">duplas / atletas</span>
                                    </td>

                                    <td className="p-4">
                                      <button 
                                        onClick={() => handleToggleCategoryStatus(c)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                          isAtiva 
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25' 
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                        }`}
                                        title={isAtiva ? 'Clique para desativar esta categoria' : 'Clique para ativar esta categoria'}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isAtiva ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                        {isAtiva ? 'ATIVA' : 'INATIVA'}
                                      </button>
                                    </td>

                                    <td className="p-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                          onClick={() => handleOpenCategoryEdit(c)} 
                                          className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px] transition flex items-center gap-1 border border-slate-700 hover:border-slate-600 cursor-pointer"
                                          title="Editar Categoria"
                                        >
                                          <Edit2 className="w-3 h-3 text-emerald-400" /> Editar
                                        </button>

                                        <button 
                                          onClick={() => handleDuplicateCategory(c)} 
                                          className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-[11px] transition flex items-center gap-1 border border-slate-700 hover:border-slate-600 cursor-pointer"
                                          title="Duplicar como Nova Categoria"
                                        >
                                          <Plus className="w-3 h-3 text-amber-400" /> Clonar
                                        </button>

                                        <button 
                                          onClick={() => handleDeleteCategory(c.id)} 
                                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition border border-transparent hover:border-rose-800/40 cursor-pointer"
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
                <motion.div key="reg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-emerald-400" />
                        Inscrições de Atletas
                      </h2>
                      <p className="text-xs text-slate-400">Controle de inscrições de atletas em torneios, confirmação e pagamento.</p>
                    </div>
                    <button 
                      onClick={handleOpenRegistrationCreate}
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Inscrever Atleta
                    </button>
                  </div>

                  <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/40 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px]">
                          <th className="p-4">Atleta</th>
                          <th className="p-4">Categoria</th>
                          <th className="p-4">Torneio</th>
                          <th className="p-4">Data Inscrição</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {registrations.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400">Nenhuma inscrição ativa cadastrada.</td>
                          </tr>
                        ) : (
                          registrations.map(r => (
                            <tr key={r.id} className="hover:bg-slate-800/30 transition">
                              <td className="p-4 font-bold text-white">{r.athleteName}</td>
                              <td className="p-4 font-semibold text-emerald-300">{r.categoryName}</td>
                              <td className="p-4 text-slate-300">{r.tournamentName}</td>
                              <td className="p-4 font-mono text-slate-400">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>
                              <td className="p-4">
                                {r.status === 'CONFIRMADA' ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                                    Confirmada
                                  </span>
                                ) : r.status === 'PENDENTE_PAGAMENTO' ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                                    Pendente de Pagamento
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wide">
                                    Cancelada
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2 items-center">
                                  {r.status === 'PENDENTE_PAGAMENTO' && (
                                    <button 
                                      onClick={() => handleUpdateRegistrationStatus(r.id, 'CONFIRMADA')}
                                      className="py-1 px-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-emerald-400 transition flex items-center gap-1 shadow-sm"
                                      title="Confirmar Pagamento e Inscrição"
                                    >
                                      <Check className="w-3 h-3" /> Confirmar Pagamento
                                    </button>
                                  )}
                                  {r.status === 'CONFIRMADA' && (
                                    <button 
                                      onClick={() => handleUpdateRegistrationStatus(r.id, 'PENDENTE_PAGAMENTO')}
                                      className="py-1 px-2 bg-slate-800 text-amber-400 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                      title="Mudar Status para Pendente de Pagamento"
                                    >
                                      <AlertCircle className="w-3 h-3" /> Marcar Pendente
                                    </button>
                                  )}
                                  {r.status !== 'CANCELADA' && (
                                    <button 
                                      onClick={() => handleCancelRegistration(r.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-950/20 transition"
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
                </motion.div>
              )}

              {/* VIEW 7: DUPLAS */}
              {activeTab === 'duos' && (
                <motion.div key="duos_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1424] border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" /> Formação de Duplas
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Duplas formadas por categoria para competições oficiais.</p>
                    </div>
                    <button 
                      onClick={handleOpenDuoCreate}
                      className="flex items-center gap-2 py-2 px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Formar Dupla
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {duos.filter(d => tournaments.find(t => t.id === d.tournamentId)?.isDuo !== false).length === 0 ? (
                      <div className="col-span-full p-12 text-center text-slate-400 border border-slate-800/80 bg-[#0d1424]/40 rounded-2xl space-y-3">
                        <Users className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-300">Nenhuma dupla formada no momento.</p>
                        <p className="text-xs text-slate-500">Clique no botão acima para combinar dois atletas já inscritos na mesma categoria.</p>
                      </div>
                    ) : (
                      duos.filter(d => tournaments.find(t => t.id === d.tournamentId)?.isDuo !== false).map(d => (
                        <div key={d.id} className="bg-[#0d1424] border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl flex justify-between items-center transition shadow-sm hover:shadow-md">
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {d.categoryName}
                            </span>
                            <p className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
                              <span>{d.player1Name}</span>
                              <span className="text-amber-400 font-extrabold">&</span>
                              <span>{d.player2Name}</span>
                            </p>
                            <span className="text-[11px] text-slate-400 block">Torneio: <strong className="text-slate-300">{d.tournamentName}</strong></span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                              {d.status}
                            </span>
                            <button 
                              onClick={() => handleDeleteDuo(d.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition"
                              title="Desfazer Dupla"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 8: JOGOS */}
              {activeTab === 'matches' && (
                <motion.div key="matches_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1424] border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" /> Grade de Jogos e Quadras
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Grade completa de confrontos agendados por quadra e horário.</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button 
                        onClick={handleOpenGenMatches}
                        className="flex items-center gap-2 py-2 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        <Activity className="w-4 h-4" /> Gerar Jogos Automaticamente
                      </button>
                      <button 
                        onClick={handleOpenMatchCreate}
                        className="flex items-center gap-2 py-2 px-3.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Agendar Jogo Manual
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {matches.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 border border-slate-800/80 bg-[#0d1424]/40 rounded-2xl space-y-3">
                        <Activity className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-300">Nenhum jogo agendado.</p>
                        <p className="text-xs text-slate-500">Utilize o gerador automático acima para criar os confrontos da chave ou agende manualmente.</p>
                      </div>
                    ) : (
                      matches.map(m => (
                        <div key={m.id} className="bg-[#0d1424] border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-sm hover:shadow-md">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {m.stage} {m.groupName && `· ${m.groupName}`}
                            </span>
                            <p className="text-sm font-bold text-white mt-1.5">
                              {m.duo1Name} <span className="text-amber-400 font-extrabold mx-1">VS</span> {m.duo2Name}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">{m.categoryName}</p>
                            <p className="text-[11px] text-slate-500">Torneio: <strong className="text-slate-400">{m.tournamentName}</strong></p>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right text-xs text-slate-400 space-y-1.5">
                              <div className="flex items-center sm:justify-end gap-2 flex-wrap">
                                <button 
                                  type="button"
                                  onClick={() => handleOpenChangeCourt(m)}
                                  className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-mono font-bold transition shadow-sm group"
                                  title="Clique para transferir esta partida para outra quadra"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                  <span>{m.court}</span>
                                  <span className="text-[10px] text-emerald-400/80 font-sans font-medium underline ml-0.5">Trocar</span>
                                </button>
                                <span className="font-mono text-slate-300 font-semibold">@ {m.time}</span>
                              </div>
                              <div>
                                <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  m.status === 'FINALIZADA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 
                                  m.status === 'WO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 
                                  'bg-slate-800/80 text-slate-300 border border-slate-700'
                                }`}>
                                  {m.status} {m.score && `(${m.score})`}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteMatch(m.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition"
                              title="Excluir Jogo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 9: RESULTADOS & WO */}
              {activeTab === 'results' && (
                <motion.div key="results_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="bg-[#0d1424] border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" /> Lançamento de Resultados & W.O.
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Lançamento oficial de placares. Registro de ausências (W.O.) mantendo auditoria completa.</p>
                  </div>

                  <div className="bg-[#0d1424] border border-slate-800/80 rounded-2xl p-6 space-y-4">
                    {matches.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 border border-slate-800/60 rounded-xl bg-slate-900/20">
                        Nenhum jogo cadastrado para registrar placar.
                      </div>
                    ) : (
                      matches.map(m => (
                        <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#090e1a] border border-slate-800/80 rounded-xl gap-4 hover:border-slate-700/80 transition">
                          <div>
                            <p className="text-xs font-bold text-slate-400">{m.categoryName} · {m.stage}</p>
                            <p className="text-sm font-bold text-white mt-1">
                              {m.duo1Name} <span className="text-amber-400 font-extrabold mx-1">vs</span> {m.duo2Name}
                            </p>
                            {m.score && (
                              <p className="text-xs font-mono font-bold text-emerald-400 mt-1.5 flex items-center gap-1.5">
                                <span className="text-slate-400 font-sans font-medium text-[11px]">Placar Oficial:</span> {m.score}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto justify-end">
                            {m.status === 'PENDENTE' ? (
                              <>
                                <button 
                                  onClick={() => handleLaunchResult(m)} 
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-sm"
                                >
                                  Lançar Placar
                                </button>
                                <button 
                                  onClick={() => handleToggleWO(m)} 
                                  className="bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold px-3.5 py-1.5 rounded-xl text-xs border border-rose-800/40 transition"
                                >
                                  Lançar WO
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <Check className="w-4 h-4 text-emerald-400" /> Finalizado ({m.status})
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 10: RELATÓRIOS & LEADERBOARDS */}
              {activeTab === 'reports' && (
                <motion.div key="reports_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-[#0d1424] border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" /> Classificação & Liderança de Categorias
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Métricas oficiais em tempo real de vitórias e líderes com base nos jogos registrados.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map(t => {
                      // Filter categories of this tournament
                      const tourCats = categories.filter(c => c.tournamentId === t.id);

                      return (
                        <div key={t.id} className="bg-[#0d1424] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-sm">
                          <div className="border-b border-slate-800/80 pb-3">
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{t.seriesName}</span>
                            <h3 className="font-black text-white text-base mt-0.5">{t.name}</h3>
                          </div>

                          <div className="space-y-4">
                            {tourCats.length === 0 ? (
                              <p className="text-xs text-slate-400">Nenhuma categoria habilitada.</p>
                            ) : (
                              tourCats.map(cat => {
                                // Find duos for this category
                                const catDuos = duos.filter(d => d.categoryId === cat.id);
                                
                                // Calculate wins per duo
                                const leaderboard = catDuos.map(duo => {
                                  const wins = matches.filter(m => 
                                    m.categoryId === cat.id && 
                                    (m.status === 'FINALIZADA' || m.status === 'WO') && 
                                    m.winnerDuoId === duo.id
                                  ).length;
                                  
                                  const totalPlayed = matches.filter(m => 
                                    m.categoryId === cat.id && 
                                    (m.status === 'FINALIZADA' || m.status === 'WO') && 
                                    (m.duo1Id === duo.id || m.duo2Id === duo.id)
                                  ).length;

                                  return { duo, wins, totalPlayed };
                                }).sort((a, b) => b.wins - a.wins);

                                return (
                                  <div key={cat.id} className="bg-[#090e1a] p-3.5 rounded-xl space-y-2.5 border border-slate-800/70">
                                    <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wide">{cat.type} {cat.level}</p>
                                    
                                    <div className="space-y-2">
                                      {leaderboard.length === 0 ? (
                                        <p className="text-[10px] text-slate-500">Nenhuma dupla formada.</p>
                                      ) : (
                                        leaderboard.map((item, index) => (
                                          <div key={item.duo.id} className="flex justify-between items-center text-[11px]">
                                            <span className="truncate text-slate-200">
                                              {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : `${index + 1}º `}
                                              <strong className="text-white">{item.duo.player1Name.split(' ')[0]} / {item.duo.player2Name.split(' ')[0]}</strong>
                                            </span>
                                            <span className="font-mono text-emerald-400 font-bold shrink-0 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">{item.wins}V / {item.totalPlayed}J</span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* VIEW 11: CONFIGURAÇÕES */}
              {activeTab === 'settings' && (
                <motion.div key="settings_view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="bg-[#0d1424] border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-400" /> Configurações Gerais
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Preferências do sistema administrativo de Beach Tennis.</p>
                  </div>

                  <div className="bg-[#0d1424] border border-slate-800/80 p-6 rounded-2xl space-y-4 max-w-xl shadow-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perfil Ativo</p>
                      <p className="text-base font-bold text-white">{session.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Permissão: <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{session.role}</span></p>
                    </div>

                    <div className="space-y-1 pt-4 border-t border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configurações da Base</p>
                      <p className="text-xs text-slate-300">Banco de dados local persistente ativo e sincronizado.</p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </div>

      {/* DETAILED ATHLETE VINCULATOR OVERLAY */}
      {selectedArena && (activeTab === 'athletes' || activeTab === 'arenas') && (
        <div className="fixed inset-0 md:left-64 z-40 bg-[#070b14] flex flex-col overflow-y-auto border-l border-slate-800/80 shadow-2xl">
          <div className="p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex flex-wrap gap-2.5">
                {session.role === 'SUPER_ADMIN' ? (
                  <button 
                    onClick={handleCloseArenaManagement}
                    className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white py-2 px-4 bg-[#0d1424] hover:bg-slate-800/80 rounded-xl transition border border-slate-800/80 cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" /> Voltar para Arenas
                  </button>
                ) : (
                  <button 
                    onClick={() => { setActiveTab('dashboard'); }}
                    className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white py-2 px-4 bg-[#0d1424] hover:bg-slate-800/80 rounded-xl transition border border-slate-800/80 cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" /> Voltar ao Painel
                  </button>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs font-bold text-rose-300 hover:bg-rose-950/30 py-2 px-4 bg-[#0d1424] rounded-xl transition border border-rose-900/30 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" /> Sair do Sistema
                </button>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Gerenciando Atletas da Arena:</p>
                <p className="text-lg font-black text-white">{selectedArena.name}</p>
                <p className="text-xs text-slate-400">{selectedArena.city} - {selectedArena.state}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 bg-[#0d1424] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" /> Atletas Vinculados à Arena
                    </h2>
                  </div>
                  <span className="text-xs text-emerald-300 font-mono font-bold bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-xl">
                    {arenaAthletes.length} vinculados
                  </span>
                </div>

                <div className="overflow-hidden border border-slate-800/80 rounded-xl bg-[#090e1a]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#0d1424] text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Atleta</th>
                        <th className="py-3 px-4">CPF</th>
                        <th className="py-3 px-4">Gênero</th>
                        <th className="py-3 px-4 text-center">Status na Arena</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {arenaAthletes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">Nenhum atleta vinculado ainda nesta arena.</td>
                        </tr>
                      ) : (
                        arenaAthletes.map(ath => (
                          <tr key={ath.id} className="hover:bg-slate-850/40 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-white">{ath.name}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">{formatCPF(ath.cpf)}</td>
                            <td className="py-3 px-4 text-slate-300">{ath.gender === 'M' ? 'Masc' : ath.gender === 'F' ? 'Fem' : 'Misto'}</td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center">
                                <button 
                                  onClick={() => handleToggleArenaAthleteStatus(ath.id, ath.arenaStatus)}
                                  className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                    ath.arenaStatus === 'ATIVO' 
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' 
                                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                                  }`}
                                >
                                  {ath.arenaStatus === 'ATIVO' ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>ATIVO</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3.5 h-3.5 text-rose-400" />
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

              <div className="bg-[#0d1424] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" /> Vincular Atletas Globais
                </h2>
                
                {/* Global Athlete Search Bar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Buscar no Cadastro Global</label>
                  <input 
                    type="text"
                    placeholder="Digite Nome ou CPF..."
                    value={searchGlobalQuery}
                    onChange={(e) => setSearchGlobalQuery(e.target.value)}
                    className="w-full bg-[#090e1a] border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto border border-slate-800/80 rounded-xl divide-y divide-slate-800/60 bg-[#090e1a]">
                  {(() => {
                    const cleanQuery = searchGlobalQuery.replace(/\D/g, '');
                    const cleanSearchLower = searchGlobalQuery.toLowerCase().trim();

                    // If search is empty, show default non-arena athletes
                    if (!cleanSearchLower) {
                      if (nonArenaAthletes.length === 0) {
                        return <p className="p-4 text-center text-slate-500 text-xs">Todos os atletas cadastrados já estão vinculados.</p>;
                      }
                      return nonArenaAthletes.map(ath => (
                        <div key={ath.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-800/20 transition">
                          <div>
                            <p className="text-xs font-semibold text-white leading-none">{ath.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">CPF: {formatCPF(ath.cpf)}</p>
                          </div>
                          <button 
                            onClick={() => handleAssociateAthlete(ath.id)}
                            className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
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
                          <p className="text-slate-400 text-xs">Nenhum atleta encontrado no cadastro global.</p>
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
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                          >
                            Cadastrar Novo Atleta Global
                          </button>
                        </div>
                      );
                    }

                    return matchesSearch.map(ath => {
                      const isLinked = arenaAthletes.some(aa => aa.id === ath.id);
                      return (
                        <div key={ath.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-800/20 transition">
                          <div>
                            <p className="text-xs font-semibold text-white leading-none">{ath.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">CPF: {formatCPF(ath.cpf)}</p>
                          </div>
                          {isLinked ? (
                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1 px-2.5 rounded-lg">
                              Já Vinculado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleAssociateAthlete(ath.id)}
                              className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingAthlete ? 'Editar Atleta' : 'Novo Atleta'}
              </h3>
              <button onClick={() => setIsAthleteModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveAthlete} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">CPF</label>
                  <input type="text" required placeholder="000.000.000-00" disabled={!!editingAthlete} value={athleteForm.cpf} onChange={(e) => setAthleteForm({ ...athleteForm, cpf: formatCPF(e.target.value) })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Nome Completo</label>
                  <input type="text" required minLength={3} placeholder="Nome do atleta" value={athleteForm.name} onChange={(e) => setAthleteForm({ ...athleteForm, name: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Nascimento</label>
                  <input type="date" required value={athleteForm.birthDate} onChange={(e) => setAthleteForm({ ...athleteForm, birthDate: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Gênero</label>
                  <select value={athleteForm.gender} onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value as any })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="MISTO">Misto</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Telefone</label>
                  <input type="text" required placeholder="(00) 00000-0000" value={athleteForm.phone} onChange={(e) => setAthleteForm({ ...athleteForm, phone: formatPhone(e.target.value) })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">E-mail</label>
                  <input type="email" required placeholder="email@atleta.com" value={athleteForm.email} onChange={(e) => setAthleteForm({ ...athleteForm, email: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsAthleteModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Voltar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer">Salvar Atleta</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Organizador Modal */}
      {isArenaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                {editingArena ? 'Configurar Organizador' : 'Novo Organizador'}
              </h3>
              <button onClick={() => setIsArenaModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveArena} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-semibold">Nome do Organizador (Clube / Federação / Empresa)</label>
                  <input type="text" required placeholder="Ex: Beach Tennis Tour Brasil, Clube dos Atletas..." value={arenaForm.name} onChange={(e) => setArenaForm({ ...arenaForm, name: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Responsável</label>
                  <input type="text" required placeholder="Nome do responsável" value={arenaForm.owner} onChange={(e) => setArenaForm({ ...arenaForm, owner: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Telefone</label>
                  <input type="text" required placeholder="(00) 00000-0000" value={arenaForm.phone} onChange={(e) => setArenaForm({ ...arenaForm, phone: formatPhone(e.target.value) })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">E-mail</label>
                  <input type="email" required placeholder="contato@organizador.com" value={arenaForm.email} onChange={(e) => setArenaForm({ ...arenaForm, email: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Status</label>
                  <select value={arenaForm.status} onChange={(e) => setArenaForm({ ...arenaForm, status: e.target.value as any })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500">
                    <option value="ATIVA">ATIVA</option>
                    <option value="INATIVA">INATIVA</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Cidade</label>
                  <input type="text" required placeholder="Cidade" value={arenaForm.city} onChange={(e) => setArenaForm({ ...arenaForm, city: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Estado (UF)</label>
                  <input type="text" required maxLength={2} placeholder="Ex: RJ" value={arenaForm.state} onChange={(e) => setArenaForm({ ...arenaForm, state: e.target.value.toUpperCase() })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-sky-500" />
                </div>

                <div className="sm:col-span-2 border-t border-slate-800/80 pt-4 space-y-2">
                  <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Acesso Administrador do Organizador</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400">Usuário (Username)</label>
                      <input type="text" required placeholder="user" value={arenaForm.adminUsername} onChange={(e) => setArenaForm({ ...arenaForm, adminUsername: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400">Senha</label>
                      <input type="text" required placeholder="password" value={arenaForm.adminPassword} onChange={(e) => setArenaForm({ ...arenaForm, adminPassword: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsArenaModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-sky-500/10 cursor-pointer">
                  {editingArena ? 'Salvar Organizador' : 'Cadastrar Organizador'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Venue (Arena Física - Local onde os eventos acontecem) Modal */}
      {isVenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                {editingVenue ? 'Editar Arena (Local do Evento)' : 'Nova Arena (Local do Evento)'}
              </h3>
              <button onClick={() => setIsVenueModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveVenue} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-semibold">Nome da Arena (Local Físico)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Arena Sunset Santos, Posto 9 Beach Club..." 
                    value={venueForm.name} 
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} 
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 bg-[#090e1a] p-4 rounded-xl border border-amber-500/20">
                  <div className="flex justify-between items-center">
                    <label className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      Quantidade Total de Quadras Físicas da Arena:
                    </label>
                    <span className="font-mono text-xs text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/30 font-bold">
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
                    className="bg-[#0d1424] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono text-sm font-bold focus:outline-none focus:border-amber-500 mt-1" 
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Cada arena possui sua quantidade de quadras. Ao criar um torneio, o organizador poderá definir quantas quadras desta arena vai utilizar no dia do evento (dependendo do número de pessoas inscritas).
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-semibold">Endereço Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Av. Presidente Wilson, 120 - Praia do Gonzaga" 
                    value={venueForm.address} 
                    onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} 
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Cidade</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Santos" 
                    value={venueForm.city} 
                    onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })} 
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Estado (UF)</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={2} 
                    placeholder="Ex: SP" 
                    value={venueForm.state} 
                    onChange={(e) => setVenueForm({ ...venueForm, state: e.target.value.toUpperCase() })} 
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono uppercase focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Telefone de Contato</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000" 
                    value={venueForm.contactPhone} 
                    onChange={(e) => setVenueForm({ ...venueForm, contactPhone: formatPhone(e.target.value) })} 
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Status da Arena</label>
                  <select 
                    value={venueForm.status} 
                    onChange={(e) => setVenueForm({ ...venueForm, status: e.target.value as any })} 
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ATIVA">ATIVA</option>
                    <option value="INATIVA">INATIVA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsVenueModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-amber-500/10 cursor-pointer">
                  {editingVenue ? 'Salvar Arena' : 'Cadastrar Arena'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Torneio Modal (With active categories toggles inside! - Requested Feature!) */}
      {isTourModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                {editingTournament ? 'Editar Torneio' : 'Nova Edição de Torneio'}
              </h3>
              <button onClick={() => setIsTourModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveTournament} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Nome da Série (Série Pai)</label>
                  <input type="text" required placeholder="Ex: Orion Open" value={tourForm.seriesName} onChange={(e) => setTourForm({ ...tourForm, seriesName: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Nome da Edição</label>
                  <input type="text" required placeholder="Ex: Orion Open - Etapa Verão" value={tourForm.name} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>

                {session?.role === 'SUPER_ADMIN' && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-400" /> Organizador Responsável
                    </label>
                    <select 
                      value={tourForm.arenaId} 
                      onChange={(e) => setTourForm({ ...tourForm, arenaId: e.target.value })} 
                      className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {arenas.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.city} - {a.state})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Arena (Local do Evento) and Quadras Utilizadas no Dia */}
                <div className="flex flex-col gap-3 sm:col-span-2 bg-[#090e1a] border border-slate-800/80 p-4 rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-emerald-400" />
                        Arena (Local onde os eventos acontecem)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Estrutura física do campeonato
                      </span>
                    </div>

                    <select 
                      value={tourForm.venueId} 
                      onChange={(e) => {
                        const selectedV = venues.find(v => v.id === e.target.value);
                        const maxCourts = selectedV ? selectedV.courtsCount : 4;
                        setTourForm({ 
                          ...tourForm, 
                          venueId: e.target.value,
                          courtsUsed: Math.min(tourForm.courtsUsed, maxCourts) || Math.min(4, maxCourts)
                        });
                      }}
                      className="bg-[#0d1424] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
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
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-amber-400" />
                              Número de Quadras Utilizadas no Dia do Evento:
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                              O organizador define quantas quadras da arena ({maxCourts} no total) vai utilizar no dia, dependendo do número de inscritos.
                            </p>
                          </div>
                          <span className="text-sm font-black text-amber-300 font-mono bg-amber-950/60 border border-amber-500/20 px-3 py-1 rounded-lg shrink-0">
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
                            className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                          />
                          <div className="flex gap-1.5 shrink-0">
                            {[1, 2, 4, 6, maxCourts].filter((n, idx, arr) => n <= maxCourts && arr.indexOf(n) === idx).map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setTourForm({ ...tourForm, courtsUsed: num })}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border cursor-pointer ${
                                  tourForm.courtsUsed === num 
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                                    : 'bg-[#0d1424] text-slate-400 border-slate-800 hover:text-white'
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
                    <label className="text-slate-300 font-semibold">Data Início</label>
                    <input type="date" required value={tourForm.startDate} onChange={(e) => setTourForm({ ...tourForm, startDate: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold">Data Término</label>
                    <input type="date" required value={tourForm.endDate} onChange={(e) => setTourForm({ ...tourForm, endDate: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-semibold">Status do Torneio</label>
                  <select value={tourForm.status} onChange={(e) => setTourForm({ ...tourForm, status: e.target.value as any })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500">
                    <option value="INSCRICOES_ABERTAS">Inscrições Abertas</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="FINALIZADO">Finalizado</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 bg-[#090e1a] p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-300 font-semibold">Formato do Torneio</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="isDuo" 
                        checked={tourForm.isDuo === true}
                        onChange={() => setTourForm({ ...tourForm, isDuo: true })}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-slate-200 font-medium">Torneio de Dupla (Padrão)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="isDuo" 
                        checked={tourForm.isDuo === false}
                        onChange={() => setTourForm({ ...tourForm, isDuo: false })}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-slate-200 font-medium">Torneio Individual</span>
                    </label>
                  </div>
                </div>

                {/* DYNAMIC CATEGORIES DEFINITIONS SECTOR (Loaded from pre-registered master categories) */}
                <div className="sm:col-span-2 border-t border-slate-800/80 pt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Categorias do Torneio (Selecionadas do Pré-Cadastro)
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
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
                        className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer"
                      >
                        Marcar Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = tourCategories.map(c => ({ ...c, enabled: false }));
                          setTourCategories(updated);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-medium transition cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-800/80 rounded-xl divide-y divide-slate-800/60 max-h-60 overflow-y-auto bg-[#090e1a] p-1">
                    {tourCategories.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
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
                              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-white font-bold">{std.name || `${std.type} ${std.level}`}</span>
                              <span className="block text-[9px] text-slate-400">Modalidade {std.type} • Nível {std.level}</span>
                            </div>
                          </label>

                          {/* Price & MaxParticipants Inputs (only enabled if category is checked) */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-mono text-[11px]">R$</span>
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
                                className="w-20 bg-[#0d1424] border border-slate-800 text-slate-200 text-xs py-1.5 px-2 rounded-lg font-mono text-right focus:outline-none focus:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-semibold text-[10px] uppercase">Vagas:</span>
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
                                className="w-16 bg-[#0d1424] border border-slate-800 text-slate-200 text-xs py-1.5 px-2 rounded-lg font-mono text-center focus:outline-none focus:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                              <span className="text-slate-400 text-[10px] select-none lowercase">{tourForm.isDuo ? 'duplas' : 'indiv.'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80 shrink-0">
                <button type="button" onClick={() => setIsTourModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer">
                  {editingTournament ? 'Salvar Torneio' : 'Criar Torneio'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Modal (EXCLUSIVO SUPER ADMIN - PRÉ-CADASTRO GERAL) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    {editingCategory ? 'Editar Categoria' : 'Pré-Cadastrar Nova Categoria'}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-semibold">SUPER ADMIN</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Defina as características oficiais desta categoria. Ela ficará disponível para seleção em novos torneios.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div className="space-y-4">
                {/* Nome da Categoria */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Nome da Categoria *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Exibido nos torneios e tabelas</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder={`Ex: ${categoryForm.type} ${categoryForm.level}`}
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="bg-[#090e1a] border border-slate-700 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-sm"
                  />
                </div>

                {/* Tipo de Competição */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-bold">Tipo de Competição *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['MASCULINO', 'FEMININO', 'MISTA', 'SUPER 8'] as const).map(tipo => {
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
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20' 
                              : 'bg-[#090e1a] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
                  <label className="text-slate-300 font-bold">Nível Técnico *</label>
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
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm' 
                              : 'bg-[#090e1a] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
                    <label className="text-slate-300 font-bold">Taxa Base de Inscrição (R$) *</label>
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
                        className="w-full bg-[#090e1a] border border-slate-700 py-2.5 pl-10 pr-3 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-sm font-bold" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Valor padrão sugerido ao criar torneio</span>
                  </div>

                  {/* Limite de Vagas */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-bold">Vagas Padrão *</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      max={128}
                      placeholder="16" 
                      value={categoryForm.maxParticipants} 
                      onChange={(e) => setCategoryForm({ ...categoryForm, maxParticipants: Number(e.target.value) })} 
                      className="bg-[#090e1a] border border-slate-700 py-2.5 px-3 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-sm font-bold" 
                    />
                    <span className="text-[10px] text-slate-500">Capacidade sugerida de duplas/atletas</span>
                  </div>
                </div>

                {/* Status Toggle & Descrição */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-bold">Status no Sistema</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, status: 'ATIVA' })}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          categoryForm.status === 'ATIVA'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-[#090e1a] text-slate-400 border-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ativa
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, status: 'INATIVA' })}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          categoryForm.status === 'INATIVA'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : 'bg-[#090e1a] text-slate-400 border-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> Inativa
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-bold">Escopo do Cadastro</label>
                    <div className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pré-Cadastro Geral do Sistema</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-bold">Descrição / Observações (Opcional)</label>
                  <textarea 
                    rows={2}
                    placeholder="Informações sobre regras de pontuação, restrições ou nível técnico..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full bg-[#090e1a] border border-slate-700 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="py-2.5 px-4 text-slate-400 hover:text-white transition cursor-pointer font-semibold">Cancelar</button>
                <button type="submit" className="py-2.5 px-6 bg-emerald-500 text-slate-950 font-black rounded-xl hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Inscrever Atleta em Categoria
              </h3>
              <button onClick={() => setIsRegModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateRegistration} className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Torneio</label>
                <select 
                  value={regForm.tournamentId} 
                  onChange={(e) => setRegForm({ ...regForm, tournamentId: e.target.value, categoryId: '' })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o Torneio</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Categoria</label>
                <select 
                  value={regForm.categoryId} 
                  onChange={(e) => setRegForm({ ...regForm, categoryId: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione a Categoria</option>
                  {categories.filter(c => c.tournamentId === regForm.tournamentId).map(c => (
                    <option key={c.id} value={c.id}>{c.type} {c.level} (R$ {c.price})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Atleta</label>
                <select 
                  value={regForm.athleteId} 
                  onChange={(e) => setRegForm({ ...regForm, athleteId: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o Atleta</option>
                  {athletes.filter(a => a.status === 'ATIVO').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCPF(a.cpf)})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Status da Inscrição</label>
                <select 
                  value={regForm.status} 
                  onChange={(e) => setRegForm({ ...regForm, status: e.target.value as any })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="PENDENTE_PAGAMENTO">Pendente de Pagamento</option>
                  <option value="CONFIRMADA">Confirmada</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsRegModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer">Confirmar Inscrição</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Duo (Dupla) Modal */}
      {isDuoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Formar Nova Dupla
              </h3>
              <button onClick={() => setIsDuoModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateDuo} className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Torneio</label>
                <select 
                  value={duoForm.tournamentId} 
                  onChange={(e) => setDuoForm({ ...duoForm, tournamentId: e.target.value, categoryId: '', player1Id: '', player2Id: '' })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o Torneio</option>
                  {tournaments.filter(t => t.isDuo !== false).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Categoria</label>
                <select 
                  value={duoForm.categoryId} 
                  onChange={(e) => setDuoForm({ ...duoForm, categoryId: e.target.value, player1Id: '', player2Id: '' })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione a Categoria</option>
                  {categories.filter(c => c.tournamentId === duoForm.tournamentId).map(c => (
                    <option key={c.id} value={c.id}>{c.type} {c.level}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Jogador 1 (Inscrito nesta categoria)</label>
                <select 
                  value={duoForm.player1Id} 
                  onChange={(e) => setDuoForm({ ...duoForm, player1Id: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione Jogador 1</option>
                  {registrations
                    .filter(r => r.categoryId === duoForm.categoryId && r.status === 'CONFIRMADA')
                    .map(r => <option key={r.athleteId} value={r.athleteId}>{r.athleteName}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Jogador 2 (Inscrito nesta categoria)</label>
                <select 
                  value={duoForm.player2Id} 
                  onChange={(e) => setDuoForm({ ...duoForm, player2Id: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione Jogador 2</option>
                  {registrations
                    .filter(r => r.categoryId === duoForm.categoryId && r.status === 'CONFIRMADA' && r.athleteId !== duoForm.player1Id)
                    .map(r => <option key={r.athleteId} value={r.athleteId}>{r.athleteName}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsDuoModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer">Formar Dupla</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Match (Jogo) Modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Agendar Partida Manual
              </h3>
              <button onClick={() => setIsMatchModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateMatch} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-300 font-semibold">Torneio</label>
                  <select 
                    value={matchForm.tournamentId} 
                    onChange={(e) => setMatchForm({ ...matchForm, tournamentId: e.target.value, categoryId: '', duo1Id: '', duo2Id: '' })}
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione o Torneio</option>
                    {tournaments.filter(t => t.isDuo !== false).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-300 font-semibold">Categoria</label>
                  <select 
                    value={matchForm.categoryId} 
                    onChange={(e) => setMatchForm({ ...matchForm, categoryId: e.target.value, duo1Id: '', duo2Id: '' })}
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione a Categoria</option>
                    {categories.filter(c => c.tournamentId === matchForm.tournamentId).map(c => (
                      <option key={c.id} value={c.id}>{c.type} {c.level}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Fase</label>
                  <input type="text" required value={matchForm.stage} onChange={(e) => setMatchForm({ ...matchForm, stage: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Grupo (Opcional)</label>
                  <input type="text" value={matchForm.groupName} onChange={(e) => setMatchForm({ ...matchForm, groupName: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-300 font-semibold">Dupla 1</label>
                  <select 
                    value={matchForm.duo1Id} 
                    onChange={(e) => setMatchForm({ ...matchForm, duo1Id: e.target.value })}
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione Dupla 1</option>
                    {duos.filter(d => d.categoryId === matchForm.categoryId).map(d => (
                      <option key={d.id} value={d.id}>{d.player1Name} + {d.player2Name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-300 font-semibold">Dupla 2</label>
                  <select 
                    value={matchForm.duo2Id} 
                    onChange={(e) => setMatchForm({ ...matchForm, duo2Id: e.target.value })}
                    className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione Dupla 2</option>
                    {duos.filter(d => d.categoryId === matchForm.categoryId && d.id !== matchForm.duo1Id).map(d => (
                      <option key={d.id} value={d.id}>{d.player1Name} + {d.player2Name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Data</label>
                  <input type="date" required value={matchForm.date} onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Horário</label>
                  <input type="text" required placeholder="14:00" value={matchForm.time} onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-300 font-semibold flex items-center justify-between">
                    <span>Quadra (Local)</span>
                    <span className="text-[10px] text-slate-400">Selecione ou personalize</span>
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
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                                  : 'bg-[#090e1a] text-slate-400 border-slate-800 hover:text-white'
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
                          className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 w-full font-mono text-xs focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsMatchModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer">Agendar Partida</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dynamic Match Generator Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Gerador de Jogos Automático</h3>
              <button onClick={() => setIsGenModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleGenerateMatches} className="p-6 space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Esta ferramenta apagará as partidas pendentes e gerará novos jogos no formato <strong>Todos contra Todos (Round Robin)</strong> para a categoria selecionada, distribuindo as partidas de forma equilibrada pelas quadras.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Torneio</label>
                <select 
                  value={genForm.tournamentId} 
                  onChange={(e) => setGenForm({ ...genForm, tournamentId: e.target.value, categoryId: '' })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione o Torneio</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {(() => {
                const tour = tournaments.find(t => t.id === genForm.tournamentId);
                const venueObj = venues.find(v => v.id === tour?.venueId);
                const courtsToUse = tour?.courtsUsed || 4;

                return tour ? (
                  <div className="bg-[#090e1a] border border-slate-800/80 p-3.5 rounded-xl space-y-1.5">
                    <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-400" />
                      Local: <strong className="text-white">{venueObj?.name || tour.venueName || 'Arena Local'}</strong>
                    </p>
                    <p className="text-[11px] text-amber-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Quadras definidas para o evento: <strong className="font-mono">{courtsToUse} quadras</strong> (Quadra 1 a Quadra {courtsToUse})
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      O sorteio distribuirá os confrontos automaticamente entre essas {courtsToUse} quadras. O organizador poderá trocar a quadra de qualquer confronto a qualquer momento.
                    </p>
                  </div>
                ) : null;
              })()}

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Categoria</label>
                <select 
                  value={genForm.categoryId} 
                  onChange={(e) => setGenForm({ ...genForm, categoryId: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione a Categoria</option>
                  {categories.filter(c => c.tournamentId === genForm.tournamentId).map(c => (
                    <option key={c.id} value={c.id}>{c.type} {c.level}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Data dos Jogos</label>
                  <input type="date" required value={genForm.date} onChange={(e) => setGenForm({ ...genForm, date: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Prefixo Quadra</label>
                  <input type="text" required value={genForm.court} onChange={(e) => setGenForm({ ...genForm, court: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsGenModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition shadow-md shadow-amber-500/10 cursor-pointer">
                  Gerar Jogos Chaveados
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lançar Placar Modal */}
      {isResultModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                Lançar Resultado de Partida
              </h3>
              <button onClick={() => setIsResultModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveResultSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-[#090e1a] p-4 rounded-xl space-y-1 text-center border border-slate-800/80">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{selectedMatch.categoryName}</p>
                <p className="text-base font-bold text-white mt-1">{selectedMatch.duo1Name} <span className="text-amber-400 font-extrabold mx-1">vs</span> {selectedMatch.duo2Name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedMatch.court} @ {selectedMatch.time}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Placar (Sets / Games)</label>
                <input type="text" required placeholder="Ex: 6/4 6/3 ou 6/1 3/6 10/7" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono text-center text-sm font-bold focus:border-emerald-500 focus:outline-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Dupla Vencedora</label>
                <select 
                  value={resultForm.winnerDuoId} 
                  onChange={(e) => setResultForm({ ...resultForm, winnerDuoId: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value={selectedMatch.duo1Id}>{selectedMatch.duo1Name}</option>
                  <option value={selectedMatch.duo2Id}>{selectedMatch.duo2Name}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsResultModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition shadow-md shadow-emerald-500/10 cursor-pointer">Salvar Placar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lançar WO Modal */}
      {isWoModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Lançar W.O. (Ausência)
              </h3>
              <button onClick={() => setIsWoModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveWoSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-[#090e1a] p-4 rounded-xl space-y-1 text-center border border-rose-900/30">
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">{selectedMatch.categoryName}</p>
                <p className="text-sm font-bold text-white mt-1">{selectedMatch.duo1Name} <span className="text-slate-500">vs</span> {selectedMatch.duo2Name}</p>
                <p className="text-[10px] text-slate-400 mt-1">A dupla ausente será derrotada por W.O. (6/0 6/0 oficial).</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Dupla Vencedora (Quem compareceu à quadra)</label>
                <select 
                  value={woForm.winnerDuoId} 
                  onChange={(e) => setWoForm({ ...woForm, winnerDuoId: e.target.value })}
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value={selectedMatch.duo1Id}>{selectedMatch.duo1Name}</option>
                  <option value={selectedMatch.duo2Id}>{selectedMatch.duo2Name}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsWoModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer">Confirmar W.O.</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quick Change Match Court Modal */}
      {isChangeCourtModalOpen && targetMatchForCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Alterar Quadra da Partida
              </h3>
              <button onClick={() => setIsChangeCourtModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveChangedCourt} className="p-6 space-y-4 text-xs">
              <div className="bg-[#090e1a] p-4 rounded-xl space-y-1.5 border border-slate-800/80">
                <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {targetMatchForCourt.categoryName}
                </span>
                <p className="text-sm font-bold text-white mt-1">
                  {targetMatchForCourt.duo1Name} <span className="text-amber-400 font-extrabold mx-1">vs</span> {targetMatchForCourt.duo2Name}
                </p>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 mt-2">
                  <span>Horário: <strong className="text-slate-200 font-mono">{targetMatchForCourt.time}</strong></span>
                  <span>Quadra Atual: <strong className="text-amber-400 font-mono">{targetMatchForCourt.court}</strong></span>
                </div>
              </div>

              {(() => {
                const tour = tournaments.find(t => t.id === targetMatchForCourt.tournamentId);
                const courtsCount = tour?.courtsUsed && tour.courtsUsed >= 1 ? tour.courtsUsed : 4;
                const quickCourts = Array.from({ length: courtsCount }, (_, i) => `Quadra ${i + 1}`);

                return (
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold block">
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
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-[#090e1a] text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-[#0d1424]'
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
                <label className="text-slate-300 font-semibold">Ou digite o nome de outra quadra:</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Quadra Central, Quadra 5..." 
                  value={selectedCourtName} 
                  onChange={(e) => setSelectedCourtName(e.target.value)} 
                  className="bg-[#090e1a] border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button type="button" onClick={() => setIsChangeCourtModalOpen(false)} className="py-2 px-4 text-slate-400 hover:text-white transition cursor-pointer">Cancelar</button>
                <button type="submit" className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer">
                  Salvar Nova Quadra
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1424] border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {confirmDialog.title}
              </h3>
              <button 
                onClick={() => setConfirmDialog(null)} 
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
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
              className="pointer-events-auto bg-[#0d1424] border border-rose-500/40 text-rose-300 text-xs p-4 rounded-2xl flex items-start gap-3 shadow-2xl"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-xs">Erro / Alerta</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed font-semibold">{errorMsg}</p>
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div key="success-toast" 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-[#0d1424] border border-emerald-500/40 text-emerald-300 text-xs p-4 rounded-2xl flex items-start gap-3 shadow-2xl"
            >
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-xs">Sucesso!</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed font-semibold">{successMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
