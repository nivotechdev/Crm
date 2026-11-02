import { Phone } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useDerivados } from '../../hooks/useDerivados';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/** "Contatados hoje: X de Y" + ligações/WhatsApps + progresso da meta. */
export function DailyCounter({ compacto }: { compacto?: boolean }) {
  const { config } = useData();
  const d = useDerivados();
  const meta = Math.max(1, config.metaDiaria);
  const progresso = Math.min(100, Math.round((d.contatosHojeTotal / meta) * 100));
  const bateu = d.contatosHojeTotal >= meta;

  if (compacto)
    return (
      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Contatos de hoje">
        <span className="num" title="Leads ativos contatados hoje">
          <b className="text-slate-900 dark:text-white">{d.ativosContatadosHoje}</b>/{d.leadsAtivos.length}
        </span>
        <span className="num flex items-center gap-1" title="Ligações hoje">
          <Phone className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          {d.ligacoesHoje}
        </span>
        <span className="num flex items-center gap-1" title="WhatsApps hoje">
          <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          {d.whatsappsHoje}
        </span>
      </div>
    );

  return (
    <div className="flex items-center gap-4 rounded-full border border-slate-200/80 bg-white py-1.5 pl-4 pr-2 text-[13px] dark:border-slate-800 dark:bg-slate-900" aria-label="Contatos de hoje">
      <span className="text-slate-500 dark:text-slate-400">
        Contatados hoje{' '}
        <b className="num font-semibold text-slate-900 dark:text-white">
          {d.ativosContatadosHoje} de {d.leadsAtivos.length}
        </b>
      </span>
      <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
      <span className="num flex items-center gap-1.5 text-slate-700 dark:text-slate-200" title="Ligações hoje">
        <Phone className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" /> {d.ligacoesHoje}
      </span>
      <span className="num flex items-center gap-1.5 text-slate-700 dark:text-slate-200" title="WhatsApps hoje">
        <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {d.whatsappsHoje}
      </span>
      <span className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-2.5 pr-3 dark:bg-slate-800" title={`Meta diária: ${meta} contatos`}>
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <span className={cn('block h-full rounded-full transition-all', bateu ? 'bg-emerald-500' : 'bg-brand-500')} style={{ width: `${progresso}%` }} />
        </span>
        <span className="num text-xs font-semibold text-slate-700 dark:text-slate-200">
          {d.contatosHojeTotal}/{meta}
        </span>
      </span>
    </div>
  );
}
