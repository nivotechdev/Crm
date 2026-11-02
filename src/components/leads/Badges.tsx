import { CalendarClock, Flame, Snowflake, Sun } from 'lucide-react';
import type { Tarefa, Temperatura } from '../../types';
import { useData } from '../../store/DataContext';
import { useNow } from '../../store/NowContext';
import { corEtapa, etapaPorId } from '../../lib/etapas';
import { diffDiasCalendario, formatHora, tempoRelativoAgenda } from '../../lib/dates';
import { TEMPERATURAS } from '../../lib/labels';
import { cn } from '../../lib/cn';

export function EtapaBadge({ etapaId, className }: { etapaId: string; className?: string }) {
  const { config } = useData();
  const e = etapaPorId(config, etapaId);
  const c = corEtapa(e);
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium', c.chip, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {e?.nome ?? 'Sem etapa'}
    </span>
  );
}

const TEMP: Record<Temperatura, { cls: string; Icone: typeof Flame }> = {
  quente: { cls: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-300', Icone: Flame },
  morno: { cls: 'text-amber-700 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300', Icone: Sun },
  frio: { cls: 'text-sky-700 bg-sky-50 dark:bg-sky-500/15 dark:text-sky-300', Icone: Snowflake },
};

export function TemperaturaBadge({ temperatura, soIcone }: { temperatura: Temperatura; soIcone?: boolean }) {
  const { cls, Icone } = TEMP[temperatura];
  return (
    <span title={`Temperatura: ${TEMPERATURAS[temperatura]}`} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', cls)}>
      <Icone className="h-3.5 w-3.5" />
      {!soIcone && TEMPERATURAS[temperatura]}
    </span>
  );
}

/** "Retorno hoje 14:00" / "Atrasado 2 dias" */
export function ProximoPassoBadge({ tarefa, className }: { tarefa?: Tarefa; className?: string }) {
  const now = useNow();
  if (!tarefa) return null;
  const dias = diffDiasCalendario(tarefa.dataHora, now);
  const atrasada = dias > 0;
  const hoje = dias === 0;
  return (
    <span
      title={tarefa.titulo}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium',
        atrasada ? 'text-red-600 dark:text-red-400' : hoje ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400',
        className,
      )}
    >
      <CalendarClock className="h-3.5 w-3.5" />
      {tempoRelativoAgenda(tarefa.dataHora, now)}
      {hoje && !tarefa.diaInteiro && ` ${formatHora(tarefa.dataHora)}`}
    </span>
  );
}
