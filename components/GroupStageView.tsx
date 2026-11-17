'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Award, 
  MapPin, 
  Clock, 
  Check, 
  Shield, 
  ArrowRight, 
  Layers, 
  Sparkles,
  Trophy,
  Crown,
  ChevronDown
} from 'lucide-react';
import { ConventionalTournamentData, GroupStanding } from '@/lib/services/conventionalTournamentService';

interface GroupStageViewProps {
  data: ConventionalTournamentData;
  onOpenScoreModal: (matchId: string, duo1Name: string, duo2Name: string, stage: string) => void;
  canManage: boolean;
}

export function GroupStageView({ data, onOpenScoreModal, canManage }: GroupStageViewProps) {
  const { groups, overallRankings, byesInfo } = data;
  const [activeGroupTab, setActiveGroupTab] = useState<string>(groups[0]?.name || 'ALL');
  const [showOverallRanking, setShowOverallRanking] = useState<boolean>(true);

  if (groups.length === 0) {
    return (
      <div className="p-12 text-center text-slate-600 border border-slate-200 bg-slate-50/70 rounded-2xl space-y-3">
        <Users className="w-10 h-10 text-slate-400 mx-auto" />
        <p className="font-semibold text-slate-800">Nenhum grupo gerado para esta categoria ainda.</p>
        <p className="text-xs text-slate-500">
          Utilize o botão &quot;Gerar Jogos Automaticamente&quot; para sortear as duplas e criar a tabela de jogos dos grupos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveGroupTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer whitespace-nowrap ${
              activeGroupTab === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todos os Grupos ({groups.length})
          </button>
          {groups.map(g => (
            <button
              key={g.name}
              type="button"
              onClick={() => setActiveGroupTab(g.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer whitespace-nowrap ${
                activeGroupTab === g.name
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {g.name} ({g.duos.length})
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowOverallRanking(!showOverallRanking)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
            showOverallRanking
              ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{showOverallRanking ? 'Ocultar Classificação Geral' : 'Classificação Geral & Byes'}</span>
        </button>
      </div>

      {/* Overall Ranking Section */}
      {showOverallRanking && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                Classificação Geral Comparada · Critérios de Cabeça de Chave &amp; Vagas Diretas (Byes)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparação entre os primeiros colocados de todos os grupos utilizando médias para equiparar grupos de tamanhos diferentes (3 vs 4 duplas).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                Chave de {byesInfo.bracketSize} · {byesInfo.byesCount} Byes
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3">Rank Geral</th>
                  <th className="p-3">Dupla</th>
                  <th className="p-3">Grupo</th>
                  <th className="p-3 text-center">Jogos</th>
                  <th className="p-3 text-center text-emerald-700">Vitórias</th>
                  <th className="p-3 text-center text-amber-700">Saldo Games</th>
                  <th className="p-3 text-center">Média Saldo/J</th>
                  <th className="p-3 text-center">Games Pró</th>
                  <th className="p-3 text-center text-emerald-700">Aprov. (%)</th>
                  <th className="p-3 text-right">Destino no Mata-Mata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono tabular-nums bg-white">
                {overallRankings.map((st, idx) => {
                  const isBye = byesInfo.byesDuos.some(b => b.duoId === st.duoId);

                  return (
                    <tr 
                      key={st.duoId} 
                      className={`hover:bg-slate-50/90 transition ${
                        isBye ? 'bg-amber-50/50' : st.qualified ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-sm text-slate-900">
                        {idx + 1}º
                      </td>
                      <td className="p-3 font-semibold text-slate-900 font-sans text-xs">
                        {st.duoName}
                      </td>
                      <td className="p-3 text-slate-500 font-sans text-xs">
                        {st.groupName} ({st.rank}º do grupo)
                      </td>
                      <td className="p-3 text-center text-slate-700">{st.played}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{st.wins}</td>
                      <td className="p-3 text-center font-bold text-amber-700">
                        {st.gameDiff > 0 ? `+${st.gameDiff}` : st.gameDiff}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {st.avgGameDiff !== undefined && st.avgGameDiff > 0 ? `+${st.avgGameDiff}` : st.avgGameDiff}
                      </td>
                      <td className="p-3 text-center text-slate-600">{st.gamesFor}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{st.winRate}%</td>
                      <td className="p-3 text-right font-sans">
                        {isBye ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Vaga Direta (BYE)
                          </span>
                        ) : st.qualified ? (
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Classificado ({byesInfo.bracketSize === 16 ? 'Oitavas' : 'Quartas'})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Fase de Grupos
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Groups Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups
          .filter(g => activeGroupTab === 'ALL' || g.name === activeGroupTab)
          .map(group => (
            <div 
              key={group.name} 
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {group.name.replace('Grupo ', '')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{group.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {group.duos.length} Duplas · 2 primeiras avançam
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono tabular-nums font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {group.matches.filter(m => m.status === 'FINALIZADA' || m.status === 'WO').length} / {group.matches.length} Jogos Realizados
                </span>
              </div>

              {/* Standings Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[9px] tracking-wider border-b border-slate-200">
                      <th className="p-2.5">Pos</th>
                      <th className="p-2.5">Dupla</th>
                      <th className="p-2.5 text-center">J</th>
                      <th className="p-2.5 text-center text-emerald-700">V</th>
                      <th className="p-2.5 text-center text-rose-700">D</th>
                      <th className="p-2.5 text-center text-amber-700">SG</th>
                      <th className="p-2.5 text-center">GP</th>
                      <th className="p-2.5 text-center text-emerald-700">%</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 font-mono tabular-nums text-[11px] bg-white">
                    {group.standings.map((st) => (
                      <tr key={st.duoId} className={`hover:bg-slate-50 transition ${
                        st.qualified ? 'bg-emerald-50/40' : ''
                      }`}>
                        <td className="p-2.5 font-bold text-xs text-slate-800">
                          {st.rank === 1 ? '🥇 1º' : st.rank === 2 ? '🥈 2º' : `${st.rank}º`}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 font-sans text-xs">
                          {st.duoName}
                        </td>
                        <td className="p-2.5 text-center text-slate-700">{st.played}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{st.wins}</td>
                        <td className="p-2.5 text-center text-slate-500">{st.losses}</td>
                        <td className="p-2.5 text-center font-bold text-amber-700">
                          {st.gameDiff > 0 ? `+${st.gameDiff}` : st.gameDiff}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">{st.gamesFor}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{st.winRate}%</td>
                        <td className="p-2.5 text-right font-sans">
                          {st.qualified ? (
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Classifica
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Group Matches Mini-List */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Jogos do {group.name}:
                </span>
                <div className="space-y-1.5">
                  {group.matches.map(m => {
                    const d1 = group.duos.find(d => d.id === m.duo1Id)?.name || 'Dupla 1';
                    const d2 = group.duos.find(d => d.id === m.duo2Id)?.name || 'Dupla 2';
                    const isFinished = m.status === 'FINALIZADA' || m.status === 'WO';

                    return (
                      <div 
                        key={m.id} 
                        className="bg-slate-50/70 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-[11px] truncate">
                            {d1} <span className="text-amber-600 font-bold mx-1">x</span> {d2}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">
                            {m.court && <span>{m.court}</span>}
                            {m.time && <span>@ {m.time}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isFinished ? (
                            <span className="text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.score || 'Final'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500">
                              Pendente
                            </span>
                          )}

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onOpenScoreModal(m.id, d1, d2, group.name)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              {isFinished ? 'Alterar' : 'Placar'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
