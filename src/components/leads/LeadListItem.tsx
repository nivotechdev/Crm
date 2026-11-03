import { memo, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { Lead, Tarefa } from '../../types';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { corEtapa, etapaPorId } from '../../lib/etapas';
import { formatBRLCompacto } from '../../lib/format';
import { OBJETIVOS } from '../../lib/labels';
import { cn } from '../../lib/cn';
import { LastContactBadge } from './LastContactBadge';
import { ProximoPassoBadge, TemperaturaBadge } from './Badges';
import { QuickContactButtons } from './QuickContactButtons';

/** Seletor de etapa discreto: ponto colorido + nome (1 clique para mudar). */
export function EtapaSelect({ lead, className }: { lead: Lead; className?: string }) {
  const { config } = useData();
  const { pedirMoverEtapa } = useAcoes();
  const cor = corEtapa(etapaPorId(config, lead.etapaId));
  return (
    <span className={cn('relative inline-flex max-w-full items-center', className)}>
      <span aria-hidden className={cn('pointer-events-none absolute left-2.5 h-2 w-2 rounded-full', cor.dot)} />
      <select
        aria-label="Etapa do funil"
        value={lead.etapaId}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => pedirMoverEtapa(lead, e.target.value)}
        className="select-chevron h-7 max-w-full cursor-pointer truncate rounded-full border-0 bg-slate-100 py-0 pl-6 pr-6 text-[11px] font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {config.etapas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </select>
    </span>
  );
}

interface Props {
  lead: Lead;
  proxima?: Tarefa;
  selecionado: boolean;
  focado: boolean;
  modoSelecao: boolean;
  /** Toque simples no modo de seleção: marca/desmarca. */
  onSelecionar: (id: string) => void;
  /** Segurar o card (dedo ou mouse): entra no modo de seleção marcando este card. */
  onSegurar: (id: string) => void;
  onFocar: () => void;
}

const TEMPO_SEGURAR = 450; // ms
const TOLERANCIA = 10; // px de movimento antes de cancelar (permite rolar a tela)

/** Card de lead (grade: 2 colunas no celular, até 5 no desktop). Segure para selecionar. */
export const LeadCard = memo(function LeadCard({ lead, proxima, selecionado, focado, modoSelecao, onSelecionar, onSegurar, onFocar }: Props) {
  const timer = useRef<number | undefined>(undefined);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const segurou = useRef(false);
  const [pressionando, setPressionando] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const cancelar = () => {
    window.clearTimeout(timer.current);
    inicio.current = null;
    setPressionando(false);
  };

  const aoPressionar = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    // Fora do modo de seleção, segurar os botões internos não seleciona
    if (!modoSelecao && (e.target as HTMLElement).closest('button, select, a[data-contato]')) return;
    segurou.current = false;
    inicio.current = { x: e.clientX, y: e.clientY };
    setPressionando(true);
    timer.current = window.setTimeout(() => {
      segurou.current = true;
      inicio.current = null;
      setPressionando(false);
      try {
        navigator.vibrate?.(12);
      } catch {
        /* sem vibração */
      }
      onSegurar(lead.id);
    }, TEMPO_SEGURAR);
  };

  const aoMover = (e: ReactPointerEvent) => {
    const i = inicio.current;
    if (i && Math.hypot(e.clientX - i.x, e.clientY - i.y) > TOLERANCIA) cancelar();
  };

  return (
    <article
      role="listitem"
      data-lead-id={lead.id}
      aria-selected={modoSelecao ? selecionado : undefined}
      onMouseDown={onFocar}
      onPointerDown={aoPressionar}
      onPointerMove={aoMover}
      onPointerUp={cancelar}
      onPointerCancel={cancelar}
      onPointerLeave={cancelar}
      onContextMenu={(e) => {
        // Evita o menu do navegador ao segurar o card
        if (pressionando || segurou.current || modoSelecao) e.preventDefault();
      }}
      onClickCapture={(e) => {
        // O clique que vem logo depois de "segurar" não deve abrir a ficha
        if (segurou.current) {
          e.preventDefault();
          e.stopPropagation();
          segurou.current = false;
        }
      }}
      style={{ WebkitTouchCallout: 'none' }}
      className={cn(
        'group relative flex min-w-0 select-none flex-col overflow-hidden rounded-2xl border bg-white transition-[transform,box-shadow,border-color,background-color] duration-200 dark:bg-slate-900',
        pressionando && 'scale-[.97] duration-300',
        selecionado
          ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/25 dark:bg-brand-500/10'
          : focado
            ? 'border-slate-300 shadow-lift dark:border-slate-600'
            : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lift dark:border-slate-800 dark:hover:border-slate-700',
      )}
    >
      {modoSelecao && (
        // No modo de seleção o card inteiro vira um botão de marcar/desmarcar
        <button
          type="button"
          aria-label={selecionado ? `Desmarcar ${lead.nome}` : `Selecionar ${lead.nome}`}
          aria-pressed={selecionado}
          onClick={() => onSelecionar(lead.id)}
          className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        >
          <span
            aria-hidden
            className={cn(
              'absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
              selecionado ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white/90 text-transparent dark:border-slate-600 dark:bg-slate-900/90',
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </button>
      )}

      <Link
        to={`/leads/${lead.id}`}
        draggable={false}
        tabIndex={modoSelecao ? -1 : undefined}
        className="flex flex-1 flex-col gap-2.5 px-4 py-3.5 focus-visible:outline-none"
      >
        <div className={cn('min-w-0', modoSelecao && 'pr-6')}>
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            {lead.nome}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.objetivo ? OBJETIVOS[lead.objetivo].split('/')[0] : 'Sem objetivo'}
            {lead.cidade && <span className="hidden sm:inline"> · {lead.cidade}</span>}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="num text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">{formatBRLCompacto(lead.valorCarta)}</span>
          <TemperaturaBadge temperatura={lead.temperatura} soIcone />
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto />
          <ProximoPassoBadge tarefa={proxima} />
        </div>
      </Link>

      <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <EtapaSelect lead={lead} />
        <QuickContactButtons lead={lead} tamanho="sm" bloco agendar />
      </div>
    </article>
  );
});
