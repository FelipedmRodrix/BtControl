export type SystemScreen = 
  | 'dashboard'
  | 'athletes'
  | 'arenas'
  | 'venues'
  | 'categories'
  | 'tournaments'
  | 'super8'
  | 'super8-standings'
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
  password?: string;
  role: 'SUPER_ADMIN' | 'ARENA_ADMIN' | 'CUSTOM';
  arenaId: string | null;
  name: string;
  email?: string;
  phone?: string;
  status: 'ATIVO' | 'INATIVO';
  profileId?: string;
  athleteId?: string;
  source?: 'SISTEMA' | 'ORGANIZADOR' | 'ATLETA' | 'IMPORTACAO';
  profileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Arena {
  id: string;
  name: string;
  owner?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  status: 'ATIVA' | 'INATIVA';
  createdAt?: string;
  updatedAt?: string;
}

export const ALL_SYSTEM_SCREENS: { id: SystemScreen; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard / Visão Geral', description: 'Visão consolidada de números e atalhos' },
  { id: 'athletes', label: 'Atletas', description: 'Cadastro e gestão de atletas' },
  { id: 'arenas', label: 'Arenas / Organizadores', description: 'Gestão de parceiros e administradores de arenas' },
  { id: 'venues', label: 'Locais Físicos (Arenas Físicas)', description: 'Gestão de quadras físicas e locais de jogos' },
  { id: 'categories', label: 'Categorias Padrão', description: 'Configuração de categorias e regras de pontuação' },
  { id: 'tournaments', label: 'Torneios', description: 'Criação e edição de torneios de duplas' },
  { id: 'super8', label: 'Super 8', description: 'Competições individuais Super 8, rodadas dinâmicas e ranking individual' },
  { id: 'super8-standings', label: 'Classificação Individual', description: 'Acompanhamento de pontuação individual, jogos Super 8 e link direto para atletas' },
  { id: 'registrations', label: 'Inscrições', description: 'Gerenciamento de inscrições de atletas' },
  { id: 'duos', label: 'Formação de Duplas', description: 'Sorteio e formação de duplas por categoria' },
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
      if (s.id === 'dashboard' || s.id === 'super8-standings') {
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
      if (['reports', 'dashboard', 'bracket-tree', 'results', 'super8', 'super8-standings'].includes(s.id)) {
        return { screen: s.id, view: true, create: false, edit: false, delete: false };
      }
      return { screen: s.id, view: false, create: false, edit: false, delete: false };
    }),
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];
