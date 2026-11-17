import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Profile, ScreenPermission, SystemScreen, ALL_SYSTEM_SCREENS } from '@/lib/types/permissions';

interface ProfilesManagerProps {
  profiles: Profile[];
  onReload: () => void;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  requestConfirmation: (title: string, msg: string, onConfirm: () => void, confirmLabel?: string) => void;
  sessionRole?: string;
  userId?: string;
}

export function ProfilesManager({
  profiles,
  onReload,
  showSuccess,
  showError,
  requestConfirmation,
  sessionRole,
  userId
}: ProfilesManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: ScreenPermission[];
  }>({
    name: '',
    description: '',
    permissions: ALL_SYSTEM_SCREENS.map(s => ({
      screen: s.id,
      view: false,
      create: false,
      edit: false,
      delete: false
    }))
  });

  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      description: '',
      permissions: ALL_SYSTEM_SCREENS.map(s => ({
        screen: s.id,
        view: false,
        create: false,
        edit: false,
        delete: false
      }))
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: Profile) => {
    setEditingProfile(profile);
    const existingMap = new Map<SystemScreen, ScreenPermission>();
    profile.permissions.forEach(p => existingMap.set(p.screen, p));

    setFormData({
      name: profile.name,
      description: profile.description || '',
      permissions: ALL_SYSTEM_SCREENS.map(s => {
        const p = existingMap.get(s.id);
        return {
          screen: s.id,
          view: p ? !!p.view : false,
          create: p ? !!p.create : false,
          edit: p ? !!p.edit : false,
          delete: p ? !!p.delete : false,
        };
      })
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (screenId: SystemScreen, action: 'view' | 'create' | 'edit' | 'delete') => {
    setFormData(prev => {
      const nextPerms = prev.permissions.map(p => {
        if (p.screen !== screenId) return p;
        const currentVal = p[action];
        const nextVal = !currentVal;

        // Se desativar 'view', também desativa create, edit e delete
        if (action === 'view' && !nextVal) {
          return { ...p, view: false, create: false, edit: false, delete: false };
        }
        // Se ativar create, edit ou delete, automaticamente ativa 'view'
        if ((action === 'create' || action === 'edit' || action === 'delete') && nextVal) {
          return { ...p, [action]: true, view: true };
        }

        return { ...p, [action]: nextVal };
      });
      return { ...prev, permissions: nextPerms };
    });
  };

  const handleToggleAllForScreen = (screenId: SystemScreen, enable: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => {
        if (p.screen !== screenId) return p;
        return {
          screen: screenId,
          view: enable,
          create: enable,
          edit: enable,
          delete: enable
        };
      })
    }));
  };

  const handleGrantFullAccess = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ALL_SYSTEM_SCREENS.map(s => ({
        screen: s.id,
        view: true,
        create: true,
        edit: true,
        delete: true
      }))
    }));
  };

  const handleClearAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ALL_SYSTEM_SCREENS.map(s => ({
        screen: s.id,
        view: false,
        create: false,
        edit: false,
        delete: false
      }))
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('O nome do perfil é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      const url = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
      const method = editingProfile ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': sessionRole || '',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar perfil.');
      }

      showSuccess(editingProfile ? 'Perfil de acesso atualizado!' : 'Novo perfil criado com sucesso!');
      setIsModalOpen(false);
      onReload();
    } catch (err: any) {
      showError(err.message || 'Erro ao processar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (profile: Profile) => {
    if (profile.isSystem) {
      showError('Perfis padrão do sistema não podem ser excluídos.');
      return;
    }

    requestConfirmation(
      'Excluir Perfil de Acesso',
      `Deseja realmente excluir permanentemente o perfil "${profile.name}"? Usuários associados a este perfil perderão essas permissões.`,
      async () => {
        try {
          const res = await fetch(`/api/profiles/${profile.id}`, {
            method: 'DELETE',
            headers: {
              'x-user-role': sessionRole || '',
              'x-user-id': userId || ''
            }
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir perfil.');
          }

          showSuccess('Perfil excluído com sucesso.');
          onReload();
        } catch (err: any) {
          showError(err.message || 'Erro ao excluir perfil.');
        }
      },
      'Sim, Excluir Perfil'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com CTA de novo perfil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Controle de Permissões (RBAC)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-600" /> Perfis de Acesso
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Crie perfis customizados e configure através de flags quais telas e ações cada usuário poderá <strong>Visualizar</strong>, <strong>Cadastrar</strong>, <strong>Editar</strong> ou <strong>Excluir</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Novo Perfil de Acesso
        </button>
      </div>

      {/* Grid de Perfis Existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(profile => {
          const allowedScreensCount = profile.permissions.filter(p => p.view).length;
          const writeCount = profile.permissions.filter(p => p.create || p.edit || p.delete).length;

          return (
            <div 
              key={profile.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition shadow-xs relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{profile.name}</h3>
                      {profile.isSystem && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Perfil do Sistema
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(profile)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                      title="Editar permissões do perfil"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!profile.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDelete(profile)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                        title="Excluir perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed min-h-[36px]">
                  {profile.description || 'Sem descrição cadastrada.'}
                </p>

                {/* Resumo de Permissões */}
                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Visualização</span>
                    <strong className="text-emerald-700 font-mono tabular-nums">{allowedScreensCount} / {ALL_SYSTEM_SCREENS.length} telas</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Edição / Ações</span>
                    <strong className="text-amber-700 font-mono tabular-nums">{writeCount} telas</strong>
                  </div>
                </div>

                {/* Tags de telas permitidas */}
                <div className="mt-3 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {profile.permissions
                    .filter(p => p.view)
                    .map(p => {
                      const screenInfo = ALL_SYSTEM_SCREENS.find(s => s.id === p.screen);
                      return (
                        <span 
                          key={p.screen}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          {screenInfo?.label || p.screen}
                        </span>
                      );
                    })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono tabular-nums">
                <span>Criado: {new Date(profile.createdAt).toLocaleDateString('pt-BR')}</span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(profile)}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Configurar Flags →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Perfil e Matriz de Flags */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {editingProfile ? `Editar Perfil: ${editingProfile.name}` : 'Cadastrar Novo Perfil de Acesso'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Defina o nome do perfil e selecione as permissões exatas para cada módulo.
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

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Nome do Perfil *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Organizador, Mesário, Financeiro..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 font-semibold">Descrição do Perfil</label>
                  <input
                    type="text"
                    placeholder="Ex: Permissão para gerenciar jogos e lançar placares"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 text-xs"
                  />
                </div>
              </div>

              {/* Ações rápidas de matriz */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-slate-700">
                    Matriz de Flags por Tela (Visualizar, Cadastrar, Editar, Excluir)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGrantFullAccess}
                    className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition cursor-pointer"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-[10px] font-bold transition cursor-pointer"
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              {/* Tabela de Matriz de Permissões */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Tela / Funcionalidade</th>
                      <th className="py-3 px-3 text-center">Visualizar</th>
                      <th className="py-3 px-3 text-center">Cadastrar</th>
                      <th className="py-3 px-3 text-center">Editar</th>
                      <th className="py-3 px-3 text-center">Excluir</th>
                      <th className="py-3 px-3 text-center">Atalho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {ALL_SYSTEM_SCREENS.map(screen => {
                      const perm = formData.permissions.find(p => p.screen === screen.id) || {
                        screen: screen.id,
                        view: false,
                        create: false,
                        edit: false,
                        delete: false
                      };
                      const allChecked = perm.view && perm.create && perm.edit && perm.delete;

                      return (
                        <tr key={screen.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-4">
                            <strong className="text-slate-900 block font-semibold text-xs">{screen.label}</strong>
                            <span className="text-[10px] text-slate-500 font-normal">{screen.description}</span>
                          </td>

                          {/* Flag Visualizar */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.view}
                              onChange={() => handleTogglePermission(screen.id, 'view')}
                              className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              title="Permite visualizar a tela e seus dados"
                            />
                          </td>

                          {/* Flag Cadastrar */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.create}
                              onChange={() => handleTogglePermission(screen.id, 'create')}
                              className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              title="Permite criar novos registros nesta funcionalidade"
                            />
                          </td>

                          {/* Flag Editar */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.edit}
                              onChange={() => handleTogglePermission(screen.id, 'edit')}
                              className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              title="Permite editar dados e configurações"
                            />
                          </td>

                          {/* Flag Excluir */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.delete}
                              onChange={() => handleTogglePermission(screen.id, 'delete')}
                              className="w-4 h-4 accent-rose-600 cursor-pointer"
                              title="Permite excluir dados permanentemente"
                            />
                          </td>

                          {/* Atalho para toda a linha */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAllForScreen(screen.id, !allChecked)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                                allChecked 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                            >
                              {allChecked ? 'Limpar' : 'Todos'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
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
                  {saving ? 'Salvando...' : editingProfile ? 'Salvar Alterações' : 'Criar Perfil de Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
