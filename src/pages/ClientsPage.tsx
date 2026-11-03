import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, ExternalLink, Gavel, Gift, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import type { Cliente, StatusCliente } from '../types';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useToast } from '../store/ToastContext';
import { useNow } from '../store/NowContext';
import { diasAteAssembleia, precisaPedirIndicacao } from '../lib/clientes';
import { formatData, fromInputDate, tempoRelativoAgenda, toInputDate } from '../lib/dates';
import { formatBRL, formatBRLCompacto, formatTelefone, mascaraTelefone, normalizarBusca, somenteDigitos } from '../lib/format';
import { SIM_NAO_TALVEZ, STATUS_CLIENTE, TIPOS_BEM, opcoes } from '../lib/labels';
import { abrirWhatsApp, linkTelefone, preencherModelo } from '../lib/whatsapp';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, inputBase } from '../components/ui/Field';
import { CampoLinha, InlineMoney, InlineSelect, InlineText, InlineTextarea } from '../components/ui/Inline';
import { Modal } from '../components/ui/Modal';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';
import { PageHeader } from '../components/layout/PageHeader';

type Filtro = 'todos' | StatusCliente | 'indicacao' | 'assembleia';

const STATUS_COR: Record<StatusCliente, string> = {
  ativo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  contemplado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  cancelado: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
};

