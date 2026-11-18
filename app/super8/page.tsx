import Link from 'next/link';
import { Calendar, ArrowRight, Trophy, Zap, Shield } from 'lucide-react';
import { ensureDbInitialized } from '@/lib/db/store';
import { super8ManagerService } from '@/lib/services/super8ManagerService';

export const dynamic = 'force-dynamic';

export default async function PublicSuper8DirectoryPage() {
  await ensureDbInitialized();
  const events = super8ManagerService.getAll();

  const formatStatusLabel = (status: string) => {
    if (status === 'INSCRICOES_ABERTAS') return 'Inscrições Abertas';
    if (status === 'EM_ANDAMENTO') return 'Em Andamento';
    return 'Finalizado';
  };

  const formatStatusClass = (status: string) => {
    if (status === 'INSCRICOES_ABERTAS') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'EM_ANDAMENTO') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-700 bg-slate-100 border-slate-200';
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Classificação Individual · Super 8
              </h1>
              <p className="text-xs text-slate-500">
                Escolha um campeonato abaixo para acompanhar pontuações, partidas e resultados ao vivo.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap self-start sm:self-auto"
          >
            Acessar Sistema
          </Link>
        </header>

        {events.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Nenhum Super 8 disponível no momento</h2>
            <p className="text-xs text-slate-500">
              Quando o organizador cadastrar um Super 8, ele aparecerá aqui para acompanhamento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(ev => (
              <Link
                key={ev.id}
                href={`/super8/${ev.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-400 transition flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="truncate">{ev.seriesName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.level}</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition truncate mt-0.5">
                        {ev.name}
                      </h2>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border whitespace-nowrap shrink-0 ${formatStatusClass(ev.status)}`}
                    >
                      {formatStatusLabel(ev.status)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.arenaName || 'Organizador'}</span>
                      {ev.venueName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{ev.venueName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {ev.startDate} até {ev.endDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 tabular-nums">
                    {ev.playedMatchesCount ?? 0}/{ev.matchesCount || 14} partidas concluídas
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    Ver Classificação
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
