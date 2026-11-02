import { CalendarClock, Flame, Snowflake, Sun } from 'lucide-react';
import type { Tarefa, Temperatura } from '../../types';
import { useData } from '../../store/DataContext';
import { useNow } from '../../store/NowContext';
import { corEtapa, etapaPorId } from '../../lib/etapas';
import { diffDiasCalendario, formatHora, tempoRelativoAgenda } from '../../lib/dates';
import { TEMPERATURAS } from '../../lib/labels';
import { cn } from '../../lib/cn';

/** Etapa: ponto colorido + nome em texto neutro (sem fundo colorido). */
export function EtapaBadge({ etapaId, className }: { etapaId: string; className?: string }) {
  const { config } = useData();
  const e = etapaPorId(config, etapaId);
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-300', className)}>
      <span className={cn('h-2 w-2 rounded-full', corEtapa(e).dot)} />
      {e?.nome ?? 'Sem etapa'}
    </span>
  );
}

const TEMP: Record<Temperatura, { cls: string; Icone: typeof Flame }> = {
  quente: { cls: 'text-red-500', Icone: Flame },
  morno: { cls: 'text-amber-500', Icone: Sun },
  frio: { cls: 'text-sky-500', Icone: Snowflake },
};

export function TemperaturaBadge({ temperatura, soIcone }: { temperatura: Temperatura; soIcone?: boolean }) {
  const { cls, Icone } = TEMP[temperatura];
  return (
    <span title={`Temperatura: ${TEMPERATURAS[temperatura]}`} aria-label={`Temperatura: ${TEMPERATURAS[temperatura]}`} className={cn('inline-flex items-center gap-1 text-xs font-medium', cls)}>
      <Icone className="h-3.5 w-3.5" />
      {!soIcone && <span className="text-slate-600 dark:text-slate-300">{TEMPERATURAS[temperatura]}</span>}
    </span>
  );
}

/** "Hoje 14:00" / "Atrasado 2 dias" */
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
        'inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium',
        atrasada ? 'text-red-600 dark:text-red-400' : hoje ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400',
        className,
      )}
    >
      <CalendarClock className="h-3.5 w-3.5" />
      {tempoRelativoAgenda(tarefa.dataHora, now)}
      {hoje && !tarefa.diaInteiro && ` ${formatHora(tarefa.dataHora)}`}
    </span>
  );
}
