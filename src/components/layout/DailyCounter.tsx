import { Phone, Target } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useDerivados } from '../../hooks/useDerivados';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/** "Contatados hoje: X de Y" + ligações/WhatsApps + barra da meta. */
export function DailyCounter({ compacto }: { compacto?: boolean }) {
  const { config } = useData();
  const d = useDerivados();
  const meta = Math.max(1, config.metaDiaria);
  const progresso = Math.min(100, Math.round((d.contatosHojeTotal / meta) * 100));
  const bateu = d.contatosHojeTotal >= meta;

  if (compacto)
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300" aria-label="Contatos de hoje">
        <span className="tabular-nums">
          <b className="text-slate-900 dark:text-white">{d.ativosContatadosHoje}</b>/{d.leadsAtivos.length}
        </span>
        <span className="flex items-center gap-0.5 tabular-nums text-sky-700 dark:text-sky-300">
          <Phone className="h-3 w-3" />
          {d.ligacoesHoje}
        </span>
        <span className="flex items-center gap-0.5 tabular-nums text-emerald-700 dark:text-emerald-300">
          <WhatsAppIcon className="h-3 w-3" />
          {d.whatsappsHoje}
        </span>
      </div>
    );

  return (
    <div className="flex items-center gap-4 text-sm" aria-label="Contatos de hoje">
      <div className="text-slate-600 dark:text-slate-300">
        Contatados hoje:{' '}
        <b className="tabular-nums text-slate-900 dark:text-white">
          {d.ativosContatadosHoje} de {d.leadsAtivos.length}
        </b>{' '}
        leads ativos
      </div>
      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1 tabular-nums" title="Ligações hoje">
          <Phone className="h-4 w-4 text-sky-600 dark:text-sky-400" /> {d.ligacoesHoje}
        </span>
        <span className="flex items-center gap-1 tabular-nums" title="WhatsApps hoje">
          <WhatsAppIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {d.whatsappsHoje}
        </span>
      </div>
      <div className="flex items-center gap-2" title={`Meta diária: ${meta} contatos`}>
        <Target className={cn('h-4 w-4', bateu ? 'text-emerald-500' : 'text-slate-400')} />
        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={cn('h-full rounded-full transition-all', bateu ? 'bg-emerald-500' : 'bg-brand-500')} style={{ width: `${progresso}%` }} />
        </div>
        <span className="tabular-nums text-xs text-slate-500 dark:text-slate-400">
          {d.contatosHojeTotal}/{meta}
        </span>
      </div>
    </div>
  );
}
