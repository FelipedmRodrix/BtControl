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
  AlertCircle
} from 'lucide-react';
import { ConventionalTournamentData, EliminationMatchNode } from '@/lib/services/conventionalTournamentService';

interface WorldCupBracketProps {
  data: ConventionalTournamentData;
  onOpenScoreModal: (matchId: string, duo1Name: string, duo2Name: string, stage: string) => void;
  onGenerateElimination: () => void;
  canManage: boolean;
  loading?: boolean;
}

export function WorldCupBracket({
  data,
  onOpenScoreModal,
  onGenerateElimination,
  canManage,
  loading = false
}: WorldCupBracketProps) {
  const { eliminationStages, championDuo, byesInfo } = data;
  const [hoveredMatchSlot, setHoveredMatchSlot] = useState<string | null>(null);

  // Check if any elimination match exists or if they are still drafts
  const hasRealMatches = eliminationStages.some(st => 
    st.matches.some(m => !m.id.startsWith('draft-'))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Rules, Byes and Status */}
      <div className="bg-[#0b1329] border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-amber-400" /> Chave Eliminatória Oficial
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Chave de {byesInfo.bracketSize} · {byesInfo.totalClassified} Duplas Classificadas
              </span>
              {byesInfo.byesCount > 0 && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  {byesInfo.byesCount} {byesInfo.byesCount === 1 ? 'Vaga Direta (BYE)' : 'Vagas Diretas (BYE)'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Chaveamento Copa do Mundo · {data.categoryName}
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Estrutura horizontal em mata-mata com avanço automático. As duplas vencedoras avançam diretamente pelo chaveamento até a grande final com o troféu em disputa.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canManage && (
              <button
                type="button"
                onClick={onGenerateElimination}
                disabled={loading}
                className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/10 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{hasRealMatches ? 'Atualizar / Sincronizar Chave' : 'Gerar Chave Eliminatória'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Byes Explanation Pill Box */}
        {byesInfo.byesCount > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-amber-300">Duplas com Bye (Cabeças de Chave):</span>
            {byesInfo.byesDuos.map((b, idx) => (
              <div 
                key={b.duoId} 
                className="bg-[#090e1a] border border-amber-500/30 px-2.5 py-1 rounded-lg text-slate-200 text-[11px] flex items-center gap-1.5"
                title={b.reason}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="font-bold text-white">{b.duoName}</span>
                <span className="text-[10px] text-amber-400/80 font-mono">({b.reason.split('(')[0].trim()})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Champion Podium Spotlight if final is finished */}
      <AnimatePresence>
        {championDuo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border-2 border-amber-400/60 rounded-3xl p-6 text-center space-y-3 shadow-2xl shadow-amber-500/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40 text-slate-950">
              <Trophy className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 font-mono">
                GRANDE CAMPEÃ DO TORNEIO
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
                {championDuo.name}
              </h2>
              <p className="text-xs text-amber-200/80 font-medium mt-1">
                {championDuo.player1Name} &amp; {championDuo.player2Name} · Título Conquistado
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal World Cup Bracket Grid */}
      <div className="bg-[#070b16] border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-x-auto min-h-[580px]">
        <div className="inline-flex items-stretch gap-8 sm:gap-12 min-w-max pb-4 pt-2">
          {eliminationStages.map((stage, stageIdx) => {
            const isFinalStage = stage.stageKey === 'final';
            const totalMatchesInStage = stage.matches.length;

            return (
              <div 
                key={stage.stageKey} 
                className={`flex flex-col justify-around relative ${
                  isFinalStage ? 'w-[320px]' : 'w-[290px]'
                }`}
              >
                {/* Stage Header */}
                <div className="mb-6 text-center pb-2 border-b border-slate-800">
                  <div className="flex items-center justify-center gap-2">
                    {isFinalStage ? (
                      <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      isFinalStage ? 'text-amber-300 font-mono' : 'text-slate-300'
                    }`}>
                      {stage.stageName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {totalMatchesInStage} {totalMatchesInStage === 1 ? 'confronto' : 'confrontos'}
                  </span>
                </div>

                {/* Trophy Column in Center for Final */}
                {isFinalStage && (
                  <div className="my-auto py-4 text-center">
                    <div className="inline-flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 mb-3">
                      <Trophy className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-300/80 mt-1">
                        TAÇA DA VITÓRIA
                      </span>
                    </div>
                  </div>
                )}

                {/* Match Cards for this Stage */}
                <div className="flex flex-col justify-around flex-1 gap-6">
                  {stage.matches.map((node) => {
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
                        <div className={`rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                          isFinalStage 
                            ? 'bg-[#0f172a] border-amber-500/40 shadow-lg shadow-amber-500/5' 
                            : isFinished 
                              ? 'bg-[#0b1329] border-slate-700/80 shadow-md' 
                              : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                        }`}>
                          {/* Match Top Bar */}
                          <div className="px-3.5 py-1.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold text-slate-400">
                              {stage.stageKey === 'final' ? 'Grande Final' : `Jogo #${node.matchNumber}`}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                              {node.court && (
                                <span className="flex items-center gap-0.5 text-slate-500">
                                  <MapPin className="w-2.5 h-2.5" /> {node.court}
                                </span>
                              )}
                              {node.time && (
                                <span className="flex items-center gap-0.5 text-slate-500">
                                  <Clock className="w-2.5 h-2.5" /> {node.time}
                                </span>
                              )}
                              {isBye && (
                                <span className="text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.2 rounded">
                                  BYE
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Team 1 Row */}
                          <div className={`px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/60 transition ${
                            isDuo1Winner ? 'bg-emerald-950/20' : ''
                          }`}>
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {/* Team Avatar Initials */}
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isDuo1Winner 
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20' 
                                  : hasDuo1 
                                    ? 'bg-slate-800 text-slate-200' 
                                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                              }`}>
                                {hasDuo1 ? (
                                  isDuo1Winner ? <Check className="w-3.5 h-3.5" /> : node.duo1Name.charAt(0)
                                ) : '?'}
                              </div>

                              <div className="min-w-0">
                                <p className={`text-xs truncate ${
                                  hasDuo1 
                                    ? isDuo1Winner ? 'font-black text-emerald-300' : 'font-bold text-white' 
                                    : 'italic text-slate-500 font-normal'
                                }`}>
                                  {node.duo1Name}
                                </p>
                                {node.player1_A_Name && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {node.player1_A_Name} + {node.player2_A_Name}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Score or Bye Badge */}
                            <div className="shrink-0 text-right">
                              {isBye ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  Avança
                                </span>
                              ) : isFinished && node.score ? (
                                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                                  isDuo1Winner ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                                }`}>
                                  {node.score1 !== undefined ? node.score1 : (node.score.split(/[xX/-]/)[0]?.trim() || '-')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Team 2 Row */}
                          <div className={`px-3.5 py-2.5 flex items-center justify-between transition ${
                            isDuo2Winner ? 'bg-emerald-950/20' : ''
                          }`}>
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {/* Team Avatar Initials */}
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isDuo2Winner 
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20' 
                                  : hasDuo2 
                                    ? 'bg-slate-800 text-slate-200' 
                                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                              }`}>
                                {isBye ? '-' : hasDuo2 ? (
                                  isDuo2Winner ? <Check className="w-3.5 h-3.5" /> : node.duo2Name.charAt(0)
                                ) : '?'}
                              </div>

                              <div className="min-w-0">
                                <p className={`text-xs truncate ${
                                  isBye 
                                    ? 'text-slate-500 text-[11px] italic' 
                                    : hasDuo2 
                                      ? isDuo2Winner ? 'font-black text-emerald-300' : 'font-bold text-white' 
                                      : 'italic text-slate-500 font-normal'
                                }`}>
                                  {node.duo2Name}
                                </p>
                                {node.player1_B_Name && !isBye && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {node.player1_B_Name} + {node.player2_B_Name}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Score */}
                            <div className="shrink-0 text-right">
                              {!isBye && isFinished && node.score ? (
                                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                                  isDuo2Winner ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                                }`}>
                                  {node.score2 !== undefined ? node.score2 : (node.score.split(/[xX/-]/)[1]?.trim() || '-')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Match Action Footer */}
                          {!isBye && canManage && (
                            <div className="px-3.5 py-1.5 bg-slate-900/40 border-t border-slate-800/40 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {isFinished ? `Placar: ${node.score}` : 'Aguardando jogo'}
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
                                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                                >
                                  {isFinished ? 'Editar Placar' : 'Lançar Placar'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Visual Connector to Next Stage (Except Final) */}
                        {!isFinalStage && (
                          <div className="hidden lg:block absolute top-1/2 -right-8 sm:-right-12 w-8 sm:w-12 h-[2px] bg-slate-700/60 pointer-events-none group-hover:bg-amber-500/60 transition-colors" />
                        )}
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
