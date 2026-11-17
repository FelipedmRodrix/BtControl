import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export interface Athlete {
  id: string;
  cpf: string; // stored clean, numbers only
  name: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'M' | 'F' | 'MISTO';
  phone: string;
  email: string;
  photo?: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
  updatedAt: string;
}

// Representa o Organizador de Torneios/Eventos
export interface Organizer {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'ATIVA' | 'INATIVA';
  createdAt: string;
  updatedAt: string;
}

// Mantido como alias para compatibilidade com o modelo anterior
export type Arena = Organizer;

// Representa a Arena Física (Local do Evento) onde os jogos acontecem
export interface ArenaVenue {
  id: string;
  name: string; // Ex: "Arena Posto 9 Beach Club", "Complexo Sunset Santos"
  city: string;
  state: string;
  address?: string;
  courtsCount: number; // Quantidade total de quadras físicas que a arena possui (ex: 8)
  contactPhone?: string;
  status: 'ATIVA' | 'INATIVA';
  createdAt: string;
  updatedAt: string;
}

export interface ArenaAthlete {
  id: string;
  arenaId: string;
  athleteId: string;
  status: 'ATIVO' | 'BLOQUEADO';
  createdAt: string;
  updatedAt: string;
}

export type SystemScreen = 
  | 'dashboard'
  | 'athletes'
  | 'arenas'
  | 'venues'
  | 'categories'
  | 'tournaments'
  | 'super8'
  | 'registrations'
  | 'duos'
  | 'matches'
  | 'results'
  | 'reports'
  | 'bracket-tree'
  | 'settings'
  | 'profiles'
  | 'users';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ScreenPermission {
  screen: SystemScreen;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface Profile {
  id: string;
  name: string; // Ex: "Administrador Geral", "Organizador", "Mesário", "Financeiro", "Visualizador"
  description: string;
  isSystem?: boolean; // Não pode ser excluído
  permissions: ScreenPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // stored plain-text for developer preview/simplicity, can be omitted in API responses
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
  arenaId: string | null; // null for SUPER_ADMIN or global profiles
  name: string;
  email?: string;
  phone?: string;
  status: 'ATIVO' | 'INATIVO';
  profileId?: string; // Vínculo ao Perfil de Acesso
  athleteId?: string; // Vínculo se originado de atleta
  source?: 'SISTEMA' | 'ORGANIZADOR' | 'ATLETA' | 'IMPORTACAO';
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string; // e.g. "Orion Open - Janeiro 2027"
  arenaId: string; // ID do Organizador responsável
  organizerId?: string; // Alias para arenaId
  venueId?: string; // ID da Arena Física (Local) onde o torneio acontecerá
  venueName?: string; // Nome da Arena Física
  courtsUsed?: number; // Número de quadras que o organizador vai utilizar no dia do evento
  seriesName: string; // "Orion Open"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO';
  isDuo?: boolean; // Torneios tradicionais são sempre de duplas
  games?: number; // Default games per match: 4 or 6
  thaiBreak?: boolean; // Enable Thai Break for 6-game matches
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tournamentId?: string; // If 'GLOBAL' or not set, it's a pre-registered system master category
  masterCategoryId?: string; // Optional reference to template master category
  name?: string; // Ex: "Masculino C", "Feminino Open", "Mista B"
  type: 'MISTA' | 'MASCULINO' | 'FEMININO';
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  maxParticipants: number; // Max duos that can register
  status?: 'ATIVA' | 'INATIVA';
  description?: string;
  games?: number; // Games per match: 4 (default) or 6
  thaiBreak?: boolean; // Enable Thai Break rule for 6-game matches
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  categoryId: string;
  athleteId: string;
  status: 'PENDENTE_PAGAMENTO' | 'CONFIRMADA' | 'CANCELADA';
  createdAt: string;
  updatedAt: string;
}

export interface Duo {
  id: string;
  tournamentId: string;
  categoryId: string;
  player1Id: string;
  player2Id: string;
  status: 'CONFIRMADA' | 'MUDANÇA_PENDENTE';
  createdAt: string;
  updatedAt: string;
}

export interface MatchTeam {
  player1Id: string;
  player2Id: string;
  player1Name?: string;
  player2Name?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  categoryId: string;
  stage: string;
  groupName?: string;
  round?: number; // 1 to 7 for Super 8
  matchNumber?: number; // 1 to 14
  format?: 'STANDARD' | 'SUPER_8';
  teamA?: MatchTeam;
  teamB?: MatchTeam;
  scoreA?: number; // Games won by Team A (0 to 4 in Super 8)
  scoreB?: number; // Games won by Team B (0 to 4 in Super 8)
  winnerTeam?: 'TEAM_A' | 'TEAM_B';
  duo1Id?: string; // Optional for Super 8, used for traditional duo tournaments
  duo2Id?: string;
  date: string;
  time: string;
  court: string;
  status: 'PENDENTE' | 'FINALIZADA' | 'WO';
  score?: string; // e.g. "4 x 2" or "6/4 6/2"
   winnerDuoId?: string;
   games?: number; // Games per match from category
   thaiBreak?: boolean; // Thai Break rule from category
   isDraw?: boolean; // Draw/emate result (traditional matches only)
  tieBreaker?: string; // Super 8 tie resolution reason (e.g., "3 derrotas vs 4 derrotas")
  createdAt: string;
  updatedAt: string;
}

export interface Super8Event {
  id: string;
  name: string;
  seriesName: string;
  arenaId: string;
  organizerId?: string;
  venueId?: string;
  venueName?: string;
  courtsUsed: number;
  startDate: string;
  endDate: string;
  status: 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'FINALIZADO';
  categoryName: string;
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  games: number; // 4 (default) or 6
  thaiBreak: boolean;
  athleteIds: string[]; // Ordered list of 1..8 participants
  legacyTournamentId?: string;
  legacyCategoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Super8Match {
  id: string;
  super8Id: string;
  stage: string;
  groupName?: string;
  round: number; // 1 to 7
  matchNumber: number; // 1 to 14
  teamA: MatchTeam;
  teamB: MatchTeam;
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
  createdAt: string;
  updatedAt: string;
}

interface DBData {
  athletes: Athlete[];
  arenas: Arena[];
  venues: ArenaVenue[];
  arenaAthletes: ArenaAthlete[];
  users: User[];
  profiles: Profile[];
  tournaments: Tournament[];
  categories: Category[];
  registrations: Registration[];
  duos: Duo[];
  matches: Match[];
  super8Events: Super8Event[];
  super8Matches: Super8Match[];
}

export const ALL_SYSTEM_SCREENS: { id: SystemScreen; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Painel Geral', description: 'Visão geral de métricas, status de jogos e atalhos' },
  { id: 'athletes', label: 'Atletas', description: 'Cadastro e gestão de atletas' },
  { id: 'arenas', label: 'Organizadores', description: 'Gestão de organizadores / parceiros' },
  { id: 'venues', label: 'Arenas Físicas', description: 'Locais de jogos e estrutura de quadras' },
  { id: 'categories', label: 'Categorias', description: 'Categorias oficiais do sistema' },
  { id: 'tournaments', label: 'Torneios', description: 'Criação e configuração de torneios de duplas' },
  { id: 'super8', label: 'Super 8', description: 'Competições individuais Super 8, rodadas dinâmicas e ranking individual' },
  { id: 'registrations', label: 'Inscrições', description: 'Inscrições de atletas em categorias' },
  { id: 'duos', label: 'Duplas', description: 'Formação de duplas por categoria' },
  { id: 'matches', label: 'Jogos / Quadras', description: 'Chaveamento, quadras e horários' },
  { id: 'results', label: 'Resultados / Placar / WO', description: 'Lançamento de placares e desfechos' },
  { id: 'reports', label: 'Relatórios', description: 'Relatórios financeiros e estatísticas' },
  { id: 'bracket-tree', label: 'Mata-Mata (Árvore)', description: 'Chaveamento visual de mata-mata' },
  { id: 'settings', label: 'Configurações', description: 'Configurações gerais do sistema' },
  { id: 'profiles', label: 'Perfis de Acesso', description: 'Gerenciamento de perfis e permissões' },
  { id: 'users', label: 'Usuários do Sistema', description: 'Central de usuários e vinculação a perfis' },
];

export const DEFAULT_SYSTEM_PROFILES: Profile[] = [
  {
    id: 'prof-super-admin',
    name: 'Super Administrador',
    description: 'Acesso irrestrito a todas as telas e operações do sistema.',
    isSystem: true,
    permissions: ALL_SYSTEM_SCREENS.map(s => ({
      screen: s.id,
      view: true,
      create: true,
      edit: true,
      delete: true
    })),
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'prof-organizador',
    name: 'Organizador',
    description: 'Gerencia torneios, Super 8, inscrições, duplas, jogos e quadras.',
    isSystem: true,
    permissions: ALL_SYSTEM_SCREENS.map(s => {
      if (['arenas', 'venues', 'categories', 'profiles', 'users'].includes(s.id)) {
        return { screen: s.id, view: false, create: false, edit: false, delete: false };
      }
      return { screen: s.id, view: true, create: true, edit: true, delete: false };
    }),
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'prof-mesario',
    name: 'Mesário / Árbitro',
    description: 'Visualiza jogos, quadras, Super 8 e lança placares e resultados.',
    isSystem: true,
    permissions: ALL_SYSTEM_SCREENS.map(s => {
      if (s.id === 'matches' || s.id === 'results' || s.id === 'bracket-tree' || s.id === 'super8') {
        return { screen: s.id, view: true, create: false, edit: true, delete: false };
      }
      if (s.id === 'dashboard') {
        return { screen: s.id, view: true, create: false, edit: false, delete: false };
      }
      return { screen: s.id, view: false, create: false, edit: false, delete: false };
    }),
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'prof-visualizador',
    name: 'Visualizador de Relatórios',
    description: 'Permissão apenas de visualização para relatórios, tabelas, Super 8 e resultados.',
    isSystem: false,
    permissions: ALL_SYSTEM_SCREENS.map(s => {
      if (['reports', 'dashboard', 'bracket-tree', 'results', 'super8'].includes(s.id)) {
        return { screen: s.id, view: true, create: false, edit: false, delete: false };
      }
      return { screen: s.id, view: false, create: false, edit: false, delete: false };
    }),
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];

function getDbPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'arenabt_db.json');
  }
  return path.join(process.cwd(), 'lib', 'db', 'db.json');
}

