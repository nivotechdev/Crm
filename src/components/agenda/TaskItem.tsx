import { Link } from 'react-router-dom';
import { Check, Link2, MapPin, Phone, Trash2, Video } from 'lucide-react';
import type { Lead, Tarefa } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { useNow } from '../../store/NowContext';
import { diffDiasCalendario, formatData, formatHora, tempoRelativoAgenda } from '../../lib/dates';
import { FORMATOS_REUNIAO, TIPOS_TAREFA } from '../../lib/labels';
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
    <li className={cn('group relative flex items-center gap-3 py-3 pl-5 pr-3 sm:pr-4', tarefa.concluida && 'opacity-50')}>
      {lead && <ContactStripe ultimoContatoEm={lead.ultimoContatoEm} className="inset-y-3 w-[3px] rounded-r-full" />}
      <button
        onClick={alternar}
        aria-label={tarefa.concluida ? 'Marcar como pendente' : 'Concluir'}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          tarefa.concluida
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600',
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold text-slate-900 dark:text-white', tarefa.concluida && 'line-through')}>
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
          <span className="inline-flex items-center gap-1 text-slate-400">
            · {TIPOS_TAREFA[tarefa.tipo]}
            {tarefa.formato && (
              <>
                {tarefa.formato === 'video' ? <Video className="h-3 w-3" /> : tarefa.formato === 'presencial' ? <MapPin className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                {FORMATOS_REUNIAO[tarefa.formato].toLowerCase()}
              </>
            )}
          </span>
          <span className={cn(atrasada && 'font-semibold text-red-600 dark:text-red-400')}>
            {mostrarData && `${tempoRelativoAgenda(tarefa.dataHora, now)}`}
            {mostrarData && dias !== 0 && ` (${formatData(tarefa.dataHora, { ano: false })})`}
            {!tarefa.diaInteiro && `${mostrarData ? ' · ' : ''}${formatHora(tarefa.dataHora)}`}
          </span>
          {lead && <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto className="sm:hidden" />}
        </p>
        {tarefa.local && !tarefa.concluida && (
          <p className="mt-0.5 truncate text-xs">
            {/^https?:\/\//.test(tarefa.local) ? (
              <a href={tarefa.local} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline dark:text-brand-300">
                <Link2 className="h-3 w-3" /> Entrar na chamada
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <MapPin className="h-3 w-3" /> {tarefa.local}
              </span>
            )}
          </p>
        )}
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
