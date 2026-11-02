import { Phone } from 'lucide-react';
import type { Canal } from '../../types';
import { useData } from '../../store/DataContext';
import { useNow } from '../../store/NowContext';
import { nivelContato, NIVEL_ESTILO } from '../../lib/contactStatus';
import { formatDataHora, tempoRelativoPassado } from '../../lib/dates';
import { CANAIS } from '../../lib/labels';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

export function CanalIcone({ canal, className = 'h-3.5 w-3.5' }: { canal?: Canal; className?: string }) {
  if (canal === 'whatsapp') return <WhatsAppIcon className={className} />;
  if (canal === 'ligacao') return <Phone className={className} />;
  return null;
}

/** Badge: "Há 3 dias · 📞" com cor de urgência. */
export function LastContactBadge({
  ultimoContatoEm,
  canal,
  compacto,
  className,
}: {
  ultimoContatoEm?: string;
  canal?: Canal;
  compacto?: boolean;
  className?: string;
}) {
  const { config } = useData();
  const now = useNow();
  const nivel = nivelContato(ultimoContatoEm, config, now);
  const estilo = NIVEL_ESTILO[nivel];
  const texto = tempoRelativoPassado(ultimoContatoEm, now);
  const titulo = ultimoContatoEm
    ? `Último contato: ${formatDataHora(ultimoContatoEm)} por ${canal ? CANAIS[canal] : '—'}`
    : 'Este lead nunca foi contatado';
  return (
    <span
      title={titulo}
      aria-label={titulo}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        compacto ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        estilo.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', estilo.ponto)} aria-hidden />
      {texto}
      {canal && ultimoContatoEm && <CanalIcone canal={canal} className="h-3.5 w-3.5 opacity-80" />}
    </span>
  );
}

/** Faixa lateral colorida (posicionar dentro de um container `relative`). */
export function ContactStripe({ ultimoContatoEm, className }: { ultimoContatoEm?: string; className?: string }) {
  const { config } = useData();
  const now = useNow();
  const nivel = nivelContato(ultimoContatoEm, config, now);
  return <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1.5', NIVEL_ESTILO[nivel].faixa, className)} />;
}
