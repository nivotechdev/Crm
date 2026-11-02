import { Phone } from 'lucide-react';
import type { Lead } from '../../types';
import { useAcoes } from '../../store/AcoesContext';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/** Botões "📞 Liguei" e "WhatsApp" — registram o contato em 1 clique. */
export function QuickContactButtons({
  lead,
  tamanho = 'md',
  className,
  soIcone,
}: {
  lead: Lead;
  tamanho?: 'sm' | 'md';
  className?: string;
  soIcone?: boolean;
}) {
  const { contatoRapido } = useAcoes();
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500';
  const tam = tamanho === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm';
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title="Registrar ligação (L)"
        aria-label={`Registrar ligação para ${lead.nome}`}
        onClick={() => contatoRapido(lead, 'ligacao')}
        className={cn(
          base,
          tam,
          soIcone && (tamanho === 'sm' ? 'w-8 px-0' : 'w-10 px-0'),
          'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30 dark:hover:bg-sky-500/20',
        )}
      >
        <Phone className="h-4 w-4" />
        {!soIcone && <span>Liguei</span>}
      </button>
      <button
        type="button"
        title="Abrir WhatsApp e registrar (W)"
        aria-label={`Abrir WhatsApp de ${lead.nome} e registrar contato`}
        onClick={() => contatoRapido(lead, 'whatsapp')}
        className={cn(
          base,
          tam,
          soIcone && (tamanho === 'sm' ? 'w-8 px-0' : 'w-10 px-0'),
          'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/20',
        )}
      >
        <WhatsAppIcon className="h-4 w-4" />
        {!soIcone && <span>WhatsApp</span>}
      </button>
    </div>
  );
}
