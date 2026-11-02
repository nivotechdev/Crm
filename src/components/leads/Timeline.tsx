import { ArrowRight, Calculator, Flag, Phone, StickyNote, Trash2 } from 'lucide-react';
import type { Atividade } from '../../types';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { useToast } from '../../store/ToastContext';
import { useNow } from '../../store/NowContext';
import { etapaPorId } from '../../lib/etapas';
import { diffDiasCalendario, formatDiaSemana, formatHora } from '../../lib/dates';
import { MOTIVOS_PERDA, RESULTADOS } from '../../lib/labels';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { EmptyState } from '../ui/EmptyState';

const ICONES: Record<Atividade['tipo'], { Icone: (p: { className?: string }) => JSX.Element; cls: string; titulo: string }> = {
  ligacao: { Icone: (p) => <Phone {...p} />, cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300', titulo: 'Ligação' },
  whatsapp: { Icone: (p) => <WhatsAppIcon {...p} />, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300', titulo: 'WhatsApp' },
  nota: { Icone: (p) => <StickyNote {...p} />, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300', titulo: 'Anotação' },
  etapa: { Icone: (p) => <ArrowRight {...p} />, cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300', titulo: 'Mudança de etapa' },
  simulacao: { Icone: (p) => <Calculator {...p} />, cls: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300', titulo: 'Simulação (estimativa)' },
  sistema: { Icone: (p) => <Flag {...p} />, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', titulo: 'Sistema' },
};

function rotuloDia(iso: string, now: Date) {
  const d = diffDiasCalendario(iso, now);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  return formatDiaSemana(iso);
}

/** Linha do tempo completa do lead, agrupada por dia. */
export function Timeline({ atividades, motivoPerda }: { atividades: Atividade[]; motivoPerda?: string }) {
  const { config, excluirAtividade } = useData();
  const { confirmar } = useAcoes();
  const toast = useToast();
  const now = useNow();

  if (atividades.length === 0) return <EmptyState titulo="Sem histórico ainda" descricao="Registre uma ligação, WhatsApp ou anotação." />;

  const grupos: Array<{ dia: string; itens: Atividade[] }> = [];
  for (const a of atividades) {
    const dia = rotuloDia(a.criadoEm, now);
    const g = grupos[grupos.length - 1];
    if (g?.dia === dia) g.itens.push(a);
    else grupos.push({ dia, itens: [a] });
  }

  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <div key={g.dia}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.dia}</p>
          <ol className="relative space-y-3 border-l border-slate-200 pl-5 dark:border-slate-700">
            {g.itens.map((a) => {
              const meta = ICONES[a.tipo];
              const de = a.etapaDe ? etapaPorId(config, a.etapaDe)?.nome : undefined;
              const para = a.etapaPara ? etapaPorId(config, a.etapaPara) : undefined;
              const removivel = a.tipo === 'nota' || a.tipo === 'ligacao' || a.tipo === 'whatsapp';
              return (
                <li key={a.id} className="group relative">
                  <span className={cn('absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900', meta.cls)}>
                    <meta.Icone className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-100">
                        <span className="font-medium">
                          {a.tipo === 'etapa' ? (
                            <>
                              {de ?? '—'} <ArrowRight className="inline h-3 w-3" /> {para?.nome ?? '—'}
                            </>
                          ) : (
                            meta.titulo
                          )}
                        </span>
                        {a.resultado && (
                          <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {RESULTADOS[a.resultado]}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-slate-400">{formatHora(a.criadoEm)}</span>
                      </p>
                      {a.tipo === 'etapa' && para?.tipo === 'perdido' && motivoPerda && (
                        <p className="text-xs text-red-600 dark:text-red-400">Motivo: {MOTIVOS_PERDA[motivoPerda as keyof typeof MOTIVOS_PERDA]}</p>
                      )}
                      {a.observacao && <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{a.observacao}</p>}
                    </div>
                    {removivel && (
                      <button
                        aria-label="Excluir registro"
                        className="rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10"
                        onClick={async () => {
                          if (await confirmar({ titulo: 'Excluir este registro do histórico?', confirmarLabel: 'Excluir', perigo: true })) {
                            await excluirAtividade(a.id);
                            toast('Registro excluído', { tipo: 'info' });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