export default function ClientsPage() {
  const { clientes, config, registrarPedidoIndicacao } = useData();
  const toast = useToast();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [novo, setNovo] = useState(false);
  const filtro = (params.get('filtro') as Filtro) || 'todos';
  const abertoId = params.get('id');
  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const assembleiaProxima = (c: Cliente) => {
    const d = diasAteAssembleia(c, now);
    return c.status === 'ativo' && d !== null && d >= 0 && d <= 7;
  };

  const contagem = {
    todos: clientes.length,
    ativo: clientes.filter((c) => c.status === 'ativo').length,
    contemplado: clientes.filter((c) => c.status === 'contemplado').length,
    cancelado: clientes.filter((c) => c.status === 'cancelado').length,
    indicacao: clientes.filter((c) => precisaPedirIndicacao(c, now)).length,
    assembleia: clientes.filter(assembleiaProxima).length,
  };

  const lista = useMemo(() => {
    const t = normalizarBusca(busca);
    const dig = somenteDigitos(busca);
    return clientes
      .filter((c) => {
        if (filtro === 'indicacao') return precisaPedirIndicacao(c, now);
        if (filtro === 'assembleia') return assembleiaProxima(c);
        return filtro === 'todos' || c.status === filtro;
      })
      .filter(
        (c) =>
          !t ||
          normalizarBusca(c.nome).includes(t) ||
          normalizarBusca(`${c.administradora ?? ''} ${c.grupo ?? ''} ${c.cota ?? ''}`).includes(t) ||
          (dig.length >= 3 && c.telefone.includes(dig)),
      )
      .sort((a, b) => (a.proximaAssembleia ?? '9999').localeCompare(b.proximaAssembleia ?? '9999'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, filtro, busca, now]);

  const volumeTotal = clientes.filter((c) => c.status !== 'cancelado').reduce((s, c) => s + (c.valorCarta ?? 0), 0);
  const aberto = clientes.find((c) => c.id === abertoId) ?? null;
  const modeloIndicacao = config.modelos.find((m) => m.id === 'm-indicacao') ?? config.modelos.find((m) => /indica/i.test(m.nome));
  const modeloAssembleia = config.modelos.find((m) => m.id === 'm-assembleia') ?? config.modelos.find((m) => /assembl/i.test(m.nome));
  const alertasAssembleia = clientes.filter(assembleiaProxima).sort((a, b) => a.proximaAssembleia!.localeCompare(b.proximaAssembleia!));
  const alertasIndicacao = clientes.filter((c) => precisaPedirIndicacao(c, now));

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        titulo="Clientes"
        subtitulo={`${clientes.length} cotas vendidas · ${formatBRLCompacto(volumeTotal)} em carteira ativa`}
        acoes={
          <>
            <Link to="/" className="lg:hidden">
              <Button icone={<ArrowLeft className="h-4 w-4" />} aria-label="Voltar para o início">
                <span className="hidden sm:inline">Início</span>
              </Button>
            </Link>
            <Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => setNovo(true)}>
              <span className="hidden sm:inline">Novo cliente</span>
            </Button>
          </>
        }
      />

      {/* Alertas */}
      {(alertasAssembleia.length > 0 || alertasIndicacao.length > 0) && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {alertasAssembleia.length > 0 && (
            <Card>
              <CardHeader icone={<Gavel className="h-4 w-4" />} titulo="Assembleias nos próximos 7 dias" />
              <ul className="divide-y divide-slate-100 px-5 pb-3 dark:divide-slate-800">
                {alertasAssembleia.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 py-2">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setParam('id', c.id)}>
                      <p className="truncate text-sm font-medium">{c.nome}</p>
                      <p className="text-xs text-slate-500">
                        Grupo {c.grupo ?? '—'} · lance: {c.pretendeLance ? SIM_NAO_TALVEZ[c.pretendeLance] : '—'}
                        {c.valorLance ? ` (${formatBRLCompacto(c.valorLance)})` : ''}
                      </p>
                    </button>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      {tempoRelativoAgenda(c.proximaAssembleia!, now)}
                    </span>
                    {modeloAssembleia && (
                      <Button tamanho="sm" variante="whatsapp" aria-label="Lembrar no WhatsApp" className="w-8 px-0" onClick={() => abrirWhatsApp(c.telefone, preencherModelo(modeloAssembleia.texto, c, config))}>
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {alertasIndicacao.length > 0 && (
            <Card>
              <CardHeader icone={<Gift className="h-4 w-4" />} titulo="Peça indicações" subtitulo="Clientes satisfeitos são sua melhor fonte de leads" />
              <ul className="divide-y divide-slate-100 px-5 pb-3 dark:divide-slate-800">
                {alertasIndicacao.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 py-2">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setParam('id', c.id)}>
                      <p className="truncate text-sm font-medium">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.indicacaoPedidaEm ? `Último pedido: ${formatData(c.indicacaoPedidaEm)}` : 'Nunca pediu indicação'}</p>
                    </button>
                    <Button
                      tamanho="sm"
                      variante="whatsapp"
                      icone={<WhatsAppIcon className="h-4 w-4" />}
                      onClick={() => {
                        abrirWhatsApp(c.telefone, modeloIndicacao ? preencherModelo(modeloIndicacao.texto, c, config) : undefined);
                        registrarPedidoIndicacao(c.id).then(() => toast(`Pedido de indicação registrado · ${c.nome}`));
                      }}
                    >
                      Pedir
                    </Button>
                  </li>
                ))}
                {alertasIndicacao.length > 5 && (
                  <li className="py-2 text-center">
                    <button className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300" onClick={() => setParam('filtro', 'indicacao')}>
                      Ver todos ({alertasIndicacao.length})
                    </button>
                  </li>
                )}
              </ul>
            </Card>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, administradora, grupo…" className={cn(inputBase, 'h-10 rounded-full pl-10')} aria-label="Buscar clientes" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {(
            [
              ['todos', 'Todos'],
              ['ativo', 'Ativos'],
              ['contemplado', 'Contemplados'],
              ['cancelado', 'Cancelados'],
              ['assembleia', 'Assembleia próxima'],
              ['indicacao', 'Pedir indicação'],
            ] as Array<[Filtro, string]>
          ).map(([v, l]) => (
            <Chip key={v} ativo={filtro === v} contador={contagem[v]} onClick={() => setParam('filtro', v === 'todos' ? null : v)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icone={<UserCheck className="h-6 w-6" />}
            titulo={clientes.length ? 'Nenhum cliente com esse filtro' : 'Nenhum cliente ainda'}
            descricao={clientes.length ? undefined : 'Ao mover um lead para "Fechado (ganho)", ele aparece aqui automaticamente.'}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => {
            const dias = diasAteAssembleia(c, now);
            return (
              <button
                key={c.id}
                onClick={() => setParam('id', c.id)}
                className="rounded-3xl border border-slate-200/80 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <Avatar nome={c.nome} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{c.nome}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.administradora ?? 'Administradora —'} · Gr {c.grupo ?? '—'} / Cota {c.cota ?? '—'}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', STATUS_COR[c.status])}>{STATUS_CLIENTE[c.status]}</span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="num text-xl font-bold tracking-tight">{formatBRL(c.valorCarta)}</p>
                    <p className="text-xs text-slate-500">
                      {c.tipoBem ? TIPOS_BEM[c.tipoBem] : '—'} · {c.prazoMeses ? `${c.prazoMeses} meses` : 'prazo —'} · vendido {formatData(c.dataVenda)}
                    </p>
                  </div>
                </div>
                {c.status === 'ativo' && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                    <span className={cn('flex items-center gap-1', dias !== null && dias >= 0 && dias <= 7 ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-slate-500')}>
                      <CalendarClock className="h-3.5 w-3.5" />
                      {c.proximaAssembleia ? `Assembleia ${tempoRelativoAgenda(c.proximaAssembleia, now).toLowerCase()} (${formatData(c.proximaAssembleia, { ano: false })})` : 'Assembleia não informada'}
                    </span>
                    {c.pretendeLance && <span className="text-slate-500">· Lance: {SIM_NAO_TALVEZ[c.pretendeLance]}</span>}
                    {precisaPedirIndicacao(c, now) && (
                      <span className="font-medium text-brand-700 dark:text-brand-300">· Pedir indicação</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ClienteModal cliente={aberto} onFechar={() => setParam('id', null)} />
      <NovoClienteModal aberto={novo} onFechar={() => setNovo(false)} />
    </div>
  );
}

function ClienteModal({ cliente: c, onFechar }: { cliente: Cliente | null; onFechar: () => void }) {
  const { atualizarCliente, excluirCliente, registrarPedidoIndicacao, config } = useData();
  const { confirmar } = useAcoes();
  const toast = useToast();
  if (!c) return <Modal aberto={false} onFechar={onFechar}>{null}</Modal>;
  const salvar = (patch: Partial<Cliente>) => atualizarCliente(c.id, patch).then(() => toast('Salvo', { duracao: 1200 }));
  const modeloIndicacao = config.modelos.find((m) => m.id === 'm-indicacao');

  return (
    <Modal aberto onFechar={onFechar} titulo={c.nome} subtitulo={formatTelefone(c.telefone)} tamanho="lg">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <a href={linkTelefone(c.telefone)} className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">
          Ligar
        </a>
        <Button variante="whatsapp" className="h-11" icone={<WhatsAppIcon className="h-4 w-4" />} onClick={() => abrirWhatsApp(c.telefone)}>
          WhatsApp
        </Button>
        <Button
          className="col-span-2 h-11 sm:col-span-1"
          icone={<Gift className="h-4 w-4" />}
          onClick={() => {
            abrirWhatsApp(c.telefone, modeloIndicacao ? preencherModelo(modeloIndicacao.texto, c, config) : undefined);
            registrarPedidoIndicacao(c.id).then(() => toast('Pedido de indicação registrado'));
          }}
        >
          Pedir indicação
        </Button>
      </div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <div>
          <CampoLinha label="Status">
            <InlineSelect valor={c.status} opcoes={opcoes(STATUS_CLIENTE)} onSalvar={(v) => v && salvar({ status: v })} />
          </CampoLinha>
          <CampoLinha label="Administradora">
            <InlineText valor={c.administradora} placeholder="Adicionar" onSalvar={(v) => salvar({ administradora: v || undefined })} />
          </CampoLinha>
          <CampoLinha label="Grupo">
            <InlineText valor={c.grupo} placeholder="—" onSalvar={(v) => salvar({ grupo: v || undefined })} />
          </CampoLinha>
          <CampoLinha label="Cota">
            <InlineText valor={c.cota} placeholder="—" onSalvar={(v) => salvar({ cota: v || undefined })} />
          </CampoLinha>
          <CampoLinha label="Tipo de bem">
            <InlineSelect valor={c.tipoBem} opcoes={opcoes(TIPOS_BEM)} onSalvar={(v) => salvar({ tipoBem: v })} />
          </CampoLinha>
          <CampoLinha label="Valor da carta">
            <InlineMoney valor={c.valorCarta} onSalvar={(v) => salvar({ valorCarta: v })} />
          </CampoLinha>
        </div>
        <div>
          <CampoLinha label="Prazo (meses)">
            <InlineText valor={c.prazoMeses ? String(c.prazoMeses) : ''} inputMode="numeric" placeholder="—" onSalvar={(v) => salvar({ prazoMeses: v ? Number(v.replace(/\D/g, '')) : undefined })} />
          </CampoLinha>
          <CampoLinha label="Data da venda">
            <input type="date" className="-mx-2 h-9 w-[calc(100%+1rem)] rounded-lg border-0 bg-transparent px-2 text-sm hover:bg-slate-100 focus:ring-2 focus:ring-brand-500 dark:hover:bg-slate-800" value={toInputDate(c.dataVenda)} onChange={(e) => e.target.value && salvar({ dataVenda: fromInputDate(e.target.value)! })} />
          </CampoLinha>
          <CampoLinha label="Próx. assembleia">
            <input type="date" className="-mx-2 h-9 w-[calc(100%+1rem)] rounded-lg border-0 bg-transparent px-2 text-sm hover:bg-slate-100 focus:ring-2 focus:ring-brand-500 dark:hover:bg-slate-800" value={toInputDate(c.proximaAssembleia)} onChange={(e) => salvar({ proximaAssembleia: fromInputDate(e.target.value, '19:00') })} />
          </CampoLinha>
          <CampoLinha label="Pretende dar lance?">
            <InlineSelect valor={c.pretendeLance} opcoes={opcoes(SIM_NAO_TALVEZ)} onSalvar={(v) => salvar({ pretendeLance: v })} />
          </CampoLinha>
          {c.pretendeLance && c.pretendeLance !== 'nao' && (
            <CampoLinha label="Valor do lance">
              <InlineMoney valor={c.valorLance} onSalvar={(v) => salvar({ valorLance: v })} />
            </CampoLinha>
          )}
          <CampoLinha label="Indicação pedida">
            <span className="text-sm">{c.indicacaoPedidaEm ? formatData(c.indicacaoPedidaEm) : 'Nunca'}</span>
          </CampoLinha>
        </div>
      </div>
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Observações</p>
        <InlineTextarea valor={c.observacoes} onSalvar={(v) => salvar({ observacoes: v || undefined })} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        {c.leadId ? (
          <Link to={`/leads/${c.leadId}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Ver histórico do lead <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span />
        )}
        <button
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          onClick={async () => {
            if (await confirmar({ titulo: `Excluir o cliente ${c.nome}?`, mensagem: 'O lead de origem (se houver) não é apagado.', confirmarLabel: 'Excluir', perigo: true })) {
              await excluirCliente(c.id);
              toast('Cliente excluído', { tipo: 'info' });
              onFechar();
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </button>
      </div>
    </Modal>
  );
}

function NovoClienteModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { criarCliente } = useData();
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [erro, setErro] = useState('');
  const salvar = async () => {
    if (!nome.trim() || somenteDigitos(tel).length < 10) return setErro('Informe nome e telefone com DDD');
    await criarCliente({ nome: nome.trim(), telefone: tel, status: 'ativo', dataVenda: new Date().toISOString() });
    toast('Cliente criado — complete os dados na ficha');
    setNome('');
    setTel('');
    setErro('');
    onFechar();
  };
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Novo cliente"
      subtitulo="Para vendas que não passaram pelo funil"
      tamanho="sm"
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar}>Cancelar</Button>
          <Button variante="primario" onClick={salvar}>Salvar</Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={(e) => (e.preventDefault(), salvar())}>
        <Field label="Nome" obrigatorio>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label="Telefone" obrigatorio>
          <Input value={tel} inputMode="tel" onChange={(e) => setTel(mascaraTelefone(e.target.value))} placeholder="(62) 99999-9999" />
        </Field>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
