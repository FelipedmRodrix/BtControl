'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Crown, 
  Calendar, 
  Clock, 
  MapPin, 
  Check, 
  Sparkles, 
  ChevronRight,
  Shield,
  Layers,
  Award,
  AlertCircle,
  GitFork,
  ArrowRight,
  RefreshCw,
  Flame,
  Users
} from 'lucide-react';
import { ConventionalTournamentData, EliminationMatchNode } from '@/lib/services/conventionalTournamentService';

interface TournamentTreeBracketProps {
  data: ConventionalTournamentData;
  onOpenScoreModal: (matchId: string, duo1Name: string, duo2Name: string, stage: string) => void;
  onGenerateElimination: () => void;
  canManage: boolean;
  loading?: boolean;
}

export function TournamentTreeBracket({
  data,
  onOpenScoreModal,
  onGenerateElimination,
  canManage,
  loading = false
}: TournamentTreeBracketProps) {
  const { eliminationStages, championDuo, byesInfo } = data;
  const [hoveredMatchSlot, setHoveredMatchSlot] = useState<string | null>(null);

  // Check if matches are real or draft predictions
  const hasRealMatches = eliminationStages.some(st => 
    st.matches.some(m => !m.id.startsWith('draft-'))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner: Mata-Mata Info & Byes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" /> Árvore Oficial do Mata-Mata
              </span>
              <span className="text-xs text-slate-700 font-mono tabular-nums bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Chave de {byesInfo.bracketSize} · {byesInfo.totalClassified} Duplas Classificadas
              </span>
              {byesInfo.byesCount > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  {byesInfo.byesCount} {byesInfo.byesCount === 1 ? 'Vaga Direta (BYE)' : 'Vagas Diretas (BYE)'}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Árvore Eliminatória · {data.categoryName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Visualização em árvore de torneio estilo Copa do Mundo e Grand Slam. O Super 8 e as fases de grupos não entram nesta chave: apenas os confrontos eliminatórios diretos até o título.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canManage && (
              <button
                type="button"
                onClick={onGenerateElimination}
                disabled={loading}
                className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{hasRealMatches ? 'Sincronizar / Atualizar Árvore' : 'Gerar Chave Eliminatória'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Byes Explanation Card */}
        {byesInfo.byesCount > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" /> Duplas com Vaga Direta (BYE):
            </span>
            {byesInfo.byesDuos.map((b) => (
              <div 
                key={b.duoId} 
                className="bg-amber-50/70 border border-amber-200 px-3 py-1 rounded-xl text-slate-800 text-xs flex items-center gap-2"
                title={b.reason}
              >
                <span className="font-bold text-slate-900">{b.duoName}</span>
                <span className="text-[10px] text-amber-700 font-mono">({b.reason.split('(')[0].trim()})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Champion Podium Spotlight */}
      <AnimatePresence>
        {championDuo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-7 text-center space-y-3.5 shadow-sm relative overflow-hidden"
          >
            <div className="w-16 h-16 mx-auto bg-amber-500 rounded-2xl flex items-center justify-center shadow-md text-white">
              <Trophy className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 font-mono bg-white border border-amber-300 px-3 py-1 rounded-full inline-block">
                🏆 GRANDE DUPLA CAMPEÃ DO TORNEIO
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {championDuo.name}
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1">
                {championDuo.player1Name} &amp; {championDuo.player2Name} · Título Conquistado
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tournament Tree Bracket with Branches */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-xs overflow-x-auto min-h-[620px] select-none">
        
        {/* Tree Stage Columns */}
        <div className="inline-flex items-stretch gap-10 sm:gap-14 min-w-max pb-6 pt-2">
          {eliminationStages.map((stage) => {
            const isFinalStage = stage.stageKey === 'final';
            const totalMatchesInStage = stage.matches.length;

            return (
              <div 
                key={stage.stageKey} 
                className={`flex flex-col justify-around relative ${
                  isFinalStage ? 'w-[330px]' : 'w-[295px]'
                }`}
              >
                {/* Stage Header */}
                <div className="mb-6 text-center pb-2.5 border-b border-slate-200">
                  <div className="flex items-center justify-center gap-2">
                    {isFinalStage ? (
                      <Trophy className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isFinalStage ? 'text-amber-700 font-mono' : 'text-slate-700'
                    }`}>
                      {stage.stageName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    {totalMatchesInStage} {totalMatchesInStage === 1 ? 'confronto decisivo' : 'confrontos'}
                  </span>
                </div>

                {/* Trophy Spotlight Column for Final */}
                {isFinalStage && (
                  <div className="my-auto py-4 text-center">
                    <div className="inline-flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 border border-amber-200 mb-3 shadow-xs">
                      <Trophy className="w-12 h-12 text-amber-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800 mt-1">
                        TAÇA DA VITÓRIA
                      </span>
                    </div>
                  </div>
                )}

                {/* Match Cards & Tree Connectors */}
                <div className="flex flex-col justify-around flex-1 gap-7">
                  {stage.matches.map((node, matchIndex) => {
                    const isDraft = node.id.startsWith('draft-');
                    const isFinished = node.status === 'FINALIZADA' || node.status === 'WO' || node.status === 'BYE';
                    const hasDuo1 = !!node.duo1Id;
                    const hasDuo2 = !!node.duo2Id;
                    const isBye = node.isBye;

                    const isDuo1Winner = isFinished && node.winnerDuoId && node.winnerDuoId === node.duo1Id;
                    const isDuo2Winner = isFinished && node.winnerDuoId && node.winnerDuoId === node.duo2Id;

                    return (
                      <div 
                        key={node.bracketSlot} 
                        className="relative group"
                        onMouseEnter={() => setHoveredMatchSlot(node.bracketSlot)}
                        onMouseLeave={() => setHoveredMatchSlot(null)}
                      >
                        {/* Tree Branch Connector */}
                        {!isFinalStage && (
                          <div className="hidden lg:block absolute top-1/2 -right-10 sm:-right-14 w-10 sm:w-14 pointer-events-none">
                            <div className="h-[2px] w-full bg-slate-300 group-hover:bg-amber-500 transition-colors" />
                            
                            {totalMatchesInStage > 1 && matchIndex % 2 === 0 && (
                              <div className="absolute right-0 top-0 w-[2px] h-20 bg-slate-300 group-hover:bg-amber-500 transition-colors origin-top" />
                            )}
                            {totalMatchesInStage > 1 && matchIndex % 2 === 1 && (
                              <div className="absolute right-0 bottom-0 w-[2px] h-20 bg-slate-300 group-hover:bg-amber-500 transition-colors origin-bottom" />
                            )}
                          </div>
                        )}

                        {/* Match Node Card */}
                        <div className={`rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-xs ${
                          isFinalStage 
                            ? 'bg-white border-amber-300 shadow-sm hover:border-amber-400' 
                            : isFinished 
                              ? 'bg-white border-slate-300 hover:border-slate-400' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}>
                          {/* Card Header */}
                          <div className={`px-3.5 py-1.5 border-b flex items-center justify-between text-[10px] ${
                            isFinalStage ? 'bg-amber-50/70 border-amber-200/80' : 'bg-slate-50 border-slate-200/80'
                          }`}>
                            <span className="font-mono font-bold text-slate-600 flex items-center gap-1.5">
                              {stage.stageKey === 'final' ? 'Grande Final' : `Jogo #${node.matchNumber}`}
                            </span>

                            <div className="flex items-center gap-2 text-slate-500 font-mono tabular-nums">
                              {node.court && (
                                <span className="flex items-center gap-0.5 text-slate-600">
                                  <MapPin className="w-2.5 h-2.5" /> {node.court}
                                </span>
                              )}
                              {node.time && (
                                <span className="flex items-center gap-0.5 text-slate-600">
                                  <Clock className="w-2.5 h-2.5" /> {node.time}
                                </span>
                              )}
                              {isBye && (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  BYE
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Team A Row */}
                          <div className={`px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/70 transition ${
                            isDuo1Winner ? 'bg-emerald-50/60' : ''
                          }`}>
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isDuo1Winner 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : hasDuo1 
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}>
                                {hasDuo1 ? (
                                  isDuo1Winner ? <Check className="w-3.5 h-3.5" /> : node.duo1Name.charAt(0)
                                ) : '?'}
                              </div>

                              <div className="min-w-0">
                                <p className={`text-xs truncate ${
                                  hasDuo1 
                                    ? isDuo1Winner ? 'font-bold text-emerald-800' : 'font-semibold text-slate-900' 
                                    : 'italic text-slate-400 font-normal'
                                }`}>
                                  {node.duo1Name}
                                </p>
                                {node.player1_A_Name && (
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {node.player1_A_Name} + {node.player2_A_Name}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Score A */}
                            <div className="shrink-0 text-right">
                              {isFinished && node.score ? (
                                <span className={`text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded ${
                                  isDuo1Winner ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'
                                }`}>
                                  {node.score1 !== undefined ? node.score1 : (node.score.split(/[xX/-]/)[0]?.trim() || '-')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Team B Row */}
                          <div className={`px-3.5 py-2.5 flex items-center justify-between transition ${
                            isDuo2Winner ? 'bg-emerald-50/60' : ''
                          }`}>
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isDuo2Winner 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : isBye 
                                    ? 'bg-slate-50 text-slate-400 border border-slate-200' 
                                    : hasDuo2 
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                      : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}>
                                {isBye ? (
                                  <Shield className="w-3 h-3 text-slate-400" />
                                ) : hasDuo2 ? (
                                  isDuo2Winner ? <Check className="w-3.5 h-3.5" /> : node.duo2Name.charAt(0)
                                ) : '?'}
                              </div>

                              <div className="min-w-0">
                                <p className={`text-xs truncate ${
                                  isBye 
                                    ? 'text-slate-400 text-[11px] italic' 
                                    : hasDuo2 
                                      ? isDuo2Winner ? 'font-bold text-emerald-800' : 'font-semibold text-slate-900' 
                                      : 'italic text-slate-400 font-normal'
                                }`}>
                                  {node.duo2Name}
                                </p>
                                {node.player1_B_Name && !isBye && (
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {node.player1_B_Name} + {node.player2_B_Name}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Score B */}
                            <div className="shrink-0 text-right">
                              {!isBye && isFinished && node.score ? (
                                <span className={`text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded ${
                                  isDuo2Winner ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'
                                }`}>
                                  {node.score2 !== undefined ? node.score2 : (node.score.split(/[xX/-]/)[1]?.trim() || '-')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Match Action Footer */}
                          {!isBye && canManage && (
                            <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                              <span className="text-slate-500">
                                {isFinished ? `Resultado: ${node.score}` : 'Aguardando jogo'}
                              </span>

                              {!isDraft && (
                                <button
                                  type="button"
                                  onClick={() => onOpenScoreModal(
                                    node.id, 
                                    node.duo1Name, 
                                    node.duo2Name, 
                                    node.stage
                                  )}
                                  className="font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer active:scale-95 transition"
                                >
                                  {isFinished ? 'Editar Placar' : 'Lançar Placar'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
