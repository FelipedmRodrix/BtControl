import { readDB, writeDB, Category, DEFAULT_MASTER_CATEGORIES } from '../db/store';

export const categoryService = {
  getAll(arenaId?: string): (Category & { tournamentName: string; arenaId: string; isMaster: boolean })[] {
    const db = readDB();
    
    const enriched = db.categories.map(c => {
      const isMaster = !c.tournamentId || c.tournamentId === 'GLOBAL';
      const tour = isMaster ? null : db.tournaments.find(t => t.id === c.tournamentId);
      return {
        ...c,
        name: c.name || `${c.type} ${c.level}`,
        status: c.status || 'ATIVA',
        isMaster,
        tournamentName: isMaster ? 'Pré-cadastrada (Sistema)' : (tour?.name || 'Torneio Desconhecido'),
        arenaId: tour?.arenaId || ''
      };
    });

    if (arenaId) {
      // Return arena tournament categories plus master categories
      return enriched.filter(c => c.isMaster || c.arenaId === arenaId);
    }

    return enriched;
  },

  getMasterCategories(): Category[] {
    const db = readDB();
    return db.categories
      .filter(c => !c.tournamentId || c.tournamentId === 'GLOBAL')
      .map(c => ({
        ...c,
        name: c.name || `${c.type} ${c.level}`,
        status: c.status || 'ATIVA'
      }));
  },

  getById(id: string): Category | null {
    const db = readDB();
    const cat = db.categories.find(c => c.id === id);
    if (!cat) return null;
    return {
      ...cat,
      name: cat.name || `${cat.type} ${cat.level}`,
      status: cat.status || 'ATIVA'
    };
  },

  create(data: Partial<Category> & { type: Category['type']; level: Category['level'] }, userRole: string): { success: boolean; data?: Category; error?: string; code?: number } {
    // Regra: apenas SUPER_ADMIN pode gerenciar e cadastrar categorias no sistema
    if (userRole !== 'SUPER_ADMIN') {
      return { success: false, error: 'Apenas o Administrador Geral (SUPER_ADMIN) do sistema pode cadastrar categorias.', code: 403 };
    }

    const db = readDB();
    const tournamentId = data.tournamentId && data.tournamentId.trim() !== '' ? data.tournamentId : 'GLOBAL';

    // Se vinculado a um torneio específico, verificar existência
    if (tournamentId !== 'GLOBAL') {
      const tour = db.tournaments.find(t => t.id === tournamentId);
      if (!tour) {
        return { success: false, error: 'O torneio especificado para esta categoria não foi encontrado.', code: 404 };
      }
    }

    // Verificar duplicidade de (type + level) no mesmo escopo
    const duplicate = db.categories.find(c => {
      const cTour = c.tournamentId || 'GLOBAL';
      return cTour === tournamentId && c.type === data.type && c.level === data.level;
    });

    if (duplicate) {
      return { 
        success: false, 
        error: tournamentId === 'GLOBAL' 
          ? `A categoria "${data.type} ${data.level}" já está pré-cadastrada no sistema.` 
          : `Esta categoria (${data.type} ${data.level}) já existe neste torneio.`, 
        code: 409 
      };
    }

    if (data.price !== undefined && data.price < 0) {
      return { success: false, error: 'O valor da taxa de inscrição não pode ser negativo.', code: 400 };
    }

    const newCategory: Category = {
      id: 'c-' + Math.random().toString(36).substring(2, 11),
      tournamentId,
      name: data.name?.trim() || `${data.type} ${data.level}`,
      type: data.type,
      level: data.level,
      price: data.price !== undefined ? Number(data.price) : 100,
      maxParticipants: data.maxParticipants !== undefined ? Number(data.maxParticipants) : 16,
      status: data.status || 'ATIVA',
      description: data.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.categories.push(newCategory);
    writeDB(db);

    return { success: true, data: newCategory };
  },

  update(
    id: string, 
    data: Partial<Category>, 
    userRole: string
  ): { success: boolean; data?: Category; error?: string; code?: number } {
    // Regra: apenas SUPER_ADMIN pode alterar categorias
    if (userRole !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acesso negado: Apenas o Administrador Geral (SUPER_ADMIN) pode alterar categorias.', code: 403 };
    }

    const db = readDB();
    const index = db.categories.findIndex(c => c.id === id);

    if (index === -1) {
      return { success: false, error: 'Categoria não encontrada.', code: 404 };
    }

    const current = db.categories[index];
    const targetTournamentId = data.tournamentId !== undefined ? (data.tournamentId || 'GLOBAL') : (current.tournamentId || 'GLOBAL');
    const targetType = data.type !== undefined ? data.type : current.type;
    const targetLevel = data.level !== undefined ? data.level : current.level;

    // Verificar duplicidade com outra categoria
    const duplicate = db.categories.find(c => {
      if (c.id === id) return false;
      const cTour = c.tournamentId || 'GLOBAL';
      return cTour === targetTournamentId && c.type === targetType && c.level === targetLevel;
    });

    if (duplicate) {
      return { success: false, error: `Já existe outra categoria cadastrada com o Tipo "${targetType}" e Nível "${targetLevel}".`, code: 409 };
    }

    if (data.tournamentId !== undefined) db.categories[index].tournamentId = data.tournamentId || 'GLOBAL';
    if (data.name !== undefined) db.categories[index].name = data.name.trim();
    if (data.type !== undefined) db.categories[index].type = data.type;
    if (data.level !== undefined) db.categories[index].level = data.level;
    if (data.status !== undefined) db.categories[index].status = data.status;
    if (data.description !== undefined) db.categories[index].description = data.description;
    
    if (data.price !== undefined) {
      if (data.price < 0) return { success: false, error: 'Preço inválido.', code: 400 };
      db.categories[index].price = Number(data.price);
    }
    if (data.maxParticipants !== undefined) {
      if (data.maxParticipants <= 0) return { success: false, error: 'O limite de vagas/duplas deve ser maior que zero.', code: 400 };
      db.categories[index].maxParticipants = Number(data.maxParticipants);
    }

    db.categories[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: db.categories[index] };
  },

  delete(id: string, userRole: string): { success: boolean; error?: string; code?: number } {
    // Regra: apenas SUPER_ADMIN pode excluir categorias
    if (userRole !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acesso negado: Apenas o Administrador Geral (SUPER_ADMIN) do sistema pode excluir categorias.', code: 403 };
    }

    const db = readDB();
    const index = db.categories.findIndex(c => c.id === id);

    if (index === -1) {
      return { success: false, error: 'Categoria não encontrada.', code: 404 };
    }

    // Verificar se há inscrições, duplas ou partidas vinculadas diretamente ao ID desta categoria
    const hasRegs = db.registrations?.some(r => r.categoryId === id);
    const hasDuos = db.duos?.some(d => d.categoryId === id);
    const hasMatches = db.matches?.some(m => m.categoryId === id);

    if (hasRegs || hasDuos || hasMatches) {
      return { 
        success: false, 
        error: 'Esta categoria não pode ser excluída pois possui inscrições, duplas ou partidas ativas vinculadas a ela. Você pode desativá-la alterando o status para INATIVA.', 
        code: 400 
      };
    }

    db.categories.splice(index, 1);
    writeDB(db);

    return { success: true };
  },

  resetToPresets(userRole: string): { success: boolean; count?: number; error?: string; code?: number } {
    if (userRole !== 'SUPER_ADMIN') {
      return { success: false, error: 'Apenas o Super Admin pode restaurar os padrões.', code: 403 };
    }

    const db = readDB();
    const now = new Date().toISOString();
    let addedCount = 0;

    DEFAULT_MASTER_CATEGORIES.forEach(std => {
      const exists = db.categories.some(c => (!c.tournamentId || c.tournamentId === 'GLOBAL') && c.type === std.type && c.level === std.level);
      if (!exists) {
        db.categories.push({
          ...std,
          createdAt: now,
          updatedAt: now
        });
        addedCount++;
      }
    });

    writeDB(db);
    return { success: true, count: addedCount };
  }
};
