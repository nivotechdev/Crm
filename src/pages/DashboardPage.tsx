import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarCheck, Gift, Gavel, Phone, Target, TrendingUp, Trophy, UserX } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from '../hooks/useDerivados';
import { conversaoPorEtapa, vendasDoMes } from '../lib/stats';
import { corEtapa } from '../lib/etapas';
import { diasSemContato } from '../lib/contactStatus';
import { diffDiasCalendario, formatDiaSemana, saudacao, tempoRelativoAgenda } from '../lib/dates';
import { formatBRLCompacto, formatTelefone, primeiroNome } from '../lib/format';
import { cn } from '../lib/cn';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';
import { TaskItem } from '../components/agenda/TaskItem';
import { ContactStripe, LastContactBadge } from '../components/leads/LastContactBadge';
import { QuickContactButtons } from '../components/leads/QuickContactButtons';
import { precisaPedirIndicacao } from '../lib/clientes';

export default function DashboardPage() {
  const { leads, atividades, clientes, config } = useData();
  const now = useNow();
  const d = useDerivados();

  const vermelhoApartir = config.laranjaAteDias + 1;
  const atrasados = useMemo(
    () =>
      d.leadsAtivos
        .filter((l) => diasSemContato(l, now) >= vermelhoApartir)
        .sort((a, b) => (a.ultimoContatoEm ?? '').localeCompare(b.ultimoContatoEm ?? '')),
    [d.leadsAtivos, now, vermelhoApartir],
  );
  const atrasadosContatados = atrasados.filter((l) => l.ultimoContatoEm);
  const nunca = d.leadsAtivos.filter((l) => !l.ultimoContatoEm);
  const conversao = useMemo(() => conversaoPorEtapa(leads, atividades, config), [leads, atividades, config]);
  const vendas = vendasDoMes(clientes, now);
  const assembleias = clientes
    .filter((c) => c.status === 'ativo' && c.proximaAssembleia && diffDiasCalendario(c.proximaAssembleia, now) <= 0 && diffDiasCalendario(c.proximaAssembleia, now) >= -7)
    .sort((a, b) => a.proximaAssembleia!.localeCompare(b.proximaAssembleia!));
  const indicacoes = clientes.filter((c) => precisaPedirIndicacao(c, now));

  const meta = Math.max(1, config.metaDiaria);
  const pctMeta = Math.min(1, d.contatosHojeTotal / meta);
  const agenda = [...d.tarefasAtrasadas, ...d.tarefasHoje];
  const abertas = config.etapas.filter((e) => e.tipo === 'aberta');
  const maxFunil = Math.max(1, ...abertas.map((e) => d.leadsAtivos.filter((l) => l.etapaId === e.id).length));

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
          {saudacao(now)}{config.nomeVendedor.trim() ? `, ${primeiroNome(config.nomeVendedor)}` : ''}! 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDiaSemana(now.toISOString())}</p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card className="col-span-2 flex items-center gap-4 p-4 sm:col-span-1">
          <Anel valor={pctMeta} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Meta diária de contatos</p>
            <p className="text-2xl font-bold tabular-nums">
              {d.contatosHojeTotal}
              <span className="text-base font-medium text-slate-400"> / {meta}</span>
            </p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 whitespace-nowrap text-xs text-slate-500">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-sky-600" /> {d.ligacoesHoje} ligações</span>
              <span className="flex items-center gap-1"><WhatsAppIcon className="h-3 w-3 text-emerald-600" /> {d.whatsappsHoje} WhatsApps</span>
            </p>
          </div>
        </Card>
        <Kpi icone={<Target className="h-4 w-4" />} titulo="Contatados hoje" valor={`${d.ativosContatadosHoje} de ${d.leadsAtivos.length}`} sub="leads ativos" to="/leads?filtro=nao_contatados_hoje" />
        <Kpi icone={<Trophy className="h-4 w-4" />} titulo="Vendas do mês" valor={String(vendas.qtd)} sub={`${formatBRLCompacto(vendas.volume)} em cartas`} to="/clientes" destaque />
        <Kpi
          icone={<AlertTriangle className="h-4 w-4" />}
          titulo="Atrasados (7+ dias)"
          valor={String(atrasadosContatados.length)}
          sub={`+ ${nunca.length} nunca contatados`}
          to="/leads?filtro=atrasados"
          alerta={atrasadosContatados.length > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Para hoje */}
        <Card className="lg:col-span-2">
          <CardHeader
            icone={<CalendarCheck className="h-4 w-4" />}
            titulo="Tarefas e retornos de hoje"
            subtitulo={d.tarefasAtrasadas.length ? `${d.tarefasAtrasadas.length} atrasada(s)` : undefined}
            acao={<Link to="/agenda" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Agenda completa</Link>}
          />
          {agenda.length === 0 ? (
            <EmptyState icone={<CalendarCheck className="h-6 w-6" />} titulo="Nada agendado para hoje" descricao="Aproveite para atacar os leads atrasados." />
          ) : (
            <ul className="divide-y divide-slate-100 pb-2 dark:divide-slate-800">
              {agenda.map((t) => (
                <TaskItem key={t.id} tarefa={t} lead={t.leadId ? d.leadPorId.get(t.leadId) : undefined} />
              ))}
            </ul>
          )}
        </Card>

        {/* Funil resumido */}
        <Card>
          <CardHeader icone={<TrendingUp className="h-4 w-4" />} titulo="Funil" acao={<Link to="/funil" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Abrir</Link>} />
          <ul className="space-y-2 px-4 pb-4 sm:px-5">
            {abertas.map((e) => {
              const qtd = d.leadsAtivos.filter((l) => l.etapaId === e.id).length;
              const conv = conversao.find((c) => c.etapa.id === e.id);
              return (
                <li key={e.id}>
                  <Link to={`/leads?etapa=${e.id}`} className="group block">
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 group-hover:text-brand-700 dark:text-slate-300">{e.nome}</span>
                      <span className="tabular-nums text-slate-500">
                        <b className="text-slate-800 dark:text-slate-100">{qtd}</b>
                        {conv && conv.etapa.id !== abertas[0].id && <span className="ml-2 text-slate-400" title="Conversão a partir da etapa anterior">{Math.round(conv.taxa * 100)}%</span>}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={cn('h-full rounded-full', corEtapa(e).bar)} style={{ width: `${(qtd / maxFunil) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
            {(() => {
              const g = conversao[conversao.length - 1];
              return (
                g && (
                  <li className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">Conversão total em vendas</span>
                    <span className="font-semibold tabular-nums">{conversao[0].alcancaram ? Math.round((g.alcancaram / conversao[0].alcancaram) * 100) : 0}%</span>
                  </li>
                )
              );
            })()}
          </ul>
        </Card>

        {/* Atrasados */}
        <Card className="lg:col-span-2">
          <CardHeader
            icone={<UserX className="h-4 w-4" />}
            titulo="Leads atrasados"
            subtitulo={`Sem contato há ${vermelhoApartir}+ dias ou nunca contatados`}
            acao={<Link to="/leads?filtro=atrasados" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Ver todos <ArrowRight className="h-3 w-3" /></Link>}
          />
          {atrasados.length === 0 ? (
            <EmptyState titulo="Nenhum lead atrasado 🎉" descricao="Todos os leads ativos foram contatados recentemente." />
          ) : (
            <ul className="divide-y divide-slate-100 pb-2 dark:divide-slate-800">
              {atrasados.slice(0, 7).map((l) => (
                <li key={l.id} className="relative flex items-center gap-3 py-2.5 pl-5 pr-3">
                  <ContactStripe ultimoContatoEm={l.ultimoContatoEm} className="w-1" />
                  <Link to={`/leads/${l.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 hover:text-brand-700 dark:text-white">{l.nome}</p>
                    <p className="truncate text-xs text-slate-500">{formatTelefone(l.telefone)}</p>
                  </Link>
                  <LastContactBadge ultimoContatoEm={l.ultimoContatoEm} canal={l.ultimoContatoCanal} compacto />
                  <QuickContactButtons lead={l} tamanho="sm" soIcone />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Pós-venda */}
        <Card>
          <CardHeader icone={<Gavel className="h-4 w-4" />} titulo="Pós-venda" acao={<Link to="/clientes" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Clientes</Link>} />
          <div className="space-y-3 px-4 pb-4 sm:px-5">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Assembleias nos próximos 7 dias</p>
              {assembleias.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma.</p>
              ) : (
                <ul className="space-y-1">
                  {assembleias.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <Link to={`/clientes?id=${c.id}`} className="truncate hover:text-brand-700">{c.nome}</Link>
                      <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">{tempoRelativoAgenda(c.proximaAssembleia!, now)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link to="/clientes?filtro=indicacao" className="flex items-center gap-3 rounded-xl bg-violet-50 p-3 text-sm hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20">
              <Gift className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              <span className="flex-1 text-violet-900 dark:text-violet-200">
                <b>{indicacoes.length}</b> cliente(s) para pedir indicação
              </span>
              <ArrowRight className="h-4 w-4 text-violet-500" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icone, titulo, valor, sub, to, alerta, destaque }: { icone: ReactNode; titulo: string; valor: string; sub?: string; to: string; alerta?: boolean; destaque?: boolean }) {
  return (
    <Link to={to} className="block">
      <Card className="h-full p-4 transition-shadow hover:shadow-md">
        <p className={cn('flex items-center gap-1.5 text-xs font-medium', alerta ? 'text-red-600 dark:text-red-400' : destaque ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400')}>
          {icone} {titulo}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{valor}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </Card>
    </Link>
  );
}

function Anel({ valor }: { valor: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const ok = valor >= 1;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - valor)}
          className={cn('transition-all duration-500', ok ? 'stroke-emerald-500' : 'stroke-brand-500')}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{Math.round(valor * 100)}%</span>
    </div>
  );
}
