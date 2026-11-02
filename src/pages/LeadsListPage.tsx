import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, Columns3, Plus, Search, SlidersHorizontal, Tag, Trash2, Users, X } from 'lucide-react';
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
import { LeadCardMobile, LeadRow } from '../components/leads/LeadListItem';
import { PageHeader } from '../components/layout/PageHeader';

export default function LeadsListPage() {
  const { leads, config, moverEtapaEmMassa, atualizarLeadsEmMassa, adicionarEtiquetaEmMassa, excluirLeads } = useData();
  const { abrirNovoLead, contatoRapido, confirmar } = useAcoes();
  const toast = useToast();
  const now = useNow();
  const d = useDerivados();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const filtro = (params.get('filtro') as FiltroRapido | null) ?? null;
  const setFiltro = (f: FiltroRapido | null) => {
    const p = new URLSearchParams(params);
    if (f) p.set('filtro', f);
    else p.delete('filtro');
    setParams(p, { replace: true });
  };

  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordenacao>(() => prefs.get('lista:ordem', 'sem_contato'));
  const [etapa, setEtapa] = useState(params.get('etapa') ?? '');
  const [temp, setTemp] = useState<Temperatura | ''>('');
  const [objetivo, setObjetivo] = useState<Objetivo | ''>('');
  const [origem, setOrigem] = useState('');
  const [incluirFechados, setIncluirFechados] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modoSelecao, setModoSelecao] = useState(false);
  const [foco, setFoco] = useState(0);
  const [etiquetaMassa, setEtiquetaMassa] = useState<string | null>(null);

  useEffect(() => prefs.set('lista:ordem', ordem), [ordem]);

  const ctxFiltro = { retornoHojeIds: d.retornoHojeIds, vermelhoApartirDe: config.laranjaAteDias + 1, now };

  const base = useMemo(
    () => leads.filter((l) => (incluirFechados || etapa ? true : d.isAtivo(l))),
    [leads, incluirFechados, etapa, d],
  );

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

  useEffect(() => setFoco((f) => Math.min(f, Math.max(0, lista.length - 1))), [lista.length]);

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

  const focado = lista[foco];
  const rolarPara = (i: number) =>
    requestAnimationFrame(() => document.querySelector(`[data-lead-id="${lista[i]?.id}"]`)?.scrollIntoView({ block: 'nearest' }));

  useHotkeys({
    j: () => (setFoco((f) => Math.min(lista.length - 1, f + 1)), rolarPara(foco + 1)),
    arrowdown: () => (setFoco((f) => Math.min(lista.length - 1, f + 1)), rolarPara(foco + 1)),
    k: () => (setFoco((f) => Math.max(0, f - 1)), rolarPara(foco - 1)),
    arrowup: () => (setFoco((f) => Math.max(0, f - 1)), rolarPara(foco - 1)),
    l: () => focado && contatoRapido(focado, 'ligacao'),
    w: () => focado && contatoRapido(focado, 'whatsapp'),
    enter: () => focado && navigate(`/leads/${focado.id}`),
    x: () => focado && alternar(focado.id),
  });

  const nSel = selecionados.size;
  const ids = [...selecionados];
  const filtrosAvancadosAtivos = [etapa, temp, objetivo, origem].filter(Boolean).length + (incluirFechados ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-6">
      <PageHeader
        titulo="Leads"
        subtitulo={`${lista.length} ${lista.length === 1 ? 'lead' : 'leads'}${!incluirFechados && !etapa ? ' ativos' : ''}`}
        acoes={
          <>
            <Link to="/funil" className="hidden sm:block">
              <Button icone={<Columns3 className="h-4 w-4" />}>Funil</Button>
            </Link>
            <Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => abrirNovoLead()} className="hidden md:inline-flex">
              Novo lead
            </Button>
          </>
        }
      />

      {/* Busca + ordenação */}
      <div className="mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por nome, telefone, cidade ou etiqueta"
            className={cn(inputBase, 'h-10 pl-9')}
            aria-label="Filtrar leads"
          />
          {busca && (
            <button aria-label="Limpar busca" onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="hidden w-56 shrink-0 sm:block">
          <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordenacao)} opcoes={ORDENACOES} aria-label="Ordenar por" />
        </div>
        <Button
          onClick={() => setMostrarFiltros((m) => !m)}
          icone={<SlidersHorizontal className="h-4 w-4" />}
          aria-expanded={mostrarFiltros}
          className={cn(filtrosAvancadosAtivos > 0 && 'ring-brand-400 text-brand-700 dark:text-brand-300')}
        >
          <span className="hidden sm:inline">Filtros</span>
          {filtrosAvancadosAtivos > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[11px] text-white">{filtrosAvancadosAtivos}</span>}
        </Button>
        <Button
          className="md:hidden"
          aria-label="Selecionar vários"
          onClick={() => (modoSelecao ? limparSelecao() : setModoSelecao(true))}
          variante={modoSelecao ? 'primario' : 'secundario'}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtros rápidos (1 clique) */}
      <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0">
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
        <div className="mb-3 grid animate-fade-in grid-cols-2 gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 md:grid-cols-6">
          <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordenacao)} opcoes={ORDENACOES} className="col-span-2 sm:hidden" aria-label="Ordenar por" />
          <Select value={etapa} onChange={(e) => setEtapa(e.target.value)} vazio="Todas as etapas" opcoes={config.etapas.map((e) => ({ value: e.id, label: e.nome }))} aria-label="Etapa" />
          <Select value={temp} onChange={(e) => setTemp(e.target.value as Temperatura)} vazio="Temperatura" opcoes={opcoes(TEMPERATURAS)} aria-label="Temperatura" />
          <Select value={objetivo} onChange={(e) => setObjetivo(e.target.value as Objetivo)} vazio="Objetivo" opcoes={opcoes(OBJETIVOS)} aria-label="Objetivo" />
          <Select value={origem} onChange={(e) => setOrigem(e.target.value)} vazio="Origem" opcoes={config.origens.map((o) => ({ value: o, label: o }))} aria-label="Origem" />
          <label className="flex items-center gap-2 px-1 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={incluirFechados} onChange={(e) => setIncluirFechados(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Incluir ganhos/perdidos
          </label>
          <Button
            variante="fantasma"
            onClick={() => {
              setEtapa('');
              setTemp('');
              setObjetivo('');
              setOrigem('');
              setIncluirFechados(false);
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Ações em massa */}
      {nSel > 0 && (
        <div className="sticky top-14 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-600 p-2 pl-4 text-sm text-white shadow-lg md:top-[7.5rem] lg:top-16">
          <span className="font-semibold">
            {nSel} selecionado{nSel > 1 && 's'}
          </span>
          <select
            aria-label="Mover selecionados para etapa"
            className="h-8 rounded-lg border-0 bg-white/15 pl-2 pr-7 text-sm text-white focus:ring-2 focus:ring-white [&>option]:text-slate-900"
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
            <option value="">Mover para…</option>
            {config.etapas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Alterar temperatura dos selecionados"
            className="h-8 rounded-lg border-0 bg-white/15 pl-2 pr-7 text-sm text-white focus:ring-2 focus:ring-white [&>option]:text-slate-900"
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
            <button className="flex h-8 items-center gap-1 rounded-lg bg-white/15 px-2.5 hover:bg-white/25" onClick={() => setEtiquetaMassa('')}>
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
                setEtiquetaMassa(null);
                limparSelecao();
              }}
            >
              <input
                autoFocus
                value={etiquetaMassa}
                onChange={(e) => setEtiquetaMassa(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setEtiquetaMassa(null))}
                placeholder="Nova etiqueta"
                className="h-8 w-36 rounded-lg border-0 bg-white px-2 text-sm text-slate-900 focus:ring-2 focus:ring-white"
              />
              <button type="submit" className="h-8 rounded-lg bg-white/15 px-2.5 font-medium hover:bg-white/25">
                Adicionar
              </button>
            </form>
          )}
          <button
            className="flex h-8 items-center gap-1 rounded-lg bg-white/15 px-2.5 hover:bg-red-500"
            onClick={async () => {
              if (!(await confirmar({ titulo: `Excluir ${nSel} lead${nSel > 1 ? 's' : ''}?`, mensagem: 'O histórico, tarefas e simulações também serão apagados. Não é possível desfazer.', confirmarLabel: 'Excluir', perigo: true })))
                return;
              await excluirLeads(ids);
              toast(`${nSel} lead${nSel > 1 ? 's' : ''} excluído${nSel > 1 ? 's' : ''}`, { tipo: 'info' });
              limparSelecao();
            }}
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
          <button className="ml-auto rounded-lg p-1.5 hover:bg-white/15" aria-label="Limpar seleção" onClick={limparSelecao}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {lista.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {leads.length === 0 ? (
            <EmptyState
              icone={<Users className="h-6 w-6" />}
              titulo="Nenhum lead ainda"
              descricao="Cadastre o primeiro lead com só nome e telefone."
              acao={<Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => abrirNovoLead()}>Novo lead</Button>}
            />
          ) : filtro === 'nao_contatados_hoje' ? (
            <EmptyState icone={<CheckSquare className="h-6 w-6" />} titulo="Todos os leads foram contatados hoje! 🎉" descricao="Ótimo trabalho. Que tal pedir indicações aos clientes?" />
          ) : (
            <EmptyState icone={<Search className="h-6 w-6" />} titulo="Nenhum lead com esses filtros" acao={<Button onClick={() => (setFiltro(null), setBusca(''))}>Limpar filtros</Button>} />
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 md:block">
            <div className="grid grid-cols-[28px_minmax(180px,1.6fr)_minmax(110px,0.9fr)_150px_minmax(150px,1fr)_auto] items-center gap-3 border-b border-slate-200 bg-slate-50 py-2 pl-5 pr-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <input
                type="checkbox"
                aria-label="Selecionar todos"
                checked={nSel > 0 && nSel === lista.length}
                onChange={(e) => setSelecionados(e.target.checked ? new Set(lista.map((l) => l.id)) : new Set())}
                className="h-4 w-4 accent-brand-600"
              />
              <span>Lead</span>
              <span>Carta / objetivo</span>
              <span>Etapa</span>
              <span>Último contato</span>
              <span className="w-[214px] text-right">Registrar contato</span>
            </div>
            <div role="list">
              {lista.map((l, i) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  proxima={d.proximaTarefaPorLead.get(l.id)}
                  selecionado={selecionados.has(l.id)}
                  focado={i === foco}
                  onSelecionar={alternar}
                  onFocar={() => setFoco(i)}
                />
              ))}
            </div>
          </div>
          {/* Celular */}
          <div role="list" className="space-y-2 md:hidden">
            {lista.map((l, i) => (
              <LeadCardMobile
                key={l.id}
                lead={l}
                proxima={d.proximaTarefaPorLead.get(l.id)}
                selecionado={selecionados.has(l.id)}
                focado={i === foco}
                onSelecionar={alternar}
                onFocar={() => setFoco(i)}
                modoSelecao={modoSelecao}
              />
            ))}
          </div>
          <p className="mt-3 hidden text-center text-xs text-slate-400 md:block">
            Dica: use <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">J</kbd>/<kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">K</kbd> para navegar,{' '}
            <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">L</kbd> para registrar ligação e <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">W</kbd> para WhatsApp.
          </p>
        </>
      )}
    </div>
  );
}
