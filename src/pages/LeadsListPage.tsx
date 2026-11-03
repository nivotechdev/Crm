import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, Plus, Search, SlidersHorizontal, Tag, Trash2, Users, X } from 'lucide-react';
import type { Objetivo, Temperatura } from '../types';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useToast } from '../store/ToastContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from '../hooks/useDerivados';
import { useHotkeys } from '../hooks/useHotkeys';
import { aplicaFiltroRapido, buscaLead, FILTROS_RAPIDOS, ORDENACOES, ordenar, type FiltroRapido, type Ordenacao } from '../lib/leadFilters';
import { OBJETIVOS, TEMPERATURAS, opcoes } from '../lib/labels';
import { prefs } from '../services/storage';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Select, inputBase } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { LeadCard } from '../components/leads/LeadListItem';
import { PageHeader } from '../components/layout/PageHeader';
import { DailyCounter } from '../components/layout/DailyCounter';
import { StageSwitcher, type ResumoEtapa } from '../components/leads/StageSwitcher';
import { formatBRLCompacto } from '../lib/format';

const selectEscuro =
  'select-chevron h-9 rounded-full border-0 bg-white/10 pl-3 pr-7 text-[13px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/40 [&>option]:text-slate-900';

export default function LeadsListPage() {
  const { leads, config, moverEtapaEmMassa, atualizarLeadsEmMassa, adicionarEtiquetaEmMassa, excluirLeads } = useData();
  const { abrirNovoLead, contatoRapido, confirmar } = useAcoes();
  const toast = useToast();
  const now = useNow();
  const d = useDerivados();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const gradeRef = useRef<HTMLDivElement>(null);

  const filtro = (params.get('filtro') as FiltroRapido | null) ?? null;
  const setFiltro = (f: FiltroRapido | null) => {
    const p = new URLSearchParams(params);
    if (f) p.set('filtro', f);
    else p.delete('filtro');
    setParams(p, { replace: true });
  };

  // Cada etapa do funil é uma "tela" (?etapa=<id>); vazio = todas as ativas
  const etapa = params.get('etapa') ?? '';
  const setEtapa = (id: string) => {
    const p = new URLSearchParams(params);
    if (id) p.set('etapa', id);
    else p.delete('etapa');
    setParams(p, { replace: true });
    setFoco(-1);
    setSelecionados(new Set());
    window.scrollTo({ top: 0 });
  };
  const ordemEtapas = ['', ...config.etapas.map((e) => e.id)];

  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordenacao>(() => prefs.get('lista:ordem', 'sem_contato'));
  const [temp, setTemp] = useState<Temperatura | ''>('');
  const [objetivo, setObjetivo] = useState<Objetivo | ''>('');
  const [origem, setOrigem] = useState('');
  const [incluirFechados, setIncluirFechados] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modoSelecao, setModoSelecao] = useState(false);
  const [foco, setFoco] = useState(-1);
  const [etiquetaMassa, setEtiquetaMassa] = useState<string | null>(null);

  useEffect(() => prefs.set('lista:ordem', ordem), [ordem]);

  const ctxFiltro = { retornoHojeIds: d.retornoHojeIds, vermelhoApartirDe: config.laranjaAteDias + 1, now };

  const base = useMemo(() => leads.filter((l) => (incluirFechados || etapa ? true : d.isAtivo(l))), [leads, incluirFechados, etapa, d]);

  const resumo = useMemo(() => {
    const r: Record<string, ResumoEtapa> = { '': { qtd: 0, valor: 0 } };
    for (const e of config.etapas) r[e.id] = { qtd: 0, valor: 0 };
    for (const l of leads) {
      if (r[l.etapaId]) {
        r[l.etapaId].qtd++;
        r[l.etapaId].valor += l.valorCarta ?? 0;
      }
      if (d.isAtivo(l)) {
        r[''].qtd++;
        r[''].valor += l.valorCarta ?? 0;
      }
    }
    return r;
  }, [leads, config.etapas, d]);

  const contagens = useMemo(() => {
    const c = {} as Record<FiltroRapido, number>;
    for (const f of FILTROS_RAPIDOS) c[f.id] = base.filter((l) => aplicaFiltroRapido(l, f.id, ctxFiltro)).length;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, d.retornoHojeIds, config.laranjaAteDias, now]);

  const lista = useMemo(() => {
    const f = base.filter(
      (l) =>
        buscaLead(l, busca) &&
        (!filtro || aplicaFiltroRapido(l, filtro, ctxFiltro)) &&
        (!etapa || l.etapaId === etapa) &&
        (!temp || l.temperatura === temp) &&
        (!objetivo || l.objetivo === objetivo) &&
        (!origem || l.origem === origem),
    );
    return ordenar(f, ordem, d.proximaTarefaPorLead);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, busca, filtro, etapa, temp, objetivo, origem, ordem, d.proximaTarefaPorLead, now]);

  useEffect(() => setFoco((f) => Math.min(f, lista.length - 1)), [lista.length]);

  const alternar = (id: string) =>
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const limparSelecao = () => {
    setEtiquetaMassa(null);
    setSelecionados(new Set());
    setModoSelecao(false);
  };

  // Navegação por teclado na grade
  const colunas = () => {
    const g = gradeRef.current;
    return g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 1;
  };
  const moverFoco = (delta: number) => {
    const i = Math.max(0, Math.min(lista.length - 1, (foco < 0 ? -1 : foco) + delta));
    setFoco(i);
    requestAnimationFrame(() => document.querySelector(`[data-lead-id="${lista[i]?.id}"]`)?.scrollIntoView({ block: 'nearest' }));
  };
  const focado = foco >= 0 ? lista[foco] : undefined;

  useHotkeys({
    j: () => moverFoco(1),
    k: () => moverFoco(-1),
    arrowright: () => moverFoco(1),
    arrowleft: () => moverFoco(-1),
    arrowdown: () => moverFoco(colunas()),
    arrowup: () => moverFoco(-colunas()),
    l: () => focado && contatoRapido(focado, 'ligacao'),
    w: () => focado && contatoRapido(focado, 'whatsapp'),
    enter: () => focado && navigate(`/leads/${focado.id}`),
    '[': () => {
      const i = ordemEtapas.indexOf(etapa);
      if (i > 0) setEtapa(ordemEtapas[i - 1]);
    },
    ']': () => {
      const i = ordemEtapas.indexOf(etapa);
      if (i < ordemEtapas.length - 1) setEtapa(ordemEtapas[i + 1]);
    },
    x: () => {
      if (!focado) return;
      setModoSelecao(true);
      alternar(focado.id);
    },
  });

  const nSel = selecionados.size;
  const ids = [...selecionados];
  const filtrosAvancados = [temp, objetivo, origem].filter(Boolean).length + (incluirFechados && !etapa ? 1 : 0);
  const etapaAtual = config.etapas.find((e) => e.id === etapa);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        titulo={etapaAtual ? etapaAtual.nome : 'Leads'}
        subtitulo={
          lista.length === (resumo[etapa]?.qtd ?? -1) || filtro || busca
            ? `${lista.length} ${lista.length === 1 ? 'lead' : 'leads'} · ${formatBRLCompacto(lista.reduce((s, l) => s + (l.valorCarta ?? 0), 0))} em cartas`
            : `${lista.length} de ${resumo[etapa]?.qtd ?? 0} leads`
        }
        acoes={
          <Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => abrirNovoLead(etapaAtual?.tipo === 'aberta' ? { etapaId: etapaAtual.id } : undefined)} className="hidden md:inline-flex">
            Novo lead
          </Button>
        }
      />

      <div className="mb-4 flex justify-start lg:mb-5">
        <div className="lg:hidden">
          <DailyCounter compacto />
        </div>
        <div className="hidden lg:block">
          <DailyCounter />
        </div>
      </div>

      <StageSwitcher atual={etapa} resumo={resumo} onChange={setEtapa} />

      {/* Busca + controles */}
      <div className="mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone, cidade…"
            className={cn(inputBase, 'h-11 rounded-full pl-10')}
            aria-label="Filtrar leads"
          />
          {busca && (
            <button aria-label="Limpar busca" onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="hidden w-60 shrink-0 sm:block">
          <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordenacao)} opcoes={ORDENACOES} aria-label="Ordenar por" className="rounded-full" />
        </div>
        <Button
          onClick={() => setMostrarFiltros((m) => !m)}
          aria-expanded={mostrarFiltros}
          aria-label="Mais filtros"
          className={cn('h-11 px-3.5', filtrosAvancados > 0 && 'border-brand-300 text-brand-700 dark:border-brand-500/40 dark:text-brand-300')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filtrosAvancados > 0 && <span className="num">{filtrosAvancados}</span>}
        </Button>
        <Button
          aria-label="Selecionar vários"
          title="Selecionar vários (X)"
          onClick={() => (modoSelecao ? limparSelecao() : setModoSelecao(true))}
          variante={modoSelecao ? 'primario' : 'secundario'}
          className="h-11 px-3.5"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtros rápidos (1 clique) */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Chip ativo={!filtro} onClick={() => setFiltro(null)}>
          Todos
        </Chip>
        {FILTROS_RAPIDOS.map((f) => (
          <Chip key={f.id} ativo={filtro === f.id} contador={contagens[f.id]} onClick={() => setFiltro(filtro === f.id ? null : f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {mostrarFiltros && (
        <div className="mb-5 grid animate-fade-in grid-cols-2 gap-2 rounded-3xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:hidden">
            <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordenacao)} opcoes={ORDENACOES} aria-label="Ordenar por" />
          </div>
          <Select value={temp} onChange={(e) => setTemp(e.target.value as Temperatura)} vazio="Temperatura" opcoes={opcoes(TEMPERATURAS)} aria-label="Temperatura" />
          <Select value={objetivo} onChange={(e) => setObjetivo(e.target.value as Objetivo)} vazio="Objetivo" opcoes={opcoes(OBJETIVOS)} aria-label="Objetivo" />
          <Select value={origem} onChange={(e) => setOrigem(e.target.value)} vazio="Origem" opcoes={config.origens.map((o) => ({ value: o, label: o }))} aria-label="Origem" />
          {!etapa && <label className="flex items-center gap-2 px-2 text-[13px] text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={incluirFechados} onChange={(e) => setIncluirFechados(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Ganhos e perdidos
          </label>}
          <Button
            variante="fantasma"
            onClick={() => {
              setTemp('');
              setObjetivo('');
              setOrigem('');
              setIncluirFechados(false);
            }}
          >
            Limpar
          </Button>
        </div>
      )}

      {modoSelecao && nSel === 0 && <p className="mb-3 text-[13px] text-slate-500">Toque nos cards para selecionar.</p>}

      {lista.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
          {leads.length === 0 ? (
            <EmptyState
              icone={<Users className="h-6 w-6" />}
              titulo="Nenhum lead ainda"
              descricao="Cadastre o primeiro lead com só nome e telefone."
              acao={<Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => abrirNovoLead()}>Novo lead</Button>}
            />
          ) : etapaAtual && !filtro && !busca && (resumo[etapa]?.qtd ?? 0) === 0 ? (
            <EmptyState
              icone={<Users className="h-6 w-6" />}
              titulo={`Nenhum lead em “${etapaAtual.nome}”`}
              descricao="Mude a etapa de um lead pelo seletor no card dele, ou cadastre um novo lead."
            />
          ) : filtro === 'nao_contatados_hoje' ? (
            <EmptyState icone={<CheckSquare className="h-6 w-6" />} titulo="Todos os leads foram contatados hoje" descricao="Ótimo trabalho. Que tal pedir indicações aos clientes?" />
          ) : (
            <EmptyState icone={<Search className="h-6 w-6" />} titulo="Nenhum lead com esses filtros" acao={<Button onClick={() => (setFiltro(null), setBusca(''))}>Limpar filtros</Button>} />
          )}
        </div>
      ) : (
        <div ref={gradeRef} role="list" className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {lista.map((l, i) => (
            <LeadCard
              key={l.id}
              lead={l}
              proxima={d.proximaTarefaPorLead.get(l.id)}
              selecionado={selecionados.has(l.id)}
              focado={i === foco}
              modoSelecao={modoSelecao}
              onSelecionar={alternar}
              onFocar={() => setFoco(i)}
            />
          ))}
        </div>
      )}

      <p className="mt-6 hidden text-center text-xs text-slate-400 md:block">
        Teclado: <kbd className="font-sans font-semibold">[</kbd>/<kbd className="font-sans font-semibold">]</kbd> trocar etapa · <kbd className="font-sans font-semibold">J</kbd>/<kbd className="font-sans font-semibold">K</kbd> navegar · <kbd className="font-sans font-semibold">L</kbd> ligação ·{' '}
        <kbd className="font-sans font-semibold">W</kbd> WhatsApp · <kbd className="font-sans font-semibold">X</kbd> selecionar
      </p>

      {/* Barra de ações em massa */}
      {nSel > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-2xl animate-slide-up flex-wrap items-center gap-2 rounded-[22px] bg-slate-900 p-2 pl-4 text-sm text-white shadow-pop dark:bg-slate-800 lg:bottom-6">
          <span className="font-semibold">
            {nSel} selecionado{nSel > 1 && 's'}
          </span>
          <select
            aria-label="Mover selecionados para etapa"
            className={selectEscuro}
            value=""
            onChange={async (e) => {
              if (!e.target.value) return;
              const alvo = config.etapas.find((x) => x.id === e.target.value);
              if (alvo?.tipo !== 'aberta' && !(await confirmar({ titulo: `Mover ${nSel} leads para "${alvo?.nome}"?`, mensagem: 'Para registrar motivo de perda ou dados da venda, mova um por vez.' }))) return;
              await moverEtapaEmMassa(ids, e.target.value);
              toast(`${nSel} leads movidos para ${alvo?.nome}`);
              limparSelecao();
            }}
          >
            <option value="">Etapa…</option>
            {config.etapas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Alterar temperatura dos selecionados"
            className={selectEscuro}
            value=""
            onChange={async (e) => {
              if (!e.target.value) return;
              await atualizarLeadsEmMassa(ids, { temperatura: e.target.value as Temperatura });
              toast(`Temperatura atualizada em ${nSel} leads`);
              limparSelecao();
            }}
          >
            <option value="">Temperatura…</option>
            {opcoes(TEMPERATURAS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {etiquetaMassa === null ? (
            <button className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[13px] font-medium hover:bg-white/20" onClick={() => setEtiquetaMassa('')}>
              <Tag className="h-4 w-4" /> Etiqueta
            </button>
          ) : (
            <form
              className="flex items-center gap-1"
              onSubmit={async (e) => {
                e.preventDefault();
                const et = etiquetaMassa.trim();
                if (!et) return setEtiquetaMassa(null);
                await adicionarEtiquetaEmMassa(ids, et);
                toast(`Etiqueta "${et}" adicionada a ${nSel} leads`);
                limparSelecao();
              }}
            >
              <input
                autoFocus
                value={etiquetaMassa}
                onChange={(e) => setEtiquetaMassa(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setEtiquetaMassa(null))}
                placeholder="Nova etiqueta"
                className="h-9 w-32 rounded-full border-0 bg-white px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button type="submit" className="h-9 rounded-full bg-brand-600 px-3 text-[13px] font-semibold hover:bg-brand-700">
                OK
              </button>
            </form>
          )}
          <button
            aria-label="Excluir selecionados"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-red-500"
            onClick={async () => {
              if (!(await confirmar({ titulo: `Excluir ${nSel} lead${nSel > 1 ? 's' : ''}?`, mensagem: 'O histórico, tarefas e simulações também serão apagados. Não é possível desfazer.', confirmarLabel: 'Excluir', perigo: true })))
                return;
              await excluirLeads(ids);
              toast(`${nSel} lead${nSel > 1 ? 's' : ''} excluído${nSel > 1 ? 's' : ''}`, { tipo: 'info' });
              limparSelecao();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button className="ml-auto flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10" aria-label="Cancelar seleção" onClick={limparSelecao}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