export const DEFAULT_MASTER_CATEGORIES: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  // MASCULINO
  { id: 'cat-std-masc-open', name: 'Masculino Open', type: 'MASCULINO', level: 'OPEN', price: 120, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Masculina Aberta / Profissional' },
  { id: 'cat-std-masc-a', name: 'Masculino A', type: 'MASCULINO', level: 'A', price: 110, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Masculina Avançada' },
  { id: 'cat-std-masc-b', name: 'Masculino B', type: 'MASCULINO', level: 'B', price: 100, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Masculina Intermediária' },
  { id: 'cat-std-masc-c', name: 'Masculino C', type: 'MASCULINO', level: 'C', price: 100, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Masculina Básica' },
  { id: 'cat-std-masc-d', name: 'Masculino D', type: 'MASCULINO', level: 'D', price: 90, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Masculina Amadora' },
  { id: 'cat-std-masc-ini', name: 'Masculino Iniciante', type: 'MASCULINO', level: 'INICIANTE', price: 80, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Para atletas em fase inicial de torneios' },
  { id: 'cat-std-masc-prin', name: 'Masculino Principiante', type: 'MASCULINO', level: 'PRINCIPIANTE', price: 80, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Primeiro torneio / Principiante' },

  // FEMININO
  { id: 'cat-std-fem-open', name: 'Feminino Open', type: 'FEMININO', level: 'OPEN', price: 120, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Feminina Aberta / Profissional' },
  { id: 'cat-std-fem-a', name: 'Feminino A', type: 'FEMININO', level: 'A', price: 110, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Feminina Avançada' },
  { id: 'cat-std-fem-b', name: 'Feminino B', type: 'FEMININO', level: 'B', price: 100, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Feminina Intermediária' },
  { id: 'cat-std-fem-c', name: 'Feminino C', type: 'FEMININO', level: 'C', price: 100, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Feminina Básica' },
  { id: 'cat-std-fem-d', name: 'Feminino D', type: 'FEMININO', level: 'D', price: 90, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Categoria Feminina Amadora' },
  { id: 'cat-std-fem-ini', name: 'Feminino Iniciante', type: 'FEMININO', level: 'INICIANTE', price: 80, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Para atletas em fase inicial de torneios' },
  { id: 'cat-std-fem-prin', name: 'Feminino Principiante', type: 'FEMININO', level: 'PRINCIPIANTE', price: 80, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Primeiro torneio / Principiante' },

  // MISTA
  { id: 'cat-std-mis-open', name: 'Mista Open', type: 'MISTA', level: 'OPEN', price: 120, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Abertas / Avançadas' },
  { id: 'cat-std-mis-a', name: 'Mista A', type: 'MISTA', level: 'A', price: 110, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Avançadas' },
  { id: 'cat-std-mis-b', name: 'Mista B', type: 'MISTA', level: 'B', price: 100, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Intermediárias' },
  { id: 'cat-std-mis-c', name: 'Mista C', type: 'MISTA', level: 'C', price: 100, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Básicas' },
  { id: 'cat-std-mis-d', name: 'Mista D', type: 'MISTA', level: 'D', price: 90, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Amadoras' },
  { id: 'cat-std-mis-ini', name: 'Mista Iniciante', type: 'MISTA', level: 'INICIANTE', price: 80, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Iniciantes' }
];

// Default seeding data
const defaultData: DBData = {
  "athletes": [
    {
      "id": "ath-joao",
      "cpf": "12345678901",
      "name": "Jo\u00e3o da Silva",
      "birthDate": "1990-05-15",
      "gender": "M",
      "phone": "11999998888",
      "email": "joao@example.com",
      "status": "ATIVO",
      "createdAt": "2026-10-02T18:35:13.574Z",
      "updatedAt": "2026-10-02T18:35:13.574Z"
    },
    {
      "id": "ath-maria",
      "cpf": "98765432109",
      "name": "Maria Oliveira",
      "birthDate": "1995-08-22",
      "gender": "F",
      "phone": "21988887777",
      "email": "maria@example.com",
      "status": "ATIVO",
      "createdAt": "2026-10-02T18:35:13.574Z",
      "updatedAt": "2026-10-02T18:35:13.574Z"
    },
    {
      "id": "ath-carlos",
      "cpf": "45678912312",
      "name": "Carlos Souza",
      "birthDate": "1988-12-01",
      "gender": "M",
      "phone": "13977776666",
      "email": "carlos@example.com",
      "status": "ATIVO",
      "createdAt": "2026-10-02T18:35:13.574Z",
      "updatedAt": "2026-10-02T18:35:13.574Z"
    },
    {
      "id": "ath-pedro",
      "cpf": "55566677788",
      "name": "Pedro Santos",
      "birthDate": "1992-04-10",
      "gender": "M",
      "phone": "11955554444",
      "email": "pedro@example.com",
      "status": "ATIVO",
      "createdAt": "2026-10-02T18:35:13.574Z",
      "updatedAt": "2026-10-02T18:35:13.574Z"
    },
    {
      "id": "ath-lucas",
      "cpf": "11122233344",
      "name": "Lucas Pereira",
      "birthDate": "1994-07-15",
      "gender": "M",
      "phone": "11944443333",
      "email": "lucas@example.com",
      "status": "ATIVO",
      "createdAt": "2026-10-02T18:35:13.574Z",
      "updatedAt": "2026-10-02T18:35:13.574Z"
    },
    {
      "id": "ath-bktqtc8rs",
      "cpf": "60876116306",
      "name": "Felipe de Melo Rodrigues",
      "birthDate": "1993-08-20",
      "gender": "M",
      "phone": "85996595730",
      "email": "informatica@marinapark.com.br",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:03:48.804Z",
      "updatedAt": "2026-10-09T12:03:48.804Z"
    },
    {
      "id": "ath-zm0bhpk79",
      "cpf": "69081894064",
      "name": "Jubileu da Silva",
      "birthDate": "1993-08-20",
      "gender": "M",
      "phone": "85996595730",
      "email": "informatica@marinapark.com.br",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:04:36.006Z",
      "updatedAt": "2026-10-09T12:04:36.006Z"
    },
    {
      "id": "ath-lxkaq0uqv",
      "cpf": "24233091045",
      "name": "Radael Mistof\u00f3bico",
      "birthDate": "1993-01-01",
      "gender": "M",
      "phone": "85996595730",
      "email": "informatica@marinapark.com.br",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:05:22.772Z",
      "updatedAt": "2026-10-09T12:05:22.772Z"
    }
  ],
  "arenas": [
    {
      "id": "arena-zne0sbge6",
      "name": "Super 8 Allan",
      "owner": "Allan",
      "email": "informatica@marinapark.com.br",
      "phone": "85996595730",
      "city": "Fortaleza",
      "state": "CE",
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:02:05.530Z",
      "updatedAt": "2026-10-09T12:02:05.530Z"
    },
    {
      "id": "arena-6a5h1o8wd",
      "name": "Orion",
      "owner": "Neto",
      "email": "informatica@marinapark.com.br",
      "phone": "8599999999",
      "city": "Fortaleza",
      "state": "CE",
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:15:22.519Z",
      "updatedAt": "2026-10-09T12:15:22.519Z"
    }
  ],
  "arenaAthletes": [
    {
      "id": "aa-sj9cuzx47",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-joao",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:03:17.941Z",
      "updatedAt": "2026-10-09T12:03:17.941Z"
    },
    {
      "id": "aa-ijbfa6owc",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-pedro",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:03:19.583Z",
      "updatedAt": "2026-10-09T12:03:19.583Z"
    },
    {
      "id": "aa-w39ni6zkc",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-carlos",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:03:20.725Z",
      "updatedAt": "2026-10-09T12:03:20.725Z"
    },
    {
      "id": "aa-aagdamx3i",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-maria",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:03:21.183Z",
      "updatedAt": "2026-10-09T12:03:21.183Z"
    },
    {
      "id": "aa-0oltmnpow",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-lucas",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:03:22.233Z",
      "updatedAt": "2026-10-09T12:03:22.233Z"
    },
    {
      "id": "aa-o253crrw1",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-bktqtc8rs",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:05:28.604Z",
      "updatedAt": "2026-10-09T12:05:28.604Z"
    },
    {
      "id": "aa-2r06ya8r6",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-zm0bhpk79",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:05:29.392Z",
      "updatedAt": "2026-10-09T12:05:29.392Z"
    },
    {
      "id": "aa-8danawhu3",
      "arenaId": "arena-zne0sbge6",
      "athleteId": "ath-lxkaq0uqv",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:05:30.197Z",
      "updatedAt": "2026-10-09T12:05:30.197Z"
    },
    {
      "id": "aa-79oujlela",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-joao",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:22.358Z",
      "updatedAt": "2026-10-09T12:44:22.358Z"
    },
    {
      "id": "aa-7ogfxxguc",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-carlos",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:23.018Z",
      "updatedAt": "2026-10-09T12:44:23.018Z"
    },
    {
      "id": "aa-ufbueyrih",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-maria",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:24.024Z",
      "updatedAt": "2026-10-09T12:44:24.024Z"
    },
    {
      "id": "aa-gu80baozj",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-pedro",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:24.631Z",
      "updatedAt": "2026-10-09T12:44:24.631Z"
    },
    {
      "id": "aa-0g8bnyyda",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-lucas",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:25.287Z",
      "updatedAt": "2026-10-09T12:44:25.287Z"
    },
    {
      "id": "aa-vrwdi5sjs",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-bktqtc8rs",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:27.183Z",
      "updatedAt": "2026-10-09T12:44:27.183Z"
    },
    {
      "id": "aa-hzrjlmfuq",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-zm0bhpk79",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:28.073Z",
      "updatedAt": "2026-10-09T12:44:28.073Z"
    },
    {
      "id": "aa-yasky9h92",
      "arenaId": "arena-6a5h1o8wd",
      "athleteId": "ath-lxkaq0uqv",
      "status": "ATIVO",
      "createdAt": "2026-10-09T12:44:28.883Z",
      "updatedAt": "2026-10-09T12:44:28.883Z"
    }
  ],
  "users": [
    {
      "id": "usr-admin",
      "username": "admin",
      "password": "admin123",
      "role": "SUPER_ADMIN",
      "arenaId": null,
      "name": "Administrador Geral",
      "status": "ATIVO",
      "profileId": "prof-super-admin",
      "source": "SISTEMA",
      "createdAt": "2026-10-02T18:35:13.574Z",
      "updatedAt": "2026-10-02T18:35:13.574Z"
    },
    {
      "id": "usr-pukeaw0c7",
      "username": "allan",
      "password": "123",
      "role": "ARENA_ADMIN",
      "arenaId": "arena-zne0sbge6",
      "name": "Super 8 Allan Admin",
      "status": "ATIVO",
      "profileId": "prof-organizador",
      "source": "ORGANIZADOR",
      "createdAt": "2026-10-09T12:02:05.531Z",
      "updatedAt": "2026-10-09T12:02:05.531Z"
    },
    {
      "id": "usr-l6u8hvloj",
      "username": "neto",
      "password": "1234",
      "role": "ARENA_ADMIN",
      "arenaId": "arena-6a5h1o8wd",
      "name": "Orion Admin",
      "status": "ATIVO",
      "profileId": "prof-organizador",
      "source": "ORGANIZADOR",
      "createdAt": "2026-10-09T12:15:22.521Z",
      "updatedAt": "2026-10-09T12:15:22.521Z"
    }
  ],
  "profiles": DEFAULT_SYSTEM_PROFILES,
  "tournaments": [
    {
      "id": "t-l2kcowd6j",
      "name": "Edi\u00e7\u00e3o 2027",
      "arenaId": "arena-6a5h1o8wd",
      "organizerId": "arena-6a5h1o8wd",
      "venueId": "ven-kpptfkeak",
      "venueName": "Toss",
      "courtsUsed": 6,
      "seriesName": "Orion",
      "startDate": "2027-01-01",
      "endDate": "2027-01-01",
      "status": "INSCRICOES_ABERTAS",
      "isDuo": true,
      "createdAt": "2026-10-09T12:17:49.912Z",
      "updatedAt": "2026-10-09T12:47:49.069Z"
    }
  ],
  "categories": [
    {
      "id": "cat-std-masc-open",
      "name": "Masculino Open",
      "type": "MASCULINO",
      "level": "OPEN",
      "price": 120,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Masculina Aberta / Profissional",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-masc-a",
      "name": "Masculino A",
      "type": "MASCULINO",
      "level": "A",
      "price": 110,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Masculina Avan\u00e7ada",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-masc-b",
      "name": "Masculino B",
      "type": "MASCULINO",
      "level": "B",
      "price": 100,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Masculina Intermedi\u00e1ria",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-masc-c",
      "name": "Masculino C",
      "type": "MASCULINO",
      "level": "C",
      "price": 100,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Masculina B\u00e1sica",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-masc-d",
      "name": "Masculino D",
      "type": "MASCULINO",
      "level": "D",
      "price": 90,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Masculina Amadora",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-masc-ini",
      "name": "Masculino Iniciante",
      "type": "MASCULINO",
      "level": "INICIANTE",
      "price": 80,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Para atletas em fase inicial de torneios",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-masc-prin",
      "name": "Masculino Principiante",
      "type": "MASCULINO",
      "level": "PRINCIPIANTE",
      "price": 80,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Primeiro torneio / Principiante",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-open",
      "name": "Feminino Open",
      "type": "FEMININO",
      "level": "OPEN",
      "price": 120,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Feminina Aberta / Profissional",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-a",
      "name": "Feminino A",
      "type": "FEMININO",
      "level": "A",
      "price": 110,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Feminina Avan\u00e7ada",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-b",
      "name": "Feminino B",
      "type": "FEMININO",
      "level": "B",
      "price": 100,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Feminina Intermedi\u00e1ria",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-c",
      "name": "Feminino C",
      "type": "FEMININO",
      "level": "C",
      "price": 100,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Feminina B\u00e1sica",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-d",
      "name": "Feminino D",
      "type": "FEMININO",
      "level": "D",
      "price": 90,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Categoria Feminina Amadora",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-ini",
      "name": "Feminino Iniciante",
      "type": "FEMININO",
      "level": "INICIANTE",
      "price": 80,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Para atletas em fase inicial de torneios",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-fem-prin",
      "name": "Feminino Principiante",
      "type": "FEMININO",
      "level": "PRINCIPIANTE",
      "price": 80,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Primeiro torneio / Principiante",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-mis-open",
      "name": "Mista Open",
      "type": "MISTA",
      "level": "OPEN",
      "price": 120,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Duplas Mistas Abertas / Avan\u00e7adas",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-mis-a",
      "name": "Mista A",
      "type": "MISTA",
      "level": "A",
      "price": 110,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Duplas Mistas Avan\u00e7adas",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-mis-b",
      "name": "Mista B",
      "type": "MISTA",
      "level": "B",
      "price": 100,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Duplas Mistas Intermedi\u00e1rias",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-mis-c",
      "name": "Mista C",
      "type": "MISTA",
      "level": "C",
      "price": 100,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Duplas Mistas B\u00e1sicas",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-mis-d",
      "name": "Mista D",
      "type": "MISTA",
      "level": "D",
      "price": 90,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Duplas Mistas Amadoras",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "cat-std-mis-ini",
      "name": "Mista Iniciante",
      "type": "MISTA",
      "level": "INICIANTE",
      "price": 80,
      "maxParticipants": 16,
      "status": "ATIVA",
      "tournamentId": "GLOBAL",
      "description": "Duplas Mistas Iniciantes",
      "createdAt": "2026-10-08T15:36:13.657Z",
      "updatedAt": "2026-10-08T15:36:13.657Z"
    },
    {
      "id": "c-asm6racfn",
      "tournamentId": "t-l2kcowd6j",
      "masterCategoryId": "cat-std-masc-d",
      "name": "Masculino D",
      "type": "MASCULINO",
      "level": "D",
      "price": 90,
      "maxParticipants": 16,
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:47:49.069Z",
      "updatedAt": "2026-10-09T12:47:49.069Z"
    },
    {
      "id": "c-yaqgbemhr",
      "tournamentId": "t-l2kcowd6j",
      "masterCategoryId": "cat-std-masc-ini",
      "name": "Masculino Iniciante",
      "type": "MASCULINO",
      "level": "INICIANTE",
      "price": 80,
      "maxParticipants": 16,
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:47:49.069Z",
      "updatedAt": "2026-10-09T12:47:49.069Z"
    }
  ],
  "registrations": [
    {
      "id": "reg-apeqmq7q0",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-joao",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.777Z",
      "updatedAt": "2026-10-09T12:44:55.777Z"
    },
    {
      "id": "reg-fzcn3euz8",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-maria",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.808Z",
      "updatedAt": "2026-10-09T12:44:55.808Z"
    },
    {
      "id": "reg-ulajm2ri6",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-carlos",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.822Z",
      "updatedAt": "2026-10-09T12:44:55.822Z"
    },
    {
      "id": "reg-blu16bhmg",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-pedro",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.840Z",
      "updatedAt": "2026-10-09T12:44:55.840Z"
    },
    {
      "id": "reg-r66rjt62q",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-lucas",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.856Z",
      "updatedAt": "2026-10-09T12:44:55.856Z"
    },
    {
      "id": "reg-wkptk6p4k",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-bktqtc8rs",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.857Z",
      "updatedAt": "2026-10-09T12:44:55.857Z"
    },
    {
      "id": "reg-i92426f0j",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-lxkaq0uqv",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.858Z",
      "updatedAt": "2026-10-09T12:44:55.858Z"
    },
    {
      "id": "reg-qo6519gck",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "athleteId": "ath-zm0bhpk79",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:44:55.871Z",
      "updatedAt": "2026-10-09T12:44:55.871Z"
    },
    {
      "id": "reg-riumeh10s",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-yaqgbemhr",
      "athleteId": "ath-joao",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:48:10.031Z",
      "updatedAt": "2026-10-09T12:48:20.567Z"
    },
    {
      "id": "reg-f8digwd9w",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-yaqgbemhr",
      "athleteId": "ath-maria",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:48:10.048Z",
      "updatedAt": "2026-10-09T12:48:20.568Z"
    },
    {
      "id": "reg-kucdpiy3i",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-yaqgbemhr",
      "athleteId": "ath-pedro",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:48:10.061Z",
      "updatedAt": "2026-10-09T12:48:20.569Z"
    },
    {
      "id": "reg-ks216ku3f",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-yaqgbemhr",
      "athleteId": "ath-carlos",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:48:10.080Z",
      "updatedAt": "2026-10-09T12:48:22.432Z"
    },
    {
      "id": "reg-2tez8l4nc",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-yaqgbemhr",
      "athleteId": "ath-lucas",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:48:10.091Z",
      "updatedAt": "2026-10-09T12:48:23.953Z"
    }
  ],
  "duos": [
    {
      "id": "duo-4wflvlmv4",
      "tournamentId": "t-l2kcowd6j",
      "categoryId": "c-j6pom4a9i",
      "player1Id": "ath-joao",
      "player2Id": "ath-carlos",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:45:13.349Z",
      "updatedAt": "2026-10-09T12:45:13.349Z"
    }
  ],
  "matches": [],
  "super8Events": [
    {
      "id": "t-qw68nd3xp",
      "name": "Super 8",
      "seriesName": "Super 8",
      "arenaId": "arena-zne0sbge6",
      "organizerId": "arena-zne0sbge6",
      "venueId": "ven-kpptfkeak",
      "venueName": "Toss",
      "courtsUsed": 2,
      "startDate": "2027-01-01",
      "endDate": "2027-02-02",
      "status": "INSCRICOES_ABERTAS",
      "categoryName": "SUPER 8 PRINCIPIANTE",
      "level": "PRINCIPIANTE",
      "price": 40,
      "games": 4,
      "thaiBreak": false,
      "athleteIds": [
        "ath-joao",
        "ath-lxkaq0uqv",
        "ath-maria",
        "ath-lucas",
        "ath-carlos",
        "ath-pedro",
        "ath-zm0bhpk79",
        "ath-bktqtc8rs"
      ],
      "legacyTournamentId": "t-qw68nd3xp",
      "legacyCategoryId": "c-3f8ay2wky",
      "createdAt": "2026-10-09T12:06:56.649Z",
      "updatedAt": "2026-10-09T12:06:56.649Z"
    }
  ],
  "super8Matches": [
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 1",
      "groupName": "Super 8",
      "round": 1,
      "matchNumber": 1,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-bktqtc8rs",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Felipe de Melo Rodrigues"
      },
      "teamB": {
        "player1Id": "ath-lxkaq0uqv",
        "player2Id": "ath-zm0bhpk79",
        "player1Name": "Radael Mistof\u00f3bico",
        "player2Name": "Jubileu da Silva"
      },
      "date": "2026-10-09",
      "time": "14:00",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-fd3waltul",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 1",
      "groupName": "Super 8",
      "round": 1,
      "matchNumber": 2,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-maria",
        "player2Id": "ath-pedro",
        "player1Name": "Maria Oliveira",
        "player2Name": "Pedro Santos"
      },
      "teamB": {
        "player1Id": "ath-lucas",
        "player2Id": "ath-carlos",
        "player1Name": "Lucas Pereira",
        "player2Name": "Carlos Souza"
      },
      "date": "2026-10-09",
      "time": "14:00",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-w7fppigg7",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 2",
      "groupName": "Super 8",
      "round": 2,
      "matchNumber": 3,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-zm0bhpk79",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Jubileu da Silva"
      },
      "teamB": {
        "player1Id": "ath-bktqtc8rs",
        "player2Id": "ath-pedro",
        "player1Name": "Felipe de Melo Rodrigues",
        "player2Name": "Pedro Santos"
      },
      "date": "2026-10-09",
      "time": "14:40",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-8ifv9vpw0",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 2",
      "groupName": "Super 8",
      "round": 2,
      "matchNumber": 4,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-lxkaq0uqv",
        "player2Id": "ath-carlos",
        "player1Name": "Radael Mistof\u00f3bico",
        "player2Name": "Carlos Souza"
      },
      "teamB": {
        "player1Id": "ath-maria",
        "player2Id": "ath-lucas",
        "player1Name": "Maria Oliveira",
        "player2Name": "Lucas Pereira"
      },
      "date": "2026-10-09",
      "time": "14:40",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-dekwwoanq",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 3",
      "groupName": "Super 8",
      "round": 3,
      "matchNumber": 5,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-pedro",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Pedro Santos"
      },
      "teamB": {
        "player1Id": "ath-zm0bhpk79",
        "player2Id": "ath-carlos",
        "player1Name": "Jubileu da Silva",
        "player2Name": "Carlos Souza"
      },
      "date": "2026-10-09",
      "time": "15:20",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-8sja5u0c7",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 3",
      "groupName": "Super 8",
      "round": 3,
      "matchNumber": 6,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-bktqtc8rs",
        "player2Id": "ath-lucas",
        "player1Name": "Felipe de Melo Rodrigues",
        "player2Name": "Lucas Pereira"
      },
      "teamB": {
        "player1Id": "ath-lxkaq0uqv",
        "player2Id": "ath-maria",
        "player1Name": "Radael Mistof\u00f3bico",
        "player2Name": "Maria Oliveira"
      },
      "date": "2026-10-09",
      "time": "15:20",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-afvbnjzqf",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 4",
      "groupName": "Super 8",
      "round": 4,
      "matchNumber": 7,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-carlos",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Carlos Souza"
      },
      "teamB": {
        "player1Id": "ath-pedro",
        "player2Id": "ath-lucas",
        "player1Name": "Pedro Santos",
        "player2Name": "Lucas Pereira"
      },
      "date": "2026-10-09",
      "time": "16:00",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-5q5y12090",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 4",
      "groupName": "Super 8",
      "round": 4,
      "matchNumber": 8,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-zm0bhpk79",
        "player2Id": "ath-maria",
        "player1Name": "Jubileu da Silva",
        "player2Name": "Maria Oliveira"
      },
      "teamB": {
        "player1Id": "ath-bktqtc8rs",
        "player2Id": "ath-lxkaq0uqv",
        "player1Name": "Felipe de Melo Rodrigues",
        "player2Name": "Radael Mistof\u00f3bico"
      },
      "date": "2026-10-09",
      "time": "16:00",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-kqcl5dq0b",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 5",
      "groupName": "Super 8",
      "round": 5,
      "matchNumber": 9,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-lucas",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Lucas Pereira"
      },
      "teamB": {
        "player1Id": "ath-carlos",
        "player2Id": "ath-maria",
        "player1Name": "Carlos Souza",
        "player2Name": "Maria Oliveira"
      },
      "date": "2026-10-09",
      "time": "16:40",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-52t4jigni",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 5",
      "groupName": "Super 8",
      "round": 5,
      "matchNumber": 10,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-pedro",
        "player2Id": "ath-lxkaq0uqv",
        "player1Name": "Pedro Santos",
        "player2Name": "Radael Mistof\u00f3bico"
      },
      "teamB": {
        "player1Id": "ath-zm0bhpk79",
        "player2Id": "ath-bktqtc8rs",
        "player1Name": "Jubileu da Silva",
        "player2Name": "Felipe de Melo Rodrigues"
      },
      "date": "2026-10-09",
      "time": "16:40",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-3jkeejjhi",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 6",
      "groupName": "Super 8",
      "round": 6,
      "matchNumber": 11,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-maria",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Maria Oliveira"
      },
      "teamB": {
        "player1Id": "ath-lucas",
        "player2Id": "ath-lxkaq0uqv",
        "player1Name": "Lucas Pereira",
        "player2Name": "Radael Mistof\u00f3bico"
      },
      "date": "2026-10-09",
      "time": "17:20",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-qtjc20a5g",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 6",
      "groupName": "Super 8",
      "round": 6,
      "matchNumber": 12,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-carlos",
        "player2Id": "ath-bktqtc8rs",
        "player1Name": "Carlos Souza",
        "player2Name": "Felipe de Melo Rodrigues"
      },
      "teamB": {
        "player1Id": "ath-pedro",
        "player2Id": "ath-zm0bhpk79",
        "player1Name": "Pedro Santos",
        "player2Name": "Jubileu da Silva"
      },
      "date": "2026-10-09",
      "time": "17:20",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-c4q4ka2zr",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 7",
      "groupName": "Super 8",
      "round": 7,
      "matchNumber": 13,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-joao",
        "player2Id": "ath-lxkaq0uqv",
        "player1Name": "Jo\u00e3o da Silva",
        "player2Name": "Radael Mistof\u00f3bico"
      },
      "teamB": {
        "player1Id": "ath-maria",
        "player2Id": "ath-bktqtc8rs",
        "player1Name": "Maria Oliveira",
        "player2Name": "Felipe de Melo Rodrigues"
      },
      "date": "2026-10-09",
      "time": "18:00",
      "court": "Quadra 1",
      "status": "PENDENTE",
      "id": "mat-s8-cdabu5quf",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    },
    {
      "super8Id": "t-qw68nd3xp",
      "stage": "Rodada 7",
      "groupName": "Super 8",
      "round": 7,
      "matchNumber": 14,
      "games": 4,
      "thaiBreak": false,
      "teamA": {
        "player1Id": "ath-lucas",
        "player2Id": "ath-zm0bhpk79",
        "player1Name": "Lucas Pereira",
        "player2Name": "Jubileu da Silva"
      },
      "teamB": {
        "player1Id": "ath-carlos",
        "player2Id": "ath-pedro",
        "player1Name": "Carlos Souza",
        "player2Name": "Pedro Santos"
      },
      "date": "2026-10-09",
      "time": "18:00",
      "court": "Quadra 2",
      "status": "PENDENTE",
      "id": "mat-s8-gpiwrcr7j",
      "createdAt": "2026-10-09T12:07:54.961Z",
      "updatedAt": "2026-10-09T12:07:54.961Z"
    }
  ],
  "venues": [
    {
      "id": "ven-kpptfkeak",
      "name": "Toss",
      "city": "Fortaleza",
      "state": "CE",
      "address": "Avenida Presidente Castelo Branco, 400",
      "courtsCount": 10,
      "contactPhone": "85996595730",
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:02:23.949Z",
      "updatedAt": "2026-10-09T12:02:23.949Z"
    },
    {
      "id": "ven-ltyrqu4i7",
      "name": "Montese",
      "city": "Fortaleza",
      "state": "CE",
      "address": "Avenida Presidente Castelo Branco, 400",
      "courtsCount": 6,
      "contactPhone": "85996595730",
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:15:47.892Z",
      "updatedAt": "2026-10-09T12:15:47.892Z"
    }
  ]
};

let memoryCache: DBData | null = null;
let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;
let pendingWrites: Promise<any>[] = [];

const hasDb = !!process.env.DATABASE_URL;

let pgPool: Pool | null = null;
if (hasDb) {
  try {
    const connStr = process.env.DATABASE_URL || '';
    pgPool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  } catch (e) {
    console.error('[ArenaBT] Erro ao instanciar Pool do PostgreSQL:', (e as any)?.message || e);
    pgPool = null;
  }
}

async function initPostgresTable(): Promise<void> {
  if (!pgPool) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "DbStore" (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.warn('[ArenaBT] Falha ao verificar/criar tabela DbStore no PostgreSQL:', (e as any)?.message || e);
  }
}

async function loadFromDb(): Promise<DBData | null> {
  if (!pgPool) return null;
  try {
    const result = await pgPool.query('SELECT data FROM "DbStore" WHERE key = $1 LIMIT 1;', ['main_db']);
    if (result.rows && result.rows.length > 0 && result.rows[0]?.data) {
      return result.rows[0].data as DBData;
    }
  } catch (e) {
    console.warn('[ArenaBT] Nao foi possivel carregar dados do PostgreSQL:', (e as any)?.message || e);
  }
  return null;
}

async function upsertToDb(data: DBData): Promise<void> {
  if (!pgPool) return;
  try {
    await pgPool.query(
      'INSERT INTO "DbStore" (key, data, "updatedAt") VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = NOW();',
      ['main_db', JSON.stringify(data)]
    );
  } catch (e) {
    console.warn('[ArenaBT] Falha ao salvar no PostgreSQL:', (e as any)?.message || e);
  }
}

function normalizeAndMigrateDB(parsed: any): { data: DBData; needsUpdate: boolean } {
  let needsUpdate = false;

  if (!parsed.users || !Array.isArray(parsed.users)) {
    parsed.users = defaultData.users;
    needsUpdate = true;
  }
  if (!parsed.athletes || !Array.isArray(parsed.athletes)) {
    parsed.athletes = defaultData.athletes;
    needsUpdate = true;
  }
  if (!parsed.arenas || !Array.isArray(parsed.arenas)) {
    parsed.arenas = [];
    needsUpdate = true;
  }
  if (!parsed.arenaAthletes || !Array.isArray(parsed.arenaAthletes)) {
    parsed.arenaAthletes = [];
    needsUpdate = true;
  }
  if (!parsed.tournaments || !Array.isArray(parsed.tournaments)) {
    parsed.tournaments = [];
    needsUpdate = true;
  }
  if (!parsed.categories || !Array.isArray(parsed.categories)) {
    parsed.categories = [];
    needsUpdate = true;
  }
  if (!parsed.registrations || !Array.isArray(parsed.registrations)) {
    parsed.registrations = [];
    needsUpdate = true;
  }
  if (!parsed.duos || !Array.isArray(parsed.duos)) {
    parsed.duos = [];
    needsUpdate = true;
  }
  if (!parsed.matches || !Array.isArray(parsed.matches)) {
    parsed.matches = [];
    needsUpdate = true;
  }
  if (!parsed.venues || !Array.isArray(parsed.venues)) {
    parsed.venues = [];
    needsUpdate = true;
  }
  if (!parsed.super8Events || !Array.isArray(parsed.super8Events)) {
    parsed.super8Events = [];
    needsUpdate = true;
  }
  if (!parsed.super8Matches || !Array.isArray(parsed.super8Matches)) {
    parsed.super8Matches = [];
    needsUpdate = true;
  }

  // =========================================================================
  // MIGRAÇÃO NÃO DESTRUTIVA: Separar Super 8 do módulo tradicional de Torneios
  // =========================================================================
  const migratedTournamentIds = new Set<string>();
  const migratedCategoryIds = new Set<string>();

  for (const t of parsed.tournaments) {
    const tCats = parsed.categories.filter((c: any) => c.tournamentId === t.id);
    const tMatches = parsed.matches.filter((m: any) => m.tournamentId === t.id);

    const isLegacySuper8Tournament =
      t.isDuo === false ||
      (tCats.length > 0 && tCats.every((c: any) => c.type === 'SUPER 8' || c.type === 'SUPER 8 DUPLAS')) ||
      (tCats.length === 0 && tMatches.length > 0 && tMatches.every((m: any) => m.format === 'SUPER_8'));

    if (!isLegacySuper8Tournament) continue;

    migratedTournamentIds.add(t.id);
    tCats.forEach((c: any) => migratedCategoryIds.add(c.id));

    const existingEvent = parsed.super8Events.find(
      (e: any) => e.id === t.id || e.legacyTournamentId === t.id
    );

    const primaryCat = tCats[0];
    const resolvedGames = (primaryCat?.games === 6 || t.games === 6) ? 6 : 4;
    const resolvedThaiBreak = resolvedGames === 6 ? Boolean(primaryCat?.thaiBreak ?? t.thaiBreak ?? false) : false;

    if (!existingEvent) {
      const activeRegs = parsed.registrations.filter(
        (r: any) => r.tournamentId === t.id && r.status !== 'CANCELADA'
      );
      const athleteIds: string[] = [];
      const seenAthletes = new Set<string>();

      for (const r of activeRegs) {
        if (r.athleteId && !seenAthletes.has(r.athleteId)) {
          seenAthletes.add(r.athleteId);
          athleteIds.push(r.athleteId);
        }
      }
      for (const m of tMatches) {
        const players = [
          m.teamA?.player1Id,
          m.teamA?.player2Id,
          m.teamB?.player1Id,
          m.teamB?.player2Id
        ];
        for (const pId of players) {
          if (pId && !seenAthletes.has(pId)) {
            seenAthletes.add(pId);
            athleteIds.push(pId);
          }
        }
      }

      parsed.super8Events.push({
        id: t.id,
        name: t.name || 'Super 8',
        seriesName: t.seriesName || t.name || 'Super 8',
        arenaId: t.arenaId || t.organizerId || '',
        organizerId: t.organizerId || t.arenaId || '',
        venueId: t.venueId,
        venueName: t.venueName,
        courtsUsed: typeof t.courtsUsed === 'number' && t.courtsUsed >= 1 ? t.courtsUsed : 2,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status || 'INSCRICOES_ABERTAS',
        categoryName: primaryCat?.name || 'Super 8',
        level: primaryCat?.level || 'PRINCIPIANTE',
        price: typeof primaryCat?.price === 'number' ? primaryCat.price : 40,
        games: resolvedGames,
        thaiBreak: resolvedThaiBreak,
        athleteIds,
        legacyTournamentId: t.id,
        legacyCategoryId: primaryCat?.id,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString()
      });
      needsUpdate = true;
    }

    for (const m of tMatches) {
      if (m.teamA && m.teamB && !parsed.super8Matches.some((sm: any) => sm.id === m.id)) {
        parsed.super8Matches.push({
          id: m.id,
          super8Id: existingEvent ? existingEvent.id : t.id,
          stage: m.stage || `Rodada ${m.round || 1}`,
          groupName: m.groupName || 'Super 8',
          round: m.round || 1,
          matchNumber: m.matchNumber || 1,
          teamA: m.teamA,
          teamB: m.teamB,
          scoreA: m.scoreA,
          scoreB: m.scoreB,
          score: m.score,
          winnerTeam: m.winnerTeam,
          date: m.date,
          time: m.time,
          court: m.court || 'Quadra 1',
          status: m.status || 'PENDENTE',
          games: m.games !== undefined ? m.games : resolvedGames,
          thaiBreak: m.thaiBreak !== undefined ? Boolean(m.thaiBreak) : resolvedThaiBreak,
          tieBreaker: m.tieBreaker,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString()
        });
        needsUpdate = true;
      }
    }
  }

  // Migrar eventuais partidas órfãs marcadas como SUPER_8
  for (const m of parsed.matches) {
    if (m.format === 'SUPER_8' && m.teamA && m.teamB && !parsed.super8Matches.some((sm: any) => sm.id === m.id)) {
      parsed.super8Matches.push({
        id: m.id,
        super8Id: m.tournamentId,
        stage: m.stage || `Rodada ${m.round || 1}`,
        groupName: m.groupName || 'Super 8',
        round: m.round || 1,
        matchNumber: m.matchNumber || 1,
        teamA: m.teamA,
        teamB: m.teamB,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        score: m.score,
        winnerTeam: m.winnerTeam,
        date: m.date,
        time: m.time,
        court: m.court || 'Quadra 1',
        status: m.status || 'PENDENTE',
        games: m.games !== undefined ? m.games : 4,
        thaiBreak: Boolean(m.thaiBreak),
        tieBreaker: m.tieBreaker,
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: m.updatedAt || new Date().toISOString()
      });
      needsUpdate = true;
    }
  }

  // Remover apenas após confirmar persistência no novo domínio Super 8
  const migratedEventIdsConfirmed = new Set(
    parsed.super8Events.map((e: any) => e.legacyTournamentId || e.id)
  );
  const migratedMatchIdsConfirmed = new Set(parsed.super8Matches.map((sm: any) => sm.id));

  if (migratedTournamentIds.size > 0) {
    const beforeT = parsed.tournaments.length;
    parsed.tournaments = parsed.tournaments.filter(
      (t: any) => !(migratedTournamentIds.has(t.id) && migratedEventIdsConfirmed.has(t.id))
    );
    if (parsed.tournaments.length !== beforeT) needsUpdate = true;
  }

  const beforeC = parsed.categories.length;
  parsed.categories = parsed.categories.filter(
    (c: any) =>
      !(c.tournamentId && migratedTournamentIds.has(c.tournamentId) && migratedEventIdsConfirmed.has(c.tournamentId)) &&
      c.type !== 'SUPER 8' &&
      c.type !== 'SUPER 8 DUPLAS'
  );
  if (parsed.categories.length !== beforeC) needsUpdate = true;

  const beforeR = parsed.registrations.length;
  parsed.registrations = parsed.registrations.filter(
    (r: any) =>
      !(migratedTournamentIds.has(r.tournamentId) && migratedEventIdsConfirmed.has(r.tournamentId)) &&
      !migratedCategoryIds.has(r.categoryId)
  );
  if (parsed.registrations.length !== beforeR) needsUpdate = true;

  const beforeM = parsed.matches.length;
  parsed.matches = parsed.matches.filter((m: any) => !migratedMatchIdsConfirmed.has(m.id));
  if (parsed.matches.length !== beforeM) needsUpdate = true;

  // Dynamic field-level migrations for existing traditional tournaments
  parsed.tournaments.forEach((t: any) => {
    if (t.isDuo === undefined || t.isDuo === false) {
      t.isDuo = true;
      needsUpdate = true;
    }
    if (!t.venueId && parsed.venues && parsed.venues.length > 0) {
      const defaultVenue = parsed.venues[0];
      t.venueId = defaultVenue.id;
      t.venueName = defaultVenue.name;
      t.courtsUsed = Math.min(4, defaultVenue.courtsCount || 4);
      needsUpdate = true;
    }
    if (t.courtsUsed === undefined) {
      t.courtsUsed = 4;
      needsUpdate = true;
    }
  });

  if (parsed.categories.length === 0 || !parsed.categories.some((c: any) => !c.tournamentId || c.tournamentId === 'GLOBAL')) {
    const now = new Date().toISOString();
    DEFAULT_MASTER_CATEGORIES.forEach(std => {
      const already = parsed.categories.some((c: any) => c.type === std.type && c.level === std.level && (!c.tournamentId || c.tournamentId === 'GLOBAL'));
      if (!already) {
        parsed.categories.push({
          ...std,
          createdAt: now,
          updatedAt: now
        });
        needsUpdate = true;
      }
    });
  }

  parsed.categories.forEach((c: any) => {
    if (c.maxParticipants === undefined) {
      c.maxParticipants = 16;
      needsUpdate = true;
    }
    if (!c.name) {
      c.name = `${c.type} ${c.level}`;
      needsUpdate = true;
    }
    if (!c.status) {
      c.status = 'ATIVA';
      needsUpdate = true;
    }
  });

  if (!parsed.profiles || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
    parsed.profiles = DEFAULT_SYSTEM_PROFILES;
    needsUpdate = true;
  } else {
    // Garantir que todos os perfis do sistema existam
    DEFAULT_SYSTEM_PROFILES.forEach(dp => {
      if (!parsed.profiles.some((p: any) => p.id === dp.id)) {
        parsed.profiles.push(dp);
        needsUpdate = true;
      }
    });

    // Garantir que perfis existentes tenham a permissão 'super8' sem sobrescrever customizações
    parsed.profiles.forEach((p: any) => {
      if (!Array.isArray(p.permissions)) {
        p.permissions = [];
      }
      if (!p.permissions.some((perm: any) => perm.screen === 'super8')) {
        if (p.id === 'prof-super-admin') {
          p.permissions.push({ screen: 'super8', view: true, create: true, edit: true, delete: true });
        } else if (p.id === 'prof-organizador') {
          p.permissions.push({ screen: 'super8', view: true, create: true, edit: true, delete: false });
        } else if (p.id === 'prof-mesario') {
          p.permissions.push({ screen: 'super8', view: true, create: false, edit: true, delete: false });
        } else if (p.id === 'prof-visualizador') {
          p.permissions.push({ screen: 'super8', view: true, create: false, edit: false, delete: false });
        } else {
          const refPerm = p.permissions.find((perm: any) => perm.screen === 'tournaments') ||
            p.permissions.find((perm: any) => perm.screen === 'matches');
          p.permissions.push({
            screen: 'super8',
            view: Boolean(refPerm?.view),
            create: Boolean(refPerm?.create),
            edit: Boolean(refPerm?.edit),
            delete: Boolean(refPerm?.delete)
          });
        }
        needsUpdate = true;
      }
    });
  }

  // Migração de campos de usuários e vinculação padrão de perfil
  parsed.users.forEach((u: any) => {
    if (!u.status) {
      u.status = 'ATIVO';
      needsUpdate = true;
    }
    if (!u.profileId) {
      if (u.role === 'SUPER_ADMIN') {
        u.profileId = 'prof-super-admin';
      } else if (u.role === 'ARENA_ADMIN') {
        u.profileId = 'prof-organizador';
      } else {
        u.profileId = 'prof-organizador';
      }
      needsUpdate = true;
    }
    if (!u.source) {
      u.source = u.role === 'SUPER_ADMIN' ? 'SISTEMA' : 'ORGANIZADOR';
      needsUpdate = true;
    }
  });

  // Sincronização automática de Atletas -> Usuários (sem duplicidade)
  if (parsed.athletes && Array.isArray(parsed.athletes)) {
    parsed.athletes.forEach((ath: any) => {
      const cpfDigits = (ath.cpf || '').replace(/\D/g, '');
      const usernameCandidate = cpfDigits || (ath.email ? ath.email.toLowerCase().trim() : `ath_${ath.id}`);
      const userExists = parsed.users.some((u: any) =>
        (u.athleteId && u.athleteId === ath.id) ||
        (u.username && u.username.toLowerCase() === usernameCandidate.toLowerCase()) ||
        (cpfDigits && u.username === cpfDigits)
      );

      if (!userExists) {
        parsed.users.push({
          id: `usr-ath-${ath.id}`,
          username: usernameCandidate,
          password: '123',
          role: 'CUSTOM',
          arenaId: null,
          name: ath.name,
          email: ath.email,
          phone: ath.phone,
          status: ath.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
          profileId: 'prof-visualizador',
          athleteId: ath.id,
          source: 'ATLETA',
          createdAt: ath.createdAt || new Date().toISOString(),
          updatedAt: ath.updatedAt || new Date().toISOString()
        });
        needsUpdate = true;
      }
    });
  }

  // Sincronização automática de Organizadores/Arenas -> Usuários (sem duplicidade)
  if (parsed.arenas && Array.isArray(parsed.arenas)) {
    parsed.arenas.forEach((arena: any) => {
      const adminUser = parsed.users.find((u: any) => u.arenaId === arena.id && u.role === 'ARENA_ADMIN');
      if (!adminUser) {
        const baseUser = arena.email ? arena.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : `org_${arena.id.substring(0, 6)}`;
        const finalUser = baseUser.length >= 3 ? baseUser : `org_${arena.id.substring(0, 6)}`;

        if (!parsed.users.some((u: any) => u.username.toLowerCase() === finalUser.toLowerCase())) {
          parsed.users.push({
            id: `usr-org-${arena.id}`,
            username: finalUser,
            password: '123',
            role: 'ARENA_ADMIN',
            arenaId: arena.id,
            name: `${arena.name} Admin`,
            email: arena.email,
            phone: arena.phone,
            status: arena.status === 'INATIVA' ? 'INATIVO' : 'ATIVO',
            profileId: 'prof-organizador',
            source: 'ORGANIZADOR',
            createdAt: arena.createdAt || new Date().toISOString(),
            updatedAt: arena.updatedAt || new Date().toISOString()
          });
          needsUpdate = true;
        }
      }
    });
  }

  return { data: parsed as DBData, needsUpdate };
}

export async function ensureDbInitialized(): Promise<void> {
  if (isDbInitialized) return;
  if (dbInitPromise) {
    await dbInitPromise;
    return;
  }
  dbInitPromise = (async () => {
    if (!hasDb || !pgPool) {
      isDbInitialized = true;
      return;
    }
    await initPostgresTable();
    const loaded = await loadFromDb();
    if (loaded) {
      const { data: migrated, needsUpdate } = normalizeAndMigrateDB(loaded);
      memoryCache = migrated;
      if (needsUpdate) {
        await upsertToDb(migrated);
      }
      console.log('[ArenaBT] Dados carregados com sucesso do PostgreSQL.');
    } else {
      await upsertToDb(memoryCache || defaultData);
      console.log('[ArenaBT] Estado inicial propagado para o PostgreSQL.');
    }
    isDbInitialized = true;
  })();
  await dbInitPromise;
}

export async function flushWrites(): Promise<void> {
  if (pendingWrites.length > 0) {
    await Promise.allSettled(pendingWrites);
    pendingWrites = [];
  }
}

if (typeof process !== 'undefined' && hasDb) {
  ensureDbInitialized().catch(() => {});
}

export function readDB(): DBData {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      try {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
      } catch {}
      memoryCache = defaultData;
      return defaultData;
    }
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw);

    const { data, needsUpdate } = normalizeAndMigrateDB(parsed);

    if (needsUpdate) {
      writeDB(data);
    } else {
      memoryCache = data;
    }

    return data;
  } catch (error) {
    console.error("Error reading db file, falling back to cache:", error);
    if (memoryCache) {
      return memoryCache;
    }
    return defaultData;
  }
}

export function writeDB(data: DBData): void {
  memoryCache = data;
  const dbPath = getDbPath();
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const tempPath = `${dbPath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, dbPath);
  } catch (error) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Em ambientes puramente read-only, memoryCache e PostgreSQL mantêm os dados
    }
  }

  if (hasDb && pgPool) {
    const p = upsertToDb(data);
    pendingWrites.push(p);
  }
}