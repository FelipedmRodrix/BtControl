import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Search, 
  Shield, 
  Check, 
  X, 
  Lock, 
  UserCheck, 
  UserX, 
  Filter,
  Building,
  KeyRound,
  Tag
} from 'lucide-react';
import { User, Profile, Arena } from '@/lib/types/permissions';

interface UsersManagerProps {
  users: (Omit<User, 'password'> & { profileName?: string })[];
  profiles: Profile[];
  arenas: Arena[];
  onReload: () => void;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  requestConfirmation: (title: string, msg: string, onConfirm: () => void, confirmLabel?: string) => void;
  sessionRole?: string;
  userId?: string;
}

export function UsersManager({
  users,
  profiles,
  arenas,
  onReload,
  showSuccess,
  showError,
  requestConfirmation,
  sessionRole,
  userId
}: UsersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfile, setFilterProfile] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ATIVO' | 'INATIVO'>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(Omit<User, 'password'> & { profileName?: string }) | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    profileId: profiles[0]?.id || 'prof-organizador',
    arenaId: '',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
  });

  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      !searchTerm || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesProfile = filterProfile === 'ALL' || u.profileId === filterProfile;
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    const matchesSource = filterSource === 'ALL' || u.source === filterSource;

    return matchesSearch && matchesProfile && matchesStatus && matchesSource;
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      profileId: profiles[0]?.id || 'prof-organizador',
      arenaId: '',
      status: 'ATIVO',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: (Omit<User, 'password'> & { profileName?: string })) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      profileId: user.profileId || profiles[0]?.id || 'prof-organizador',
      arenaId: user.arenaId || '',
      status: user.status || 'ATIVO',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: (Omit<User, 'password'> & { profileName?: string })) => {
    const nextStatus = user.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': sessionRole || '',
          'x-user-id': userId || ''
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao alterar status do usuário.');
      }

      showSuccess(`Usuário ${nextStatus === 'ATIVO' ? 'ativado' : 'desativado'} com sucesso!`);
      onReload();
    } catch (err: any) {
      showError(err.message || 'Erro ao alterar status.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim()) {
      showError('Login e Nome são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = {
        username: formData.username.trim().toLowerCase(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        profileId: formData.profileId,
        arenaId: formData.arenaId || null,
        status: formData.status,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': sessionRole || '',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar usuário.');
      }

      showSuccess(editingUser ? 'Usuário atualizado com sucesso!' : 'Novo usuário cadastrado com sucesso!');
      setIsModalOpen(false);
      onReload();
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user: (Omit<User, 'password'> & { profileName?: string })) => {
    if (user.username === 'admin') {
      showError('O usuário administrador principal não pode ser removido.');
      return;
    }

    requestConfirmation(
      'Excluir Usuário',
      `Deseja realmente remover o usuário "${user.name}" (${user.username})? Esta ação é irreversível.`,
      async () => {
        try {
          const res = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'x-user-role': sessionRole || '',
              'x-user-id': userId || ''
            }
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir usuário.');
          }

          showSuccess('Usuário excluído com sucesso.');
          onReload();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir usuário.');
        }
      },
      'Sim, Excluir Usuário'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Central Única de Acesso
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-600" /> Gestão Centralizada de Usuários
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Todos os usuários cadastrados no sistema (administradores, organizadores, árbitros e atletas) são centralizados aqui sem duplicidade. Vincule cada usuário a um perfil de acesso para herdar permissões.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" /> Cadastrar Usuário
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, login, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          {/* Filtro por Perfil */}
          <select
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
            className="bg-white border border-slate-300 py-2 px-3 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">Todos os Perfis</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-white border border-slate-300 py-2 px-3 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">Status: Todos</option>
            <option value="ATIVO">Apenas Ativos</option>
            <option value="INATIVO">Apenas Inativos</option>
          </select>

          {/* Filtro por Origem */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-white border border-slate-300 py-2 px-3 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">Origem: Todas</option>
            <option value="SISTEMA">Sistema</option>
            <option value="ORGANIZADOR">Organizador</option>
            <option value="ATLETA">Atleta</option>
          </select>

          <span className="text-slate-500 text-[11px] font-mono tabular-nums font-semibold px-2">
            {filteredUsers.length} usuário(s)
          </span>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Usuário / Login</th>
                <th className="py-3 px-4">Perfil Vinculado</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const profile = profiles.find(p => p.id === user.profileId);
                  const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.profileId === 'prof-super-admin';
                  const arena = arenas.find(a => a.id === user.arenaId);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/90 transition">
                      {/* Usuário / Login */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase border ${
                            isSuperAdmin 
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : user.status === 'INATIVO'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {user.username.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-900 font-semibold">{user.name}</strong>
                              {isSuperAdmin && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">@{user.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Perfil Vinculado */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {profile?.name || user.profileName || 'Sem Perfil'}
                          </span>
                        </div>
                        {arena && (
                          <span className="text-[10px] text-teal-700 font-medium block mt-0.5">
                            Arena: {arena.name}
                          </span>
                        )}
                      </td>

                      {/* Origem */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold border ${
                          user.source === 'ATLETA'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : user.source === 'ORGANIZADOR'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {user.source || 'SISTEMA'}
                        </span>
                      </td>

                      {/* Contato */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-700 text-[11px] truncate max-w-[180px]">{user.email || '—'}</p>
                        <p className="text-slate-500 text-[10px] font-mono tabular-nums">{user.phone || '—'}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition border cursor-pointer inline-flex items-center gap-1 ${
                            user.status === 'ATIVO'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={`Clique para ${user.status === 'ATIVO' ? 'desativar' : 'ativar'} usuário`}
                        >
                          {user.status === 'ATIVO' ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" /> Ativo
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" /> Inativo
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                            title="Editar usuário e vínculo de perfil"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {user.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal de Cadastro / Edição de Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingUser ? `Editar Usuário: ${editingUser.name}` : 'Cadastrar Novo Usuário'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Defina os dados de acesso e vincule o usuário ao perfil de permissões.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                />
              </div>

              {/* Login e Senha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Login (Nome de Usuário) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: joao.silva"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">
                    {editingUser ? 'Nova Senha (opcional)' : 'Senha de Acesso *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? 'Deixe em branco para manter' : 'Mínimo 4 caracteres'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>
              </div>

              {/* Vínculo de Perfil de Acesso */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> Perfil de Acesso (Permissões) *
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Herança automática de flags</span>
                </label>
                <select
                  value={formData.profileId}
                  onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                  className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.description ? `— ${p.description}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  O usuário herdará rigorosamente todas as regras de visualização, cadastro, edição e exclusão configuradas neste perfil.
                </p>
              </div>

              {/* Contato: E-mail e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">E-mail</label>
                  <input
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>
              </div>

              {/* Arena Vinculada (se aplicável) e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Organizador / Arena Vinculada</label>
                  <select
                    value={formData.arenaId}
                    onChange={(e) => setFormData({ ...formData, arenaId: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  >
                    <option value="">Nenhuma (Acesso Global / Geral)</option>
                    {arenas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Status da Conta</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  >
                    <option value="ATIVO">🟢 Ativo (Acesso Liberado)</option>
                    <option value="INATIVO">🔴 Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {saving ? 'Salvando...' : editingUser ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
