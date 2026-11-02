import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Lead, Tarefa } from '../../types';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { corEtapa, etapaPorId } from '../../lib/etapas';
import { formatBRLCompacto, formatTelefone } from '../../lib/format';
import { OBJETIVOS } from '../../lib/labels';
import { linkTelefone } from '../../lib/whatsapp';
import { cn } from '../../lib/cn';
import { ContactStripe, LastContactBadge } from './LastContactBadge';
import { ProximoPassoBadge, TemperaturaBadge } from './Badges';
import { QuickContactButtons } from './QuickContactButtons';

/** Seletor de etapa compacto (1 clique para mudar). */
export function EtapaSelect({ lead, className }: { lead: Lead; className?: string }) {
  const { config } = useData();
  const { pedirMoverEtapa } = useAcoes();
  const c = corEtapa(etapaPorId(config, lead.etapaId));
  return (
    <select
      aria-label="Etapa do funil"
      value={lead.etapaId}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => pedirMoverEtapa(lead, e.target.value)}
      className={cn(
        'h-7 max-w-full cursor-pointer appearance-none truncate rounded-md border-0 py-0 pl-2 pr-6 text-xs font-medium focus:ring-2 focus:ring-brand-500',
        'select-chevron',
        c.chip,
        className,
      )}
    >
      {config.etapas.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nome}
        </option>
      ))}
    </select>
  );
}

interface Props {
  lead: Lead;
  proxima?: Tarefa;
  selecionado: boolean;
  focado: boolean;
  onSelecionar: (id: string) => void;
  onFocar: () => void;
}

/** Linha de lead para desktop (md+). */
export const LeadRow = memo(function LeadRow({ lead, proxima, selecionado, focado, onSelecionar, onFocar }: Props) {
  return (
    <div
      role="listitem"
      data-lead-id={lead.id}
      onMouseDown={onFocar}
      className={cn(
        'group relative grid grid-cols-[28px_minmax(180px,1.6fr)_minmax(110px,0.9fr)_150px_minmax(150px,1fr)_auto] items-center gap-3 border-b border-slate-100 py-2.5 pl-5 pr-3 transition-colors dark:border-slate-800',
        focado ? 'bg-brand-50/70 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
        selecionado && 'bg-brand-50 dark:bg-brand-500/15',
      )}
    >
      <ContactStripe ultimoContatoEm={lead.ultimoContatoEm} />
      <input
        type="checkbox"
        aria-label={`Selecionar ${lead.nome}`}
        checked={selecionado}
        onChange={() => onSelecionar(lead.id)}
        className="h-4 w-4 accent-brand-600"
      />
      <div className="min-w-0">
        <Link to={`/leads/${lead.id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
          {lead.nome}
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <a href={linkTelefone(lead.telefone)} className="tabular-nums hover:underline" onClick={(e) => e.stopPropagation()}>
            {formatTelefone(lead.telefone)}
          </a>
          {lead.cidade && <span className="truncate">· {lead.cidade}</span>}
        </div>
      </div>
      <div className="min-w-0 text-sm">
        <p className="truncate font-medium text-slate-800 dark:text-slate-200">{formatBRLCompacto(lead.valorCarta)}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{lead.objetivo ? OBJETIVOS[lead.objetivo] : '—'}</p>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <EtapaSelect lead={lead} />
        <TemperaturaBadge temperatura={lead.temperatura} />
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} />
        <ProximoPassoBadge tarefa={proxima} />
      </div>
      <QuickContactButtons lead={lead} />
    </div>
  );
});

/** Card de lead para celular. */
export const LeadCardMobile = memo(function LeadCardMobile({ lead, proxima, selecionado, onSelecionar, modoSelecao }: Props & { modoSelecao: boolean }) {
  return (
    <div
      role="listitem"
      className={cn(
        'relative overflow-hidden rounded-xl bg-white py-3 pl-4 pr-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800',
        selecionado && 'ring-2 ring-brand-500',
      )}
    >
      <ContactStripe ultimoContatoEm={lead.ultimoContatoEm} />
      <div className="flex items-start gap-3">
        {modoSelecao && (
          <input
            type="checkbox"
            aria-label={`Selecionar ${lead.nome}`}
            checked={selecionado}
            onChange={() => onSelecionar(lead.id)}
            className="mt-1 h-5 w-5 accent-brand-600"
          />
        )}
        <Link to={`/leads/${lead.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{lead.nome}</p>
            <TemperaturaBadge temperatura={lead.temperatura} soIcone />
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.objetivo ? OBJETIVOS[lead.objetivo] : 'Objetivo —'} · {formatBRLCompacto(lead.valorCarta)}
            {lead.cidade && ` · ${lead.cidade}`}
          </p>
        </Link>
        <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <EtapaSelect lead={lead} />
          <ProximoPassoBadge tarefa={proxima} />
        </div>
        <QuickContactButtons lead={lead} />
      </div>
    </div>
  );
});
