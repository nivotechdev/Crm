import { Phone } from 'lucide-react';
import type { Lead } from '../../types';
import { useAcoes } from '../../store/AcoesContext';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/**
 * "Liguei" (laranja) e "WhatsApp" (verde): registram o contato em 1 clique.
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
}: {
  lead: Lead;
  tamanho?: 'sm' | 'md';
  className?: string;
  soIcone?: boolean;
  bloco?: boolean;
}) {
  const { contatoRapido } = useAcoes();
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all active:scale-[.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';
  const tam = tamanho === 'sm' ? 'h-8 text-xs' : 'h-10 text-[13px]';
  const larg = soIcone ? (tamanho === 'sm' ? 'w-8' : 'w-10') : bloco ? 'h-9 min-w-0 flex-1' : 'px-3.5';
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', bloco && 'w-full gap-1', className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title="Registrar ligação (L)"
        aria-label={`Registrar ligação para ${lead.nome}`}
        onClick={() => contatoRapido(lead, 'ligacao')}
        className={cn(base, tam, larg, 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20')}
      >
        <Phone className="h-4 w-4 shrink-0" />
        {!soIcone && !bloco && <span>Liguei</span>}
      </button>
      <button
        type="button"
        title="Abrir WhatsApp e registrar (W)"
        aria-label={`Abrir WhatsApp de ${lead.nome} e registrar contato`}
        onClick={() => contatoRapido(lead, 'whatsapp')}
        className={cn(base, tam, larg, 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20')}
      >
        <WhatsAppIcon className="h-4 w-4 shrink-0" />
        {!soIcone && !bloco && <span>WhatsApp</span>}
      </button>
    </div>
  );
}
