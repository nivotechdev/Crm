import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { GripVertical, List, Search } from 'lucide-react';
import type { Etapa, Lead, Tarefa } from '../types';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from '../hooks/useDerivados';
import { aplicaFiltroRapido, buscaLead, FILTROS_RAPIDOS, ordenar, type FiltroRapido } from '../lib/leadFilters';
import { corEtapa } from '../lib/etapas';
import { formatBRLCompacto } from '../lib/format';
import { OBJETIVOS } from '../lib/labels';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { inputBase } from '../components/ui/Field';
import { PageHeader } from '../components/layout/PageHeader';
import { ContactStripe, LastContactBadge } from '../components/leads/LastContactBadge';
import { ProximoPassoBadge, TemperaturaBadge } from '../components/leads/Badges';
import { QuickContactButtons } from '../components/leads/QuickContactButtons';
import { EtapaSelect } from '../components/leads/LeadListItem';

const DIAS_FECHADOS = 30;

export default function LeadsKanbanPage() {
  const { leads, config } = useData();
  const { pedirMoverEtapa } = useAcoes();
  const d = useDerivados();
  const now = useNow();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroRapido | null>(null);
  const [arrastando, setArrastando] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const colunas = useMemo(() => {
    const limite = new Date(now.getTime() - DIAS_FECHADOS * 86_400_000).toISOString();
    const ctx = { retornoHojeIds: d.retornoHojeIds, vermelhoApartirDe: config.laranjaAteDias + 1, now };
    return config.etapas.map((etapa) => {
      let itens = leads.filter((l) => l.etapaId === etapa.id && buscaLead(l, busca) && (!filtro || aplicaFiltroRapido(l, filtro, ctx)));
      // Colunas finais mostram só os últimos 30 dias para não poluir
      if (etapa.tipo !== 'aberta') itens = itens.filter((l) => l.atualizadoEm >= limite);
      itens = ordenar(itens, 'sem_contato', d.proximaTarefaPorLead);
      return { etapa, itens, total: itens.reduce((s, l) => s + (l.valorCarta ?? 0), 0) };
    });
  }, [leads, config, busca, filtro, d, now]);

  const onDragStart = (e: DragStartEvent) => setArrastando(leads.find((l) => l.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setArrastando(null);
    const lead = leads.find((l) => l.id === e.active.id);
    if (lead && e.over && e.over.id !== lead.etapaId) pedirMoverEtapa(lead, String(e.over.id));
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col px-3 pt-4 md:h-[calc(100dvh-6.25rem)] md:px-6 md:pt-6 lg:h-[calc(100dvh-3.5rem)]">
      <PageHeader
        titulo="Funil de vendas"
        subtitulo="Arraste os cards entre as etapas (no celular: segure e arraste, ou use o seletor de etapa)"
        acoes={
          <Link to="/leads">
            <Button icone={<List className="h-4 w-4" />}>
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </Link>
        }
      />
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar cards" className={cn(inputBase, 'h-9 pl-9')} aria-label="Filtrar cards" />
        </div>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:px-0">
          {FILTROS_RAPIDOS.map((f) => (
            <Chip key={f.id} ativo={filtro === f.id} onClick={() => setFiltro(filtro === f.id ? null : f.id)} className="h-8 text-xs">
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setArrastando(null)}>
        <div className="-mx-3 flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-24 md:mx-0 md:snap-none md:px-0 md:pb-4">
          {colunas.map((c) => (
            <Coluna key={c.etapa.id} etapa={c.etapa} itens={c.itens} total={c.total} proxima={d.proximaTarefaPorLead} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{arrastando && <CardKanban lead={arrastando} overlay />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Coluna({ etapa, itens, total, proxima }: { etapa: Etapa; itens: Lead[]; total: number; proxima: Map<string, Tarefa> }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const cor = corEtapa(etapa);
  return (
    <section
      ref={setNodeRef}
      aria-label={`Etapa ${etapa.nome}`}
      className={cn(
        'flex w-[85vw] shrink-0 snap-center flex-col rounded-2xl bg-slate-100/80 transition-colors dark:bg-slate-900/60 sm:w-72',
        isOver && 'bg-brand-50 ring-2 ring-brand-400 dark:bg-brand-500/10',
      )}
    >
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span className={cn('h-2.5 w-2.5 rounded-full', cor.dot)} />
        <h2 className="flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{etapa.nome}</h2>
        <span className="rounded-full bg-white px-2 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">{itens.length}</span>
      </header>
      <p className="-mt-1 px-3 pb-2 text-xs text-slate-500 dark:text-slate-400">
        {formatBRLCompacto(total)} em cartas
        {etapa.tipo !== 'aberta' && ' · últimos 30 dias'}
      </p>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {itens.map((l) => (
          <ArrastavelCard key={l.id} lead={l} proxima={proxima.get(l.id)} />
        ))}
        {itens.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700">Solte um card aqui</div>
        )}
      </div>
    </section>
  );
}

function ArrastavelCard({ lead, proxima }: { lead: Lead; proxima?: Tarefa }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} className={cn(isDragging && 'opacity-30')}>
      <CardKanban lead={lead} proxima={proxima} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

const CardKanban = memo(function CardKanban({
  lead,
  proxima,
  overlay,
  dragHandle,
}: {
  lead: Lead;
  proxima?: Tarefa;
  overlay?: boolean;
  dragHandle?: Record<string, unknown>;
}) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl bg-white py-2.5 pl-3.5 pr-2.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700',
        overlay && 'rotate-2 shadow-xl ring-2 ring-brand-400',
      )}
    >
      <ContactStripe ultimoContatoEm={lead.ultimoContatoEm} />
      <div className="flex items-start gap-1" {...dragHandle} style={{ touchAction: 'manipulation' }}>
        <Link to={`/leads/${lead.id}`} className="min-w-0 flex-1 cursor-pointer" onClick={(e) => overlay && e.preventDefault()}>
          <p className="truncate text-sm font-semibold text-slate-900 hover:text-brand-700 dark:text-white">{lead.nome}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.objetivo ? OBJETIVOS[lead.objetivo] : '—'} · {formatBRLCompacto(lead.valorCarta)}
          </p>
        </Link>
        <span className="cursor-grab touch-none p-0.5 text-slate-300 active:cursor-grabbing dark:text-slate-600" aria-hidden>
          <GripVertical className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} compacto />
        <TemperaturaBadge temperatura={lead.temperatura} soIcone />
        <ProximoPassoBadge tarefa={proxima} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 md:hidden">
          <EtapaSelect lead={lead} className="max-w-[9.5rem]" />
        </div>
        <QuickContactButtons lead={lead} tamanho="sm" className="ml-auto" />
      </div>
    </article>
  );
});
