const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'lib', 'db', 'db.json');
console.log('Lendo db.json de:', dbPath);

let db = {
  athletes: [],
  arenas: [],
  venues: [],
  arenaAthletes: [],
  users: [],
  tournaments: [],
  categories: [],
  registrations: [],
  duos: [],
  matches: []
};

if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.error('Erro ao parsear db.json existente:', e);
  }
}

if (!db.athletes) db.athletes = [];
if (!db.arenas) db.arenas = [];
if (!db.venues) db.venues = [];
if (!db.arenaAthletes) db.arenaAthletes = [];
if (!db.users) db.users = [];
if (!db.tournaments) db.tournaments = [];
if (!db.categories) db.categories = [];
if (!db.registrations) db.registrations = [];
if (!db.duos) db.duos = [];
if (!db.matches) db.matches = [];

const now = new Date().toISOString();

// 1. Organização
const orgId = 'arena-fortaleza-cbt';
let organizer = db.arenas.find(a => a.id === orgId);
if (!organizer) {
  organizer = {
    id: orgId,
    name: 'Circuito Cearense de Beach Tennis',
    owner: 'Felipe Rodrigues',
    email: 'contato@circuitocbt.com.br',
    phone: '85996595730',
    city: 'Fortaleza',
    state: 'CE',
    status: 'ATIVA',
    createdAt: now,
    updatedAt: now
  };
  db.arenas.push(organizer);
}

// 2. Usuário de Acesso para Fortaleza
if (!db.users.some(u => u.username === 'fortaleza')) {
  db.users.push({
    id: 'usr-fortaleza',
    username: 'fortaleza',
    password: '123',
    role: 'ARENA_ADMIN',
    arenaId: orgId,
    name: 'Gestor Fortaleza BT',
    createdAt: now,
    updatedAt: now
  });
}

// 3. Local Físico (Venue)
const venueId = 'ven-posto085-beiramar';
let venue = db.venues.find(v => v.id === venueId);
if (!venue) {
  venue = {
    id: venueId,
    name: 'Complexo Arena Posto 085',
    city: 'Fortaleza',
    state: 'CE',
    address: 'Av. Beira Mar, 2900 - Meireles, Fortaleza - CE',
    courtsCount: 8,
    contactPhone: '85996595730',
    status: 'ATIVA',
    createdAt: now,
    updatedAt: now
  };
  db.venues.push(venue);
}

// 4. Atletas de Fortaleza
const athletesList = [
  { id: 'ath-mateus-freitas', name: 'Mateus Freitas', cpf: '01234567801', phone: '85988881111', email: 'mateus.freitas@ceara.com', gender: 'M' },
  { id: 'ath-lucas-alencar', name: 'Lucas Alencar', cpf: '02345678902', phone: '85988882222', email: 'lucas.alencar@ceara.com', gender: 'M' },
  { id: 'ath-rodrigo-bezerra', name: 'Rodrigo Bezerra', cpf: '03456789003', phone: '85988883333', email: 'rodrigo.bezerra@ceara.com', gender: 'M' },
  { id: 'ath-gabriel-cavalcante', name: 'Gabriel Cavalcante', cpf: '04567890104', phone: '85988884444', email: 'gabriel.cavalcante@ceara.com', gender: 'M' },
  { id: 'ath-thiago-mendonca', name: 'Thiago Mendonça', cpf: '05678901205', phone: '85988885555', email: 'thiago.mendonca@ceara.com', gender: 'M' },
  { id: 'ath-davi-holanda', name: 'Davi Holanda', cpf: '06789012306', phone: '85988886666', email: 'davi.holanda@ceara.com', gender: 'M' },
  { id: 'ath-bktqtc8rs', name: 'Felipe de Melo Rodrigues', cpf: '60876116306', phone: '85996595730', email: 'felipe.rodrigues@ceara.com', gender: 'M' },
  { id: 'ath-rafael-vasconcelos', name: 'Rafael Vasconcelos', cpf: '08901234508', phone: '85988888888', email: 'rafael.vasconcelos@ceara.com', gender: 'M' }
];

