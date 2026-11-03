import { CalendarPlus, Phone } from 'lucide-react';
import type { Lead } from '../../types';
import { useAcoes } from '../../store/AcoesContext';
import { cn } from '../../lib/cn';
import { formatTelefone } from '../../lib/format';
import { linkTelefone, linkWhatsApp } from '../../lib/whatsapp';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/**
 * Ligar (laranja) e WhatsApp (verde): abrem o discador / o WhatsApp com o número
 * do lead e registram o contato no mesmo clique.
 * - padrão: botões com rótulo
 * - soIcone: botões redondos compactos
 * - bloco: dois botões só com ícone dividindo a largura (cards)
 */
export function QuickContactButtons({
  lead,
  tamanho = 'md',
  className,
  soIcone,
  bloco,
  agendar,
}: {
  lead: Lead;
  tamanho?: 'sm' | 'md';
  className?: string;
  soIcone?: boolean;
  bloco?: boolean;
  /** Mostra também o botão de agendar reunião. */
  agendar?: boolean;
}) {
  const { contatoRapido, abrirAgendamento } = useAcoes();
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all active:scale-[.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';
  const tam = tamanho === 'sm' ? 'h-8 text-xs' : 'h-10 text-[13px]';
  const larg = soIcone ? (tamanho === 'sm' ? 'w-8' : 'w-10') : bloco ? 'h-9 min-w-0 flex-1' : 'px-3.5';
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', bloco && 'w-full gap-1', className)} onClick={(e) => e.stopPropagation()}>
      {/* Links reais: o celular abre o discador / o WhatsApp; o clique também registra o contato */}
      <a
        href={linkTelefone(lead.telefone)}
        data-contato
        title={`Ligar para ${formatTelefone(lead.telefone)}`}
        aria-label={`Ligar para ${lead.nome}, ${formatTelefone(lead.telefone)}`}
        onClick={() => contatoRapido(lead, 'ligacao')}
        className={cn(base, tam, larg, 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20')}
      >
        <Phone className="h-4 w-4 shrink-0" />
        {!soIcone && !bloco && <span>Ligar</span>}
      </a>
      <a
        href={linkWhatsApp(lead.telefone)}
        target="_blank"
        rel="noopener noreferrer"
        data-contato
        title="Abrir conversa no WhatsApp"
        aria-label={`Abrir WhatsApp de ${lead.nome}`}
        onClick={() => contatoRapido(lead, 'whatsapp', { abrir: false })}
        className={cn(base, tam, larg, 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20')}
      >
        <WhatsAppIcon className="h-4 w-4 shrink-0" />
        {!soIcone && !bloco && <span>WhatsApp</span>}
      </a>
      {agendar && (
        <button
          type="button"
          title="Agendar reunião"
          aria-label={`Agendar reunião com ${lead.nome}`}
          onClick={() => abrirAgendamento({ leadId: lead.id, tipo: 'reuniao' })}
          className={cn(base, tam, larg, 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700')}
        >
          <CalendarPlus className="h-4 w-4 shrink-0" />
          {!soIcone && !bloco && <span>Agendar</span>}
        </button>
      )}
    </div>
  );
}
