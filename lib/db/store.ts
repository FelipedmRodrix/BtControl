import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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

export interface User {
  id: string;
  username: string;
  password?: string; // stored plain-text for developer preview/simplicity, can be omitted in API responses
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN';
  arenaId: string | null; // null for SUPER_ADMIN
  name: string;
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
  isDuo: boolean; // Flag to indicate if it's a duo (true) or individual (false) tournament
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
  type: 'SUPER 8' | 'MISTA' | 'MASCULINO' | 'FEMININO';
  level: 'PRINCIPIANTE' | 'INICIANTE' | 'D' | 'C' | 'B' | 'A' | 'OPEN';
  price: number;
  maxParticipants: number; // Max players or duos that can register
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

interface DBData {
  athletes: Athlete[];
  arenas: Arena[];
  venues: ArenaVenue[];
  arenaAthletes: ArenaAthlete[];
  users: User[];
  tournaments: Tournament[];
  categories: Category[];
  registrations: Registration[];
  duos: Duo[];
  matches: Match[];
}

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
  { id: 'cat-std-mis-ini', name: 'Mista Iniciante', type: 'MISTA', level: 'INICIANTE', price: 80, maxParticipants: 16, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Duplas Mistas Iniciantes' },

  // SUPER 8
  { id: 'cat-std-sup8-open', name: 'Super 8 Open', type: 'SUPER 8', level: 'OPEN', price: 130, maxParticipants: 8, status: 'ATIVA', tournamentId: 'GLOBAL', description: 'Formato Super 8 com chaveamento dinâmico' }
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
      "createdAt": "2026-10-09T12:15:22.521Z",
      "updatedAt": "2026-10-09T12:15:22.521Z"
    }
  ],
  "tournaments": [
    {
      "id": "t-qw68nd3xp",
      "name": "Super 8",
      "arenaId": "arena-zne0sbge6",
      "organizerId": "arena-zne0sbge6",
      "venueId": "ven-kpptfkeak",
      "venueName": "Toss",
      "courtsUsed": 2,
      "seriesName": "Super 8",
      "startDate": "2027-01-01",
      "endDate": "2027-02-02",
      "status": "INSCRICOES_ABERTAS",
      "isDuo": false,
      "createdAt": "2026-10-09T12:06:56.649Z",
      "updatedAt": "2026-10-09T12:06:56.649Z"
    },
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
      "id": "c-h5gyutri5",
      "tournamentId": "GLOBAL",
      "name": "SUPER 8 PRINCIPIANTE",
      "type": "SUPER 8",
      "level": "PRINCIPIANTE",
      "price": 40,
      "maxParticipants": 8,
      "status": "ATIVA",
      "description": "",
      "createdAt": "2026-10-09T12:03:07.823Z",
      "updatedAt": "2026-10-09T12:03:07.823Z"
    },
    {
      "id": "c-3f8ay2wky",
      "tournamentId": "t-qw68nd3xp",
      "masterCategoryId": "c-h5gyutri5",
      "name": "SUPER 8 PRINCIPIANTE",
      "type": "SUPER 8",
      "level": "PRINCIPIANTE",
      "price": 40,
      "maxParticipants": 8,
      "status": "ATIVA",
      "createdAt": "2026-10-09T12:06:56.649Z",
      "updatedAt": "2026-10-09T12:06:56.649Z"
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
      "id": "reg-8wlqt4rrk",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-joao",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.124Z",
      "updatedAt": "2026-10-09T12:07:17.124Z"
    },
    {
      "id": "reg-br6hr9z1l",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-lxkaq0uqv",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.201Z",
      "updatedAt": "2026-10-09T12:07:17.201Z"
    },
    {
      "id": "reg-piinfwjx6",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-maria",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.209Z",
      "updatedAt": "2026-10-09T12:07:17.209Z"
    },
    {
      "id": "reg-tdemspb8a",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-lucas",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.263Z",
      "updatedAt": "2026-10-09T12:07:17.263Z"
    },
    {
      "id": "reg-6oe0iy0sv",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-carlos",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.288Z",
      "updatedAt": "2026-10-09T12:07:17.288Z"
    },
    {
      "id": "reg-26lf094cc",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-pedro",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.305Z",
      "updatedAt": "2026-10-09T12:07:17.305Z"
    },
    {
      "id": "reg-m7al7i5p9",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-zm0bhpk79",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:17.317Z",
      "updatedAt": "2026-10-09T12:07:17.317Z"
    },
    {
      "id": "reg-lli452982",
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "athleteId": "ath-bktqtc8rs",
      "status": "CONFIRMADA",
      "createdAt": "2026-10-09T12:07:18.713Z",
      "updatedAt": "2026-10-09T12:07:18.713Z"
    },
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
  "matches": [
    {
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 1",
      "groupName": "Super 8",
      "round": 1,
      "matchNumber": 1,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 1",
      "groupName": "Super 8",
      "round": 1,
      "matchNumber": 2,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 2",
      "groupName": "Super 8",
      "round": 2,
      "matchNumber": 3,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 2",
      "groupName": "Super 8",
      "round": 2,
      "matchNumber": 4,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 3",
      "groupName": "Super 8",
      "round": 3,
      "matchNumber": 5,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 3",
      "groupName": "Super 8",
      "round": 3,
      "matchNumber": 6,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 4",
      "groupName": "Super 8",
      "round": 4,
      "matchNumber": 7,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 4",
      "groupName": "Super 8",
      "round": 4,
      "matchNumber": 8,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 5",
      "groupName": "Super 8",
      "round": 5,
      "matchNumber": 9,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 5",
      "groupName": "Super 8",
      "round": 5,
      "matchNumber": 10,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 6",
      "groupName": "Super 8",
      "round": 6,
      "matchNumber": 11,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 6",
      "groupName": "Super 8",
      "round": 6,
      "matchNumber": 12,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 7",
      "groupName": "Super 8",
      "round": 7,
      "matchNumber": 13,
      "format": "SUPER_8",
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
      "tournamentId": "t-qw68nd3xp",
      "categoryId": "c-3f8ay2wky",
      "stage": "Rodada 7",
      "groupName": "Super 8",
      "round": 7,
      "matchNumber": 14,
      "format": "SUPER_8",
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

let prisma: PrismaClient | null = null;
if (hasDb) {
  try {
    prisma = new PrismaClient({ log: ['error', 'warn'] });
  } catch (e) {
    console.error('[ArenaBT] Erro ao instanciar Prisma Client:', (e as any)?.message || e);
    prisma = null;
  }
}

async function loadFromDb(): Promise<DBData | null> {
  if (!prisma) return null;
  try {
    const result = await prisma!.$queryRaw<{ data: any }[]>`SELECT data FROM "DbStore" WHERE key = 'main_db' LIMIT 1;`;
    if (result && result.length > 0 && result[0]?.data) {
      return result[0].data as DBData;
    }
  } catch (e) {
    console.warn('[ArenaBT] Nao foi possivel carregar dados do PostgreSQL:', (e as any)?.message || e);
  }
  return null;
}

async function upsertToDb(data: DBData): Promise<void> {
  if (!prisma) return;
  try {
    await prisma!.$executeRawUnsafe(
      'INSERT INTO "DbStore" (key, data, "updatedAt") VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = NOW();',
      'main_db',
      JSON.stringify(data)
    );
  } catch (e) {
    console.warn('[ArenaBT] Falha ao salvar no PostgreSQL:', (e as any)?.message || e);
  }
}

export async function ensureDbInitialized(): Promise<void> {
  if (isDbInitialized) return;
  if (dbInitPromise) {
    await dbInitPromise;
    return;
  }
  dbInitPromise = (async () => {
    if (!hasDb || !prisma) {
      isDbInitialized = true;
      return;
    }
    const loaded = await loadFromDb();
    if (loaded) {
      memoryCache = loaded;
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

    // Dynamic field-level migrations for existing data
    parsed.tournaments.forEach((t: any) => {
      if (t.isDuo === undefined) {
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

    if (needsUpdate) {
      writeDB(parsed);
    } else {
      memoryCache = parsed;
    }

    return parsed;
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

  if (hasDb && prisma) {
    const p = upsertToDb(data);
    pendingWrites.push(p);
  }
}