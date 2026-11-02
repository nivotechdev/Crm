import { useMemo, useState } from 'react';
import { BarChart3, Filter, MapPin, ThumbsDown, Trophy } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useNow } from '../store/NowContext';
import { contatosPorDia, contatosPorSemana, conversaoPorEtapa, conversaoPorOrigem, motivosDePerda, vendasPorMes } from '../lib/stats';
import { formatBRL, formatBRLCompacto } from '../lib/format';
import { formatDataCurta } from '../lib/dates';
import { MOTIVOS_PERDA } from '../lib/labels';
import { cn } from '../lib/cn';
import { Card, CardHeader } from '../components/ui/Card';
import { Segmented } from '../components/ui/Segmented';
import { EmptyState } from '../components/ui/EmptyState';
import { BarrasEmpilhadas, BarrasHorizontais } from '../components/ui/Charts';
import { PageHeader } from '../components/layout/PageHeader';

type Periodo = '7' | '30' | '90';

export default function ReportsPage() {
  const { leads, atividades, clientes, config } = useData();
  const now = useNow();
  const [periodo, setPeriodo] = useState<Periodo>('30');
  const [agrup, setAgrup] = useState<'dia' | 'semana'>('dia');

  const dias = Number(periodo);
  const porDia = useMemo(() => contatosPorDia(atividades, dias, now), [atividades, dias, now]);
  const porSemana = useMemo(() => contatosPorSemana(atividades, Math.max(4, Math.ceil(dias / 7)), now), [atividades, dias, now]);
  const serie = agrup === 'dia' ? porDia : porSemana;
  const totalLig = porDia.reduce((s, d) => s + d.ligacoes, 0);
  const totalWpp = porDia.reduce((s, d) => s + d.whatsapps, 0);
  const diasUteis = porDia.filter((d) => d.data.getDay() !== 0).length || 1;
  const conversao = useMemo(() => conversaoPorEtapa(leads, atividades, config), [leads, atividades, config]);
  const perdas = useMemo(() => motivosDePerda(leads, config), [leads, config]);
  const origens = useMemo(() => conversaoPorOrigem(leads, config), [leads, config]);
  const vendas = useMemo(() => vendasPorMes(clientes, 6, now), [clientes, now]);
  const totalPerdas = perdas.reduce((s, p) => s + p.qtd, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader titulo="Relatórios" subtitulo="Acompanhe seu ritmo e o que mais converte" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader
            icone={<BarChart3 className="h-4 w-4" />}
            titulo="Contatos realizados"
            subtitulo={`${totalLig + totalWpp} contatos · média ${((totalLig + totalWpp) / diasUteis).toFixed(1)}/dia útil · meta ${config.metaDiaria}/dia`}
            acao={
              <div className="hidden gap-2 sm:flex">
                <Segmented valor={agrup} onChange={setAgrup} opcoes={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }]} />
                <Segmented valor={periodo} onChange={setPeriodo} opcoes={[{ value: '7', label: '7d' }, { value: '30', label: '30d' }, { value: '90', label: '90d' }]} />
              </div>
            }
          />
          <div className="flex gap-2 px-4 sm:hidden">
            <Segmented valor={agrup} onChange={setAgrup} opcoes={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }]} />
            <Segmented valor={periodo} onChange={setPeriodo} opcoes={[{ value: '7', label: '7d' }, { value: '30', label: '30d' }, { value: '90', label: '90d' }]} />
          </div>
          <div className="px-4 pb-4 pt-2 sm:px-5">
            <BarrasEmpilhadas
              dados={serie.map((d) => ({
                label: agrup === 'dia' ? String(d.data.getDate()) : formatDataCurta(d.data.toISOString()),
                titulo: agrup === 'dia' ? formatDataCurta(d.data.toISOString()) : `Semana de ${formatDataCurta(d.data.toISOString())}`,
                valores: [d.ligacoes, d.whatsapps],
              }))}
              cores={['bg-brand-500', 'bg-emerald-500']}
              legendas={[`Ligações (${totalLig})`, `WhatsApp (${totalWpp})`]}
              mostrarCadaN={agrup === 'dia' && dias > 30 ? 7 : agrup === 'dia' && dias > 7 ? 3 : 1}
            />
          </div>
        </Card>

        <Card>
          <CardHeader icone={<Filter className="h-4 w-4" />} titulo="Conversão por etapa" subtitulo="Leads que alcançaram cada etapa (pelo histórico)" />
          <ul className="space-y-3.5 px-5 pb-5">
            {conversao.map((c, i) => (
              <li key={c.etapa.id}>
                <div className="mb-0.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{c.etapa.nome}</span>
                  <span className="tabular-nums text-slate-500">
                    <b className="text-slate-800 dark:text-slate-100">{c.alcancaram}</b>
                    {i > 0 && (
                      <span className="ml-2 font-medium text-slate-400">
                        {Math.round(c.taxa * 100)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={cn('h-full rounded-full', c.etapa.tipo === 'ganho' ? 'bg-emerald-500' : 'bg-brand-500')} style={{ width: `${conversao[0].alcancaram ? (c.alcancaram / conversao[0].alcancaram) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader icone={<ThumbsDown className="h-4 w-4" />} titulo="Motivos de perda" subtitulo={`${totalPerdas} leads perdidos`} />
          <div className="px-5 pb-5">
            {perdas.length === 0 ? (
              <EmptyState titulo="Nenhuma perda registrada" />
            ) : (
              <BarrasHorizontais
                cor="bg-slate-400 dark:bg-slate-500"
                itens={perdas.map((p) => ({ label: MOTIVOS_PERDA[p.motivo], valor: p.qtd, texto: `${p.qtd} (${Math.round((p.qtd / totalPerdas) * 100)}%)` }))}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader icone={<MapPin className="h-4 w-4" />} titulo="Origem dos leads" subtitulo="Ordenado pela taxa de conversão em venda" />
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="py-1.5 font-semibold">Origem</th>
                  <th className="py-1.5 text-right font-semibold">Leads</th>
                  <th className="py-1.5 text-right font-semibold">Vendas</th>
                  <th className="py-1.5 text-right font-semibold">Conversão</th>
                  <th className="hidden py-1.5 text-right font-semibold sm:table-cell">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {origens.map((o) => (
                  <tr key={o.origem}>
                    <td className="py-2 font-medium">{o.origem}</td>
                    <td className="py-2 text-right tabular-nums">{o.total}</td>
                    <td className="py-2 text-right tabular-nums">{o.ganhos}</td>
                    <td className="py-2 text-right">
                      <span className={cn('num text-[13px] font-semibold', o.taxa > 0 ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400')}>
                        {Math.round(o.taxa * 100)}%
                      </span>
                    </td>
                    <td className="hidden py-2 text-right tabular-nums text-slate-500 sm:table-cell">{formatBRLCompacto(o.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            icone={<Trophy className="h-4 w-4" />}
            titulo="Volume vendido por mês"
            subtitulo={`Últimos 6 meses · ${formatBRL(vendas.reduce((s, v) => s + v.volume, 0))} em ${vendas.reduce((s, v) => s + v.qtd, 0)} cotas`}
          />
          <div className="px-5 pb-5">
            <div className="flex h-44 items-end gap-2" role="img" aria-label="Volume vendido por mês">
              {vendas.map((v) => {
                const max = Math.max(1, ...vendas.map((x) => x.volume));
                return (
                  <div key={`${v.ano}-${v.mes}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${v.label}: ${formatBRL(v.volume)} (${v.qtd} cotas)`}>
                    <span className="text-[10px] font-semibold tabular-nums text-slate-500">{v.volume ? formatBRLCompacto(v.volume).replace('R$ ', '') : ''}</span>
                    <div className="w-full rounded-t-lg bg-brand-500" style={{ height: `${(v.volume / max) * 100}%`, minHeight: v.volume ? 4 : 2, opacity: v.volume ? 1 : 0.2 }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex gap-2">
              {vendas.map((v) => (
                <span key={`${v.ano}-${v.mes}`} className="flex-1 text-center text-[11px] capitalize text-slate-500">
                  {v.label}
                  <span className="block text-[10px] text-slate-400">{v.qtd} cota{v.qtd === 1 ? '' : 's'}</span>
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
