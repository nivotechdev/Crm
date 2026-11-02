import { Link } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import type { Lead, Tarefa } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { useNow } from '../../store/NowContext';
import { diffDiasCalendario, formatData, formatHora, tempoRelativoAgenda } from '../../lib/dates';
import { TIPOS_TAREFA } from '../../lib/labels';
import { cn } from '../../lib/cn';
import { LastContactBadge, ContactStripe } from '../leads/LastContactBadge';
import { QuickContactButtons } from '../leads/QuickContactButtons';

/** Item de agenda com check rápido para concluir. */
export function TaskItem({ tarefa, lead, onExcluir, mostrarData = true }: { tarefa: Tarefa; lead?: Lead; onExcluir?: () => void; mostrarData?: boolean }) {
  const { alternarTarefa } = useData();
  const toast = useToast();
  const now = useNow();
  const dias = diffDiasCalendario(tarefa.dataHora, now);
  const atrasada = !tarefa.concluida && dias > 0;

  const alternar = async () => {
    const nova = !tarefa.concluida;
    await alternarTarefa(tarefa.id, nova);
    if (nova) toast('Concluída ✓', { acao: { label: 'Desfazer', onClick: () => alternarTarefa(tarefa.id, false) } });
  };

  return (
    <li className={cn('group relative flex items-center gap-3 py-2.5 pl-4 pr-2 sm:pr-3', tarefa.concluida && 'opacity-60')}>
      {lead && <ContactStripe ultimoContatoEm={lead.ultimoContatoEm} className="w-1" />}
      <button
        onClick={alternar}
        aria-label={tarefa.concluida ? 'Marcar como pendente' : 'Concluir'}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 transition-colors',
          tarefa.concluida
            ? 'bg-emerald-500 text-white ring-emerald-500'
            : 'text-transparent ring-slate-300 hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-500 dark:ring-slate-600 dark:hover:bg-emerald-500/10',
        )}
      >
        <Check className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium text-slate-900 dark:text-white', tarefa.concluida && 'line-through')}>
          {lead ? (
            <Link to={`/leads/${lead.id}`} className="hover:text-brand-700 dark:hover:text-brand-300">
              {lead.nome}
            </Link>
          ) : (
            tarefa.titulo
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          {lead && <span className="truncate">{tarefa.titulo}</span>}
          <span className="rounded bg-slate-100 px-1 text-[10px] font-semibold uppercase text-slate-500 dark:bg-slate-800">{TIPOS_TAREFA[tarefa.tipo]}</span>
          <span className={cn(atrasada && 'font-semibold text-red-600 dark:text-red-400')}>
            {mostrarData && `${tempoRelativoAgenda(tarefa.dataHora, now)}`}
            {mostrarData && dias !== 0 && ` (${formatData(tarefa.dataHora, { ano: false })})`}
            {!tarefa.diaInteiro && `${mostrarData ? ' · ' : ''}${formatHora(tarefa.dataHora)}`}
          </span>
          {lead && <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto className="sm:hidden" />}
        </p>
      </div>
      {lead && <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto className="hidden sm:inline-flex" />}
      {lead && !tarefa.concluida && <QuickContactButtons lead={lead} tamanho="sm" soIcone />}
      {onExcluir && (
        <button aria-label="Excluir tarefa" onClick={onExcluir} className="rounded p-1.5 text-slate-300 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-slate-600">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
