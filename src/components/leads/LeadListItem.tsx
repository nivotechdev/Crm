import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { Lead, Tarefa } from '../../types';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { corEtapa, etapaPorId } from '../../lib/etapas';
import { formatBRLCompacto } from '../../lib/format';
import { OBJETIVOS } from '../../lib/labels';
import { cn } from '../../lib/cn';
import { ContactStripe, LastContactBadge } from './LastContactBadge';
import { ProximoPassoBadge, TemperaturaBadge } from './Badges';
import { QuickContactButtons } from './QuickContactButtons';

/** Seletor de etapa discreto: ponto colorido + nome (1 clique para mudar). */
export function EtapaSelect({ lead, className }: { lead: Lead; className?: string }) {
  const { config } = useData();
  const { pedirMoverEtapa } = useAcoes();
  const cor = corEtapa(etapaPorId(config, lead.etapaId));
  return (
    <span className={cn('relative inline-flex max-w-full items-center', className)}>
      <span aria-hidden className={cn('pointer-events-none absolute left-2.5 h-2 w-2 rounded-full', cor.dot)} />
      <select
        aria-label="Etapa do funil"
        value={lead.etapaId}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => pedirMoverEtapa(lead, e.target.value)}
        className="select-chevron h-7 max-w-full cursor-pointer truncate rounded-full border-0 bg-slate-100 py-0 pl-6 pr-6 text-[11px] font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {config.etapas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </select>
    </span>
  );
}

interface Props {
  lead: Lead;
  proxima?: Tarefa;
  selecionado: boolean;
  focado: boolean;
  modoSelecao: boolean;
  onSelecionar: (id: string) => void;
  onFocar: () => void;
}

/** Card de lead (grade: 2 colunas no celular, até 5 no desktop). */
export const LeadCard = memo(function LeadCard({ lead, proxima, selecionado, focado, modoSelecao, onSelecionar, onFocar }: Props) {
  return (
    <article
      role="listitem"
      data-lead-id={lead.id}
      onMouseDown={onFocar}
      className={cn(
        'group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white transition-all dark:bg-slate-900',
        selecionado
          ? 'border-brand-500 ring-2 ring-brand-500/20'
          : focado
            ? 'border-slate-300 shadow-lift dark:border-slate-600'
            : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lift dark:border-slate-800 dark:hover:border-slate-700',
      )}
    >
      <ContactStripe ultimoContatoEm={lead.ultimoContatoEm} />

      {modoSelecao && (
        <button
          type="button"
          aria-label={selecionado ? `Desmarcar ${lead.nome}` : `Selecionar ${lead.nome}`}
          aria-pressed={selecionado}
          onClick={() => onSelecionar(lead.id)}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
            selecionado ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900',
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      )}

      <Link
        to={`/leads/${lead.id}`}
        onClick={(e) => {
          if (modoSelecao) {
            e.preventDefault();
            onSelecionar(lead.id);
          }
        }}
        className="flex flex-1 flex-col gap-2.5 py-3.5 pl-4 pr-3 focus-visible:outline-none sm:pl-[18px]"
      >
        <div className={cn('min-w-0', modoSelecao && 'pr-6')}>
          <div className="flex items-center gap-1.5">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
              {lead.nome}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.objetivo ? OBJETIVOS[lead.objetivo].split('/')[0] : 'Sem objetivo'}
            {lead.cidade && <span className="hidden sm:inline"> · {lead.cidade}</span>}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="num text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">{formatBRLCompacto(lead.valorCarta)}</span>
          <TemperaturaBadge temperatura={lead.temperatura} soIcone />
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto />
          <ProximoPassoBadge tarefa={proxima} />
        </div>
      </Link>

      <div className="flex flex-col gap-2 border-t border-slate-100 py-2.5 pl-4 pr-3 dark:border-slate-800 sm:pl-[18px]">
        <EtapaSelect lead={lead} />
        <QuickContactButtons lead={lead} tamanho="sm" bloco />
      </div>
    </article>
  );
});
