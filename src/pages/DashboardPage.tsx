import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarPlus, Pencil, Phone, Settings } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from '../hooks/useDerivados';
import { conversaoPorEtapa, vendasDoMes } from '../lib/stats';
import { diasSemContato } from '../lib/contactStatus';
import { diffDiasCalendario, formatDiaSemana, saudacao, tempoRelativoAgenda } from '../lib/dates';
import { formatBRLCompacto, formatTelefone, primeiroNome } from '../lib/format';
import { precisaPedirIndicacao } from '../lib/clientes';
import { cn } from '../lib/cn';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';
import { TaskItem } from '../components/agenda/TaskItem';
import { ContactStripe, LastContactBadge } from '../components/leads/LastContactBadge';
import { QuickContactButtons } from '../components/leads/QuickContactButtons';
import { MetaModal } from '../components/dashboard/MetaModal';
import { Button } from '../components/ui/Button';
import { useAcoes } from '../store/AcoesContext';

export default function DashboardPage() {
  const { leads, atividades, clientes, config } = useData();
  const now = useNow();
  const d = useDerivados();
  const { abrirAgendamento } = useAcoes();
  const [editarMeta, setEditarMeta] = useState(false);

  const vermelhoApartir = config.laranjaAteDias + 1;
  const atrasados = useMemo(
    () =>
      d.leadsAtivos
        .filter((l) => diasSemContato(l, now) >= vermelhoApartir)
        .sort((a, b) => (a.ultimoContatoEm ?? '').localeCompare(b.ultimoContatoEm ?? '')),
    [d.leadsAtivos, now, vermelhoApartir],
  );
  const atrasadosContatados = atrasados.filter((l) => l.ultimoContatoEm).length;
  const nunca = d.leadsAtivos.filter((l) => !l.ultimoContatoEm).length;
  const conversao = useMemo(() => conversaoPorEtapa(leads, atividades, config), [leads, atividades, config]);
  const vendas = vendasDoMes(clientes, now);
  const assembleias = clientes
    .filter((c) => c.status === 'ativo' && c.proximaAssembleia && diffDiasCalendario(c.proximaAssembleia, now) <= 0 && diffDiasCalendario(c.proximaAssembleia, now) >= -7)
    .sort((a, b) => a.proximaAssembleia!.localeCompare(b.proximaAssembleia!));
  const indicacoes = clientes.filter((c) => precisaPedirIndicacao(c, now));

  const meta = Math.max(1, config.metaDiaria);
  const pctMeta = Math.min(1, d.contatosHojeTotal / meta);
  const faltam = Math.max(0, meta - d.contatosHojeTotal);
  const agenda = [...d.tarefasAtrasadas, ...d.tarefasHoje];
  const abertas = config.etapas.filter((e) => e.tipo === 'aberta');
  const maxFunil = Math.max(1, ...abertas.map((e) => d.leadsAtivos.filter((l) => l.etapaId === e.id).length));
  const totalConv = conversao[0]?.alcancaram ? Math.round((conversao[conversao.length - 1].alcancaram / conversao[0].alcancaram) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-8 md:py-8">
      <header className="mb-6 flex items-start justify-between gap-3 md:mb-8">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-400">{formatDiaSemana(now.toISOString())}</p>
          <h1 className="mt-1 truncate text-[26px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white md:text-[30px]">
            {saudacao(now)}
            {config.nomeVendedor.trim() ? `, ${primeiroNome(config.nomeVendedor)}` : ''}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variante="primario" icone={<CalendarPlus className="h-4 w-4" />} onClick={() => abrirAgendamento({ tipo: 'reuniao' })} className="hidden sm:inline-flex">
            Agendar
          </Button>
          <Link
            to="/configuracoes"
            aria-label="Configurações"
            title="Configurações (G S)"
            className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4"
          >
            <Settings className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Configurações</span>
          </Link>
        </div>
      </header>

      {/* Meta do dia + indicadores */}
      <div className="mb-4 grid gap-3 md:mb-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Card className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Contatos hoje · meta {meta}</p>
              <button type="button" onClick={() => setEditarMeta(true)} className="num mt-1 text-left text-4xl font-bold tracking-tight text-slate-900 dark:text-white" title="Editar meta diária">
                {d.contatosHojeTotal}
                <span className="text-xl font-semibold text-slate-300 dark:text-slate-600"> / {meta}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', pctMeta >= 1 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300')}>
                {pctMeta >= 1 ? 'Meta batida' : `Faltam ${faltam}`}
              </span>
              <button
                type="button"
                onClick={() => setEditarMeta(true)}
                aria-label="Editar meta diária"
                title="Editar meta diária"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={cn('h-full rounded-full transition-all duration-500', pctMeta >= 1 ? 'bg-emerald-500' : 'bg-brand-500')} style={{ width: `${pctMeta * 100}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-500 dark:text-slate-400">
            <span className="num flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-brand-600" /> {d.ligacoesHoje} ligações
            </span>
            <span className="num flex items-center gap-1.5">
              <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" /> {d.whatsappsHoje} WhatsApps
            </span>
            <span className="num">
              {d.ativosContatadosHoje} de {d.leadsAtivos.length} leads ativos
            </span>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-3 lg:contents">
          <Kpi titulo="Vendas" valor={String(vendas.qtd)} sub={formatBRLCompacto(vendas.volume)} to="/clientes" />
          <Kpi titulo="Atrasados" valor={String(atrasadosContatados)} sub={`+${nunca} nunca`} to="/leads?filtro=atrasados" alerta={atrasadosContatados > 0} />
          <Kpi titulo="Retornos" valor={String(agenda.length)} sub={d.tarefasAtrasadas.length ? `${d.tarefasAtrasadas.length} atrasado(s)` : 'em dia'} to="/agenda" />
        </div>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            titulo="Para hoje"
            subtitulo="Retornos, reuniões e tarefas"
            acao={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => abrirAgendamento({ tipo: 'reuniao' })}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                >
                  <CalendarPlus className="h-4 w-4" /> Agendar
                </button>
                <VerTudo to="/agenda" />
              </div>
            }
          />
          {agenda.length === 0 ? (
            <EmptyState titulo="Nada agendado para hoje" descricao="Aproveite para atacar os leads atrasados." />
          ) : (
            <ul className="divide-y divide-slate-100 pb-3 dark:divide-slate-800">
              {agenda.map((t) => (
                <TaskItem key={t.id} tarefa={t} lead={t.leadId ? d.leadPorId.get(t.leadId) : undefined} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Funil" subtitulo={`${d.leadsAtivos.length} leads ativos · ${totalConv}% viram venda`} acao={<VerTudo to="/leads" />} />
          <ul className="space-y-3.5 px-5 pb-5">
            {abertas.map((e) => {
              const qtd = d.leadsAtivos.filter((l) => l.etapaId === e.id).length;
              const conv = conversao.find((c) => c.etapa.id === e.id);
              return (
                <li key={e.id}>
                  <Link to={`/leads?etapa=${e.id}`} className="group block">
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="font-medium text-slate-700 group-hover:text-brand-700 dark:text-slate-300 dark:group-hover:text-brand-300">{e.nome}</span>
                      <span className="num flex items-baseline gap-2">
                        {conv && e.id !== abertas[0].id && <span className="text-[11px] text-slate-400" title="Conversão a partir da etapa anterior">{Math.round(conv.taxa * 100)}%</span>}
                        <b className="font-semibold text-slate-900 dark:text-white">{qtd}</b>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(qtd / maxFunil) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader titulo="Precisam de atenção" subtitulo={`Sem contato há ${vermelhoApartir}+ dias ou nunca contatados`} acao={<VerTudo to="/leads?filtro=atrasados" />} />
          {atrasados.length === 0 ? (
            <EmptyState titulo="Nenhum lead atrasado" descricao="Todos os leads ativos foram contatados recentemente." />
          ) : (
            <ul className="divide-y divide-slate-100 pb-3 dark:divide-slate-800">
              {atrasados.slice(0, 6).map((l) => (
                <li key={l.id} className="relative flex items-center gap-3 py-3 pl-5 pr-4">
                  <ContactStripe ultimoContatoEm={l.ultimoContatoEm} className="inset-y-3 w-[3px] rounded-r-full" />
                  <Link to={`/leads/${l.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 hover:text-brand-700 dark:text-white">{l.nome}</p>
                    <p className="num truncate text-xs text-slate-500">{formatTelefone(l.telefone)}</p>
                  </Link>
                  <LastContactBadge ultimoContatoEm={l.ultimoContatoEm} canal={l.ultimoContatoCanal} compacto className="hidden sm:inline-flex" />
                  <QuickContactButtons lead={l} tamanho="sm" soIcone />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Pós-venda" subtitulo="Assembleias nos próximos 7 dias" acao={<VerTudo to="/clientes" />} />
          <div className="px-5 pb-5">
            {assembleias.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma assembleia próxima.</p>
            ) : (
              <ul className="space-y-2.5">
                {assembleias.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/clientes?id=${c.id}`} className="truncate font-medium text-slate-800 hover:text-brand-700 dark:text-slate-200">
                      {c.nome}
                    </Link>
                    <span className="shrink-0 text-xs font-medium text-slate-500">{tempoRelativoAgenda(c.proximaAssembleia!, now)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/clientes?filtro=indicacao"
              className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-sm transition-colors hover:bg-brand-50 dark:bg-slate-800/60 dark:hover:bg-brand-500/10"
            >
              <span className="num flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-600 dark:bg-slate-900">{indicacoes.length}</span>
              <span className="flex-1 font-medium text-slate-700 dark:text-slate-200">clientes para pedir indicação</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </Card>
      </div>
      <MetaModal aberto={editarMeta} onFechar={() => setEditarMeta(false)} />
    </div>
  );
}

function VerTudo({ to }: { to: string }) {
  return (
    <Link to={to} aria-label="Ver tudo" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function Kpi({ titulo, valor, sub, to, alerta }: { titulo: string; valor: string; sub?: ReactNode; to: string; alerta?: boolean }) {
  return (
    <Link to={to} className="group block min-w-0">
      <Card className="flex h-full flex-col justify-between p-4 transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-700 md:p-5">
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 md:text-[13px]">{titulo}</p>
        <div className="mt-2">
          <p className={cn('num text-2xl font-bold tracking-tight md:text-[28px]', alerta ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>{valor}</p>
          {sub && <p className="num truncate text-xs text-slate-400">{sub}</p>}
        </div>
      </Card>
    </Link>
  );
}
