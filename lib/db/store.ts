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

export interface Match {
  id: string;
  tournamentId: string;
  categoryId: string;
  stage: string;
  groupName?: string;
  duo1Id: string;
  duo2Id: string;
  date: string;
  time: string;
  court: string;
  status: 'PENDENTE' | 'FINALIZADA' | 'WO';
  score?: string;
  winnerDuoId?: string;
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
  athletes: [
    {
      id: "ath-joao",
      cpf: "12345678901",
      name: "João da Silva",
      birthDate: "1990-05-15",
      gender: "M",
      phone: "11999998888",
      email: "joao@example.com",
      status: "ATIVO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "ath-maria",
      cpf: "98765432109",
      name: "Maria Oliveira",
      birthDate: "1995-08-22",
      gender: "F",
      phone: "21988887777",
      email: "maria@example.com",
      status: "ATIVO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "ath-carlos",
      cpf: "45678912312",
      name: "Carlos Souza",
      birthDate: "1988-12-01",
      gender: "M",
      phone: "13977776666",
      email: "carlos@example.com",
      status: "ATIVO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "ath-pedro",
      cpf: "55566677788",
      name: "Pedro Santos",
      birthDate: "1992-04-10",
      gender: "M",
      phone: "11955554444",
      email: "pedro@example.com",
      status: "ATIVO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "ath-lucas",
      cpf: "11122233344",
      name: "Lucas Pereira",
      birthDate: "1994-07-15",
      gender: "M",
      phone: "11944443333",
      email: "lucas@example.com",
      status: "ATIVO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  arenas: [],
  venues: [],
  arenaAthletes: [],
  users: [
    {
      id: "usr-admin",
      username: "admin",
      password: "admin123",
      role: "SUPER_ADMIN",
      arenaId: null,
      name: "Administrador Geral",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  tournaments: [],
  categories: DEFAULT_MASTER_CATEGORIES.map(c => ({
    ...c,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  registrations: [],
  duos: [],
  matches: []
};

let memoryCache: DBData | null = null;
let pgPool: Pool | null = null;
let isPgInitialized = false;

function getPgPool(): Pool | null {
  if (pgPool) return pgPool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  try {
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') || dbUrl.includes('db:5432');
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    return pgPool;
  } catch (err) {
    console.error('[ArenaBT] Erro ao instanciar Pool PostgreSQL:', err);
    return null;
  }
}

async function initPgStorage() {
  const pool = getPgPool();
  if (!pool || isPgInitialized) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS arenabt_store (
        key VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const res = await pool.query(`SELECT data FROM arenabt_store WHERE key = 'main_db' LIMIT 1;`);
    if (res.rows.length > 0 && res.rows[0].data) {
      memoryCache = res.rows[0].data;
      try {
        const dbPath = getDbPath();
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, JSON.stringify(memoryCache, null, 2), 'utf-8');
      } catch {}
      console.log('[ArenaBT] Dados carregados com sucesso do PostgreSQL.');
    } else {
      const current = memoryCache || defaultData;
      await pool.query(
        `INSERT INTO arenabt_store (key, data, updated_at) VALUES ('main_db', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [JSON.stringify(current)]
      );
      console.log('[ArenaBT] Estado inicial propagado para o PostgreSQL.');
    }
    isPgInitialized = true;
  } catch (err) {
    console.warn('[ArenaBT] Não foi possível sincronizar com PostgreSQL agora (usando arquivo):', (err as any)?.message || err);
  }
}

// Inicia sincronização segura em background se DATABASE_URL existir
if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
  initPgStorage().catch(() => {});
}

export function readDB(): DBData {
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
      // Em ambientes puramente read-only, memoryCache e Postgres mantêm os dados
    }
  }

  // Sincroniza assincronamente com o PostgreSQL se DATABASE_URL estiver configurada
  const pool = getPgPool();
  if (pool) {
    pool.query(
      `INSERT INTO arenabt_store (key, data, updated_at) VALUES ('main_db', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
      [JSON.stringify(data)]
    ).catch(err => {
      console.warn('[ArenaBT] Falha ao sincronizar com PostgreSQL:', (err as any)?.message || err);
    });
  }
}