for (const ath of athletesList) {
  let existing = db.athletes.find(a => a.id === ath.id || a.cpf === ath.cpf);
  if (!existing) {
    db.athletes.push({
      id: ath.id,
      name: ath.name,
      cpf: ath.cpf,
      birthDate: '1994-06-15',
      gender: ath.gender,
      phone: ath.phone,
      email: ath.email,
      status: 'ATIVO',
      createdAt: now,
      updatedAt: now
    });
  }

  // Vincular à arena
  const athId = existing ? existing.id : ath.id;
  if (!db.arenaAthletes.some(aa => aa.arenaId === orgId && aa.athleteId === athId)) {
    db.arenaAthletes.push({
      id: `aa-fort-${athId}`,
      arenaId: orgId,
      athleteId: athId,
      status: 'ATIVO',
      createdAt: now,
      updatedAt: now
    });
  }
}

// 5. Torneio em Fortaleza
const tournamentId = 'tor-fortaleza-beiramar-2027';
let tournament = db.tournaments.find(t => t.id === tournamentId);
if (!tournament) {
  tournament = {
    id: tournamentId,
    name: 'Open Beira-Mar Fortaleza 2027',
    seriesName: 'Circuito Cearense BT',
    arenaId: orgId,
    organizerId: orgId,
    venueId: venueId,
    venueName: 'Complexo Arena Posto 085',
    courtsUsed: 4,
    startDate: '2027-03-20',
    endDate: '2027-03-22',
    status: 'FINALIZADO',
    isDuo: true,
    games: 6,
    thaiBreak: true,
    createdAt: now,
    updatedAt: now
  };
  db.tournaments.push(tournament);
} else {
  tournament.status = 'FINALIZADO';
  tournament.games = 6;
  tournament.thaiBreak = true;
}

// 6. Categoria Masculina Open (6 games + Thai Break)
const categoryId = 'cat-fort-masc-open-2027';
let category = db.categories.find(c => c.id === categoryId);
if (!category) {
  category = {
    id: categoryId,
    tournamentId: tournamentId,
    name: 'Dupla Masculina Open',
    type: 'MASCULINO',
    level: 'OPEN',
    price: 120,
    maxParticipants: 16,
    status: 'ATIVA',
    description: 'Categoria Open Masculina - 6 games com Thai Break',
    games: 6,
    thaiBreak: true,
    createdAt: now,
    updatedAt: now
  };
  db.categories.push(category);
} else {
  category.games = 6;
  category.thaiBreak = true;
}

// 7. Inscrições Confirmadas
for (const ath of athletesList) {
  if (!db.registrations.some(r => r.tournamentId === tournamentId && r.athleteId === ath.id)) {
    db.registrations.push({
      id: `reg-fort-${ath.id}`,
      tournamentId: tournamentId,
      categoryId: categoryId,
      athleteId: ath.id,
      status: 'CONFIRMADA',
      createdAt: now,
      updatedAt: now
    });
  }
}

// 8. Duplas Formadas
const duosToCreate = [
  { id: 'duo-fort-freitas-alencar', p1: 'ath-mateus-freitas', p2: 'ath-lucas-alencar' },
  { id: 'duo-fort-bezerra-cavalcante', p1: 'ath-rodrigo-bezerra', p2: 'ath-gabriel-cavalcante' },
  { id: 'duo-fort-mendonca-holanda', p1: 'ath-thiago-mendonca', p2: 'ath-davi-holanda' },
  { id: 'duo-fort-rodrigues-vasconcelos', p1: 'ath-bktqtc8rs', p2: 'ath-rafael-vasconcelos' }
];

for (const d of duosToCreate) {
  if (!db.duos.some(existing => existing.id === d.id)) {
    db.duos.push({
      id: d.id,
      tournamentId: tournamentId,
      categoryId: categoryId,
      player1Id: d.p1,
      player2Id: d.p2,
      status: 'CONFIRMADA',
      createdAt: now,
      updatedAt: now
    });
  }
}

// 9. Partidas (Mata-Mata completo com placares lançados e campeão definido)
db.matches = db.matches.filter(m => m.tournamentId !== tournamentId);

