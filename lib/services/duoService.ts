import { readDB, writeDB, Duo } from '../db/store';

export const duoService = {
  getAll(arenaId?: string, tournamentId?: string) {
    const db = readDB();

    let enriched = db.duos.map(d => {
      const p1 = db.athletes.find(a => a.id === d.player1Id);
      const p2 = db.athletes.find(a => a.id === d.player2Id);
      const category = db.categories.find(c => c.id === d.categoryId);
      const tournament = db.tournaments.find(t => t.id === d.tournamentId);

      return {
        ...d,
        player1Name: p1?.name || 'Atleta Desconhecido',
        player2Name: p2?.name || 'Atleta Desconhecido',
        categoryName: category ? `${category.type} - ${category.level}` : 'Categoria Desconhecida',
        tournamentName: tournament?.name || 'Torneio Desconhecido',
        arenaId: tournament?.arenaId || ''
      };
    });

    if (arenaId) {
      enriched = enriched.filter(d => d.arenaId === arenaId);
    }
    if (tournamentId) {
      enriched = enriched.filter(d => d.tournamentId === tournamentId);
    }

    return enriched;
  },

  create(data: { tournamentId: string; categoryId: string; player1Id: string; player2Id: string }): { success: boolean; data?: Duo; error?: string } {
    const db = readDB();

    if (data.player1Id === data.player2Id) {
      return { success: false, error: 'A dupla deve ser formada por dois atletas diferentes.' };
    }

    // 1. Verify tournament
    const tour = db.tournaments.find(t => t.id === data.tournamentId);
    if (!tour) return { success: false, error: 'O torneio especificado não existe.' };

    // 2. Verify category
    const cat = db.categories.find(c => c.id === data.categoryId && c.tournamentId === data.tournamentId);
    if (!cat) return { success: false, error: 'A categoria não pertence a este torneio.' };

    // 3. Verify athletes exist and are active
    const p1 = db.athletes.find(a => a.id === data.player1Id);
    const p2 = db.athletes.find(a => a.id === data.player2Id);

    if (!p1 || p1.status !== 'ATIVO' || !p2 || p2.status !== 'ATIVO') {
      return { success: false, error: 'Ambos os atletas devem estar cadastrados e ATIVOS no sistema.' };
    }

    // 4. Verify gender requirements
    if (cat.type === 'MASCULINO') {
      if (p1.gender !== 'M' || p2.gender !== 'M') {
        return { success: false, error: 'A categoria Masculina requer que ambos os atletas sejam do gênero masculino.' };
      }
    } else if (cat.type === 'FEMININO') {
      if (p1.gender !== 'F' || p2.gender !== 'F') {
        return { success: false, error: 'A categoria Feminina requer que ambos os atletas sejam do gênero feminino.' };
      }
    } else if (cat.type === 'MISTA') {
      const hasMale = p1.gender === 'M' || p2.gender === 'M';
      const hasFemale = p1.gender === 'F' || p2.gender === 'F';
      if (!hasMale || !hasFemale) {
        return { success: false, error: 'A categoria Mista requer que a dupla seja formada por um atleta masculino e um feminino.' };
      }
    }

    // 5. Verify athletes have CONFIRMED registrations in this category
    const reg1 = db.registrations.find(r => r.categoryId === data.categoryId && r.athleteId === data.player1Id && r.status === 'CONFIRMADA');
    const reg2 = db.registrations.find(r => r.categoryId === data.categoryId && r.athleteId === data.player2Id && r.status === 'CONFIRMADA');

    if (!reg1 || !reg2) {
      return { success: false, error: 'Ambos os atletas devem estar inscritos e confirmados nesta categoria para formar uma dupla.' };
    }

    // 6. Check if either athlete is already in a duo for this category
    const alreadyInDuo = db.duos.find(d => 
      d.categoryId === data.categoryId && 
      (d.player1Id === data.player1Id || d.player2Id === data.player1Id || 
       d.player1Id === data.player2Id || d.player2Id === data.player2Id)
    );

    if (alreadyInDuo) {
      return { success: false, error: 'Um dos atletas já está em outra dupla formada para esta categoria.' };
    }

    const newDuo: Duo = {
      id: 'duo-' + Math.random().toString(36).substring(2, 11),
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      player1Id: data.player1Id,
      player2Id: data.player2Id,
      status: 'CONFIRMADA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.duos.push(newDuo);
    writeDB(db);

    return { success: true, data: newDuo };
  },

  delete(id: string): { success: boolean; error?: string } {
    const db = readDB();
    const index = db.duos.findIndex(d => d.id === id);

    if (index === -1) {
      return { success: false, error: 'Dupla não encontrada.' };
    }

    // Ensure they don't have matches
    const hasMatches = db.matches.some(m => m.duo1Id === id || m.duo2Id === id);
    if (hasMatches) {
      return { success: false, error: 'Não é possível desfazer a dupla pois ela já possui jogos agendados.' };
    }

    db.duos.splice(index, 1);
    writeDB(db);

    return { success: true };
  }
};