// Semifinal 1
db.matches.push({
  id: 'mat-fort-semi-1',
  tournamentId: tournamentId,
  categoryId: categoryId,
  stage: 'Semifinal',
  format: 'STANDARD',
  matchNumber: 1,
  round: 1,
  duo1Id: 'duo-fort-freitas-alencar',
  duo2Id: 'duo-fort-mendonca-holanda',
  teamA: {
    player1Id: 'ath-mateus-freitas',
    player2Id: 'ath-lucas-alencar',
    player1Name: 'Mateus Freitas',
    player2Name: 'Lucas Alencar'
  },
  teamB: {
    player1Id: 'ath-thiago-mendonca',
    player2Id: 'ath-davi-holanda',
    player1Name: 'Thiago Mendonça',
    player2Name: 'Davi Holanda'
  },
  date: '2027-03-21',
  time: '15:00',
  court: 'Quadra 1 (Central Beira-Mar)',
  status: 'FINALIZADA',
  scoreA: 6,
  scoreB: 4,
  score: '6 x 4',
  winnerTeam: 'TEAM_A',
  winnerDuoId: 'duo-fort-freitas-alencar',
  games: 6,
  thaiBreak: true,
  createdAt: now
});

// Semifinal 2 (Thai Break 6x6 -> 7x6 com tie-break até 7 pontos)
db.matches.push({
  id: 'mat-fort-semi-2',
  tournamentId: tournamentId,
  categoryId: categoryId,
  stage: 'Semifinal',
  format: 'STANDARD',
  matchNumber: 2,
  round: 1,
  duo1Id: 'duo-fort-bezerra-cavalcante',
  duo2Id: 'duo-fort-rodrigues-vasconcelos',
  teamA: {
    player1Id: 'ath-rodrigo-bezerra',
    player2Id: 'ath-gabriel-cavalcante',
    player1Name: 'Rodrigo Bezerra',
    player2Name: 'Gabriel Cavalcante'
  },
  teamB: {
    player1Id: 'ath-bktqtc8rs',
    player2Id: 'ath-rafael-vasconcelos',
    player1Name: 'Felipe de Melo Rodrigues',
    player2Name: 'Rafael Vasconcelos'
  },
  date: '2027-03-21',
  time: '16:00',
  court: 'Quadra 2 (Posto 085)',
  status: 'FINALIZADA',
  scoreA: 7,
  scoreB: 6,
  score: '7 x 6 (7-4 Thai Break)',
  winnerTeam: 'TEAM_A',
  winnerDuoId: 'duo-fort-bezerra-cavalcante',
  games: 6,
  thaiBreak: true,
  tieBreaker: 'Thai Break 7x4 após empate em 6x6',
  createdAt: now
});

// Grande Final (5x5 vai a 7 -> 7x5 com Troféu e Campeão Definido)
db.matches.push({
  id: 'mat-fort-final',
  tournamentId: tournamentId,
  categoryId: categoryId,
  stage: 'Final',
  format: 'STANDARD',
  matchNumber: 3,
  round: 2,
  duo1Id: 'duo-fort-freitas-alencar',
  duo2Id: 'duo-fort-bezerra-cavalcante',
  teamA: {
    player1Id: 'ath-mateus-freitas',
    player2Id: 'ath-lucas-alencar',
    player1Name: 'Mateus Freitas',
    player2Name: 'Lucas Alencar'
  },
  teamB: {
    player1Id: 'ath-rodrigo-bezerra',
    player2Id: 'ath-gabriel-cavalcante',
    player1Name: 'Rodrigo Bezerra',
    player2Name: 'Gabriel Cavalcante'
  },
  date: '2027-03-22',
  time: '18:00',
  court: 'Quadra 1 (Central Beira-Mar)',
  status: 'FINALIZADA',
  scoreA: 7,
  scoreB: 5,
  score: '7 x 5',
  winnerTeam: 'TEAM_A',
  winnerDuoId: 'duo-fort-freitas-alencar',
  games: 6,
  thaiBreak: true,
  tieBreaker: 'Regra de 5x5 estendido até 7 games',
  createdAt: now
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Dados do torneio de Fortaleza gravados com sucesso em:', dbPath);
console.log('Torneio:', tournament.name);
console.log('Organização:', organizer.name);
console.log('Venue:', venue.name);
console.log('Campeão Definido: Mateus Freitas & Lucas Alencar (7x5)');
