import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CalendarPlus, Check, MessageSquareText, ClipboardEdit, Phone, Send, Trash2 } from 'lucide-react';
import type { Lead, Temperatura } from '../types';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useToast } from '../store/ToastContext';
import { useNow } from '../store/NowContext';
import { useHotkeys } from '../hooks/useHotkeys';
import { formatData, formatHora, tempoRelativoAgenda } from '../lib/dates';
import { formatTelefone } from '../lib/format';
import { FORMATOS_REUNIAO, MOTIVOS_PERDA, OBJETIVOS, SIM_NAO_TALVEZ, TEMPERATURAS, URGENCIAS, opcoes } from '../lib/labels';
import { linkTelefone, preencherModelo } from '../lib/whatsapp';
import { cn } from '../lib/cn';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { CampoLinha, InlineMoney, InlineSelect, InlineTags, InlineText, InlineTextarea } from '../components/ui/Inline';
import { Segmented } from '../components/ui/Segmented';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';
import { LastContactBadge } from '../components/leads/LastContactBadge';
import { Timeline } from '../components/leads/Timeline';

type Aba = 'historico' | 'dados';

const acaoBase =
  'flex h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[11.5px] font-semibold tracking-tight sm:text-xs sm:tracking-normal transition-all active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';
const acaoNeutra =
  'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

export default function LeadDetailPage() {
  const { id } = useParams();
  const { leads, atividades, tarefas, config } = useData();
  const lead = leads.find((l) => l.id === id);

  if (!lead)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState titulo="Lead não encontrado" descricao="Ele pode ter sido excluído." acao={<Link to="/leads"><Button>Voltar para leads</Button></Link>} />
      </div>
    );

  return <Ficha key={lead.id} lead={lead} atividades={atividades} tarefas={tarefas} config={config} />;
}

function Ficha({ lead, atividades, tarefas, config }: { lead: Lead } & Pick<ReturnType<typeof useData>, 'atividades' | 'tarefas' | 'config'>) {
  const { atualizarLead, adicionarNota, alternarTarefa, excluirLeads, leads } = useData();
  const { contatoRapido, pedirMoverEtapa, confirmar, abrirAgendamento } = useAcoes();
  const toast = useToast();
  const now = useNow();
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('historico');
  const [nota, setNota] = useState('');
  const [menuWpp, setMenuWpp] = useState(false);
  const [menuRegistrar, setMenuRegistrar] = useState(false);
  const notaRef = useRef<HTMLTextAreaElement>(null);

  const historico = useMemo(
    () => atividades.filter((a) => a.leadId === lead.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [atividades, lead.id],
  );
  const pendentes = useMemo(
    () => tarefas.filter((t) => t.leadId === lead.id && !t.concluida).sort((a, b) => a.dataHora.localeCompare(b.dataHora)),
    [tarefas, lead.id],
  );

  const salvar = (patch: Partial<Lead>) => atualizarLead(lead.id, patch).then(() => toast('Salvo', { duracao: 1200 }));

  useHotkeys({
    l: () => contatoRapido(lead, 'ligacao'),
    w: () => contatoRapido(lead, 'whatsapp'),
    a: () => {
      setAba('historico');
      requestAnimationFrame(() => notaRef.current?.focus());
    },
  });

  const enviarNota = async () => {
    if (!nota.trim()) return;
    await adicionarNota(lead.id, nota);
    setNota('');
    toast('Anotação adicionada');
  };

  const abertas = config.etapas.filter((e) => e.tipo === 'aberta');
  const finais = config.etapas.filter((e) => e.tipo !== 'aberta');
  const idxAtual = abertas.findIndex((e) => e.id === lead.etapaId);
  const etapaAtual = config.etapas.find((e) => e.id === lead.etapaId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/leads'))} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Cabeçalho */}
      <Card className="mb-4 overflow-visible p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Avatar nome={lead.nome} className="h-12 w-12 text-base" />
          <div className="min-w-0 flex-1">
            <InlineText valor={lead.nome} onSalvar={(v) => v && salvar({ nome: v })} className="text-lg font-bold sm:text-xl" />
            <div className="flex flex-wrap items-center gap-2">
              <a href={linkTelefone(lead.telefone)} className="text-sm font-medium tabular-nums text-slate-600 hover:underline dark:text-slate-300">
                {formatTelefone(lead.telefone)}
              </a>
              <LastContactBadge ultimoContatoEm={lead.ultimoContatoEm} canal={lead.ultimoContatoCanal} />
            </div>
          </div>
          <div className="hidden gap-1 sm:flex" role="radiogroup" aria-label="Temperatura">
            {(Object.keys(TEMPERATURAS) as Temperatura[]).map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={lead.temperatura === t}
                onClick={() => salvar({ temperatura: t })}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
                  lead.temperatura === t
                    ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white'
                    : 'text-slate-500 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800',
                )}
              >
                {TEMPERATURAS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Ações rápidas: 4 colunas iguais, ícone em cima e nome embaixo */}
        <div className="mt-5 grid grid-cols-4 gap-1.5 sm:gap-2">
          <a
            href={linkTelefone(lead.telefone)}
            onClick={() => contatoRapido(lead, 'ligacao')}
            className={cn(acaoBase, 'bg-brand-600 text-white hover:bg-brand-700')}
          >
            <Phone className="h-5 w-5" />
            <span className="max-w-full truncate">Ligar</span>
          </a>
          <button type="button" onClick={() => contatoRapido(lead, 'whatsapp')} className={cn(acaoBase, 'bg-[#1DA851] text-white hover:bg-[#178a45]')}>
            <WhatsAppIcon className="h-5 w-5" />
            <span className="max-w-full truncate">WhatsApp</span>
          </button>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuWpp}
              onClick={() => {
                setMenuRegistrar(false);
                setMenuWpp((m) => !m);
              }}
              className={cn(acaoBase, acaoNeutra, 'w-full')}
            >
              <MessageSquareText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-full truncate">Modelos</span>
            </button>
            {menuWpp && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuWpp(false)} />
                <div role="menu" className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-pop dark:border-slate-700 dark:bg-slate-800">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Abrir WhatsApp com</p>
                  {config.modelos.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="menuitem"
                      className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setMenuWpp(false);
                        contatoRapido(lead, 'whatsapp', { texto: preencherModelo(m.texto, lead, config) });
                      }}
                    >
                      {m.nome}
                    </button>
                  ))}
                  <Link to="/configuracoes#modelos" className="block rounded-xl px-3 py-2 text-xs font-medium text-brand-700 hover:bg-slate-100 dark:text-brand-300 dark:hover:bg-slate-700">
                    Gerenciar modelos
                  </Link>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuRegistrar}
              onClick={() => {
                setMenuWpp(false);
                setMenuRegistrar((m) => !m);
              }}
              className={cn(acaoBase, acaoNeutra, 'w-full')}
            >
              <ClipboardEdit className="h-5 w-5" />
              <span className="max-w-full truncate">Registrar</span>
            </button>
            {menuRegistrar && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuRegistrar(false)} />
                <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-pop dark:border-slate-700 dark:bg-slate-800">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Registrar sem abrir</p>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => {
                      setMenuRegistrar(false);
                      contatoRapido(lead, 'ligacao');
                    }}
                  >
                    <Phone className="h-4 w-4 text-brand-600" /> Liguei
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => {
                      setMenuRegistrar(false);
                      contatoRapido(lead, 'whatsapp', { abrir: false });
                    }}
                  >
                    <WhatsAppIcon className="h-4 w-4 text-emerald-600" /> Mandei WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Etapas */}
        <div className="no-scrollbar -mx-4 mt-4 flex items-center gap-1 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          {abertas.map((e, i) => {
            const atual = e.id === lead.etapaId;
            const passada = idxAtual >= 0 && i < idxAtual;
            return (
              <button
                key={e.id}
                onClick={() => pedirMoverEtapa(lead, e.id)}
                aria-current={atual ? 'step' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  atual
                    ? 'bg-brand-600 text-white'
                    : passada
                      ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                {passada && <Check className="h-3 w-3" />}
                {e.nome}
              </button>
            );
          })}
          <span className="mx-1 h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
          {finais.map((e) => (
            <button
              key={e.id}
              onClick={() => pedirMoverEtapa(lead, e.id)}
              aria-current={e.id === lead.etapaId ? 'step' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset',
                e.id === lead.etapaId
                  ? e.tipo === 'ganho' ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-red-600 text-white ring-red-600'
                  : e.tipo === 'ganho'
                    ? 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50 dark:text-emerald-300 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10'
                    : 'text-rose-700 ring-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:ring-rose-500/30 dark:hover:bg-rose-500/10',
              )}
            >
              {e.tipo === 'ganho' ? '✓ ' : '✕ '}
              {e.nome}
            </button>
          ))}
        </div>
        {etapaAtual?.tipo === 'perdido' && lead.motivoPerda && (
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
            Perdido: {MOTIVOS_PERDA[lead.motivoPerda]}
            {lead.motivoPerdaDetalhe && ` — ${lead.motivoPerdaDetalhe}`}
          </p>
        )}
      </Card>

      {/* Próximo passo */}
      <Card className="mb-4">
        <CardHeader
          titulo="Próximo passo"
          acao={
            <Button tamanho="sm" variante="primario" icone={<CalendarPlus className="h-4 w-4" />} onClick={() => abrirAgendamento({ leadId: lead.id, tipo: 'reuniao' })}>
              Agendar reunião
            </Button>
          }
        />
        <div className="px-5 pb-5">
          {pendentes.length > 0 ? (
            <ul className="mb-3 space-y-1.5">
              {pendentes.map((t) => {
                const atrasada = t.dataHora < new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                    <button
                      aria-label="Concluir"
                      onClick={() => alternarTarefa(t.id, true).then(() => toast('Tarefa concluída', { acao: { label: 'Desfazer', onClick: () => alternarTarefa(t.id, false) } }))}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:border-slate-600"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.titulo}</p>
                      <p className={cn('text-xs', atrasada ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500')}>
                        {tempoRelativoAgenda(t.dataHora, now)} · {formatData(t.dataHora, { ano: false })}
                        {!t.diaInteiro && ` às ${formatHora(t.dataHora)}`}
                        {t.formato && ` · ${FORMATOS_REUNIAO[t.formato].toLowerCase()}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-slate-500">Nada agendado com este lead.</p>
          )}
          <Button
            tamanho="sm"
            icone={<CalendarClock className="h-4 w-4" />}
            onClick={() => abrirAgendamento({ leadId: lead.id, tipo: 'retorno' })}
          >
            Agendar retorno
          </Button>
        </div>
      </Card>

      <Segmented
        className="mb-4 flex w-full md:hidden"
        valor={aba}
        onChange={setAba}
        opcoes={[
          { value: 'historico', label: 'Histórico', contador: historico.length },
          { value: 'dados', label: 'Dados' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-4">
          {/* Dados */}
          <Card className={cn(aba !== 'dados' && 'hidden md:block')}>
            <CardHeader titulo="Dados do lead" subtitulo="Clique em qualquer campo para editar" />
            <div className="px-5 pb-5">
              <Secao titulo="Contato">
                <CampoLinha label="Telefone">
                  <InlineText valor={formatTelefone(lead.telefone)} inputMode="tel" onSalvar={(v) => v && salvar({ telefone: v })} />
                </CampoLinha>
                <CampoLinha label="E-mail">
                  <InlineText valor={lead.email} tipo="email" placeholder="Adicionar e-mail" onSalvar={(v) => salvar({ email: v || undefined })} />
                </CampoLinha>
                <CampoLinha label="Cidade">
                  <InlineText valor={lead.cidade} placeholder="Adicionar cidade" onSalvar={(v) => salvar({ cidade: v || undefined })} />
                </CampoLinha>
                <CampoLinha label="Origem">
                  <InlineSelect valor={lead.origem} opcoes={config.origens.map((o) => ({ value: o, label: o }))} onSalvar={(v) => salvar({ origem: v })} />
                </CampoLinha>
                <CampoLinha label="Quem indicou">
                  <InlineText valor={lead.indicadoPor} placeholder="—" onSalvar={(v) => salvar({ indicadoPor: v || undefined })} />
                </CampoLinha>
              </Secao>
              <Secao titulo="Consórcio">
                <CampoLinha label="Objetivo">
                  <InlineSelect valor={lead.objetivo} opcoes={opcoes(OBJETIVOS)} onSalvar={(v) => salvar({ objetivo: v })} />
                </CampoLinha>
                <CampoLinha label="Valor da carta">
                  <InlineMoney valor={lead.valorCarta} onSalvar={(v) => salvar({ valorCarta: v })} />
                </CampoLinha>
                <CampoLinha label="Parcela que cabe">
                  <InlineMoney valor={lead.parcelaIdeal} onSalvar={(v) => salvar({ parcelaIdeal: v })} />
                </CampoLinha>
                <CampoLinha label="Recurso p/ lance?">
                  <InlineSelect valor={lead.recursoLance} opcoes={opcoes(SIM_NAO_TALVEZ)} onSalvar={(v) => salvar({ recursoLance: v })} />
                </CampoLinha>
                {lead.recursoLance && lead.recursoLance !== 'nao' && (
                  <CampoLinha label="Valor do lance">
                    <InlineMoney valor={lead.valorLance} onSalvar={(v) => salvar({ valorLance: v })} />
                  </CampoLinha>
                )}
                <CampoLinha label="Prazo p/ usar crédito">
                  <InlineText valor={lead.prazoUsoCredito} placeholder="Ex.: em até 6 meses" onSalvar={(v) => salvar({ prazoUsoCredito: v || undefined })} />
                </CampoLinha>
                <CampoLinha label="Urgência">
                  <InlineSelect valor={lead.urgencia} opcoes={opcoes(URGENCIAS)} onSalvar={(v) => salvar({ urgencia: v })} />
                </CampoLinha>
                <CampoLinha label="Já teve consórcio?">
                  <InlineSelect valor={lead.jaTeveConsorcio} opcoes={opcoes(SIM_NAO_TALVEZ)} onSalvar={(v) => salvar({ jaTeveConsorcio: v })} />
                </CampoLinha>
              </Secao>
              <Secao titulo="Qualificação">
                <CampoLinha label="Quem decide junto">
                  <InlineText valor={lead.decisorJunto} placeholder="Cônjuge, sócio…" onSalvar={(v) => salvar({ decisorJunto: v || undefined })} />
                </CampoLinha>
                <CampoLinha label="Principal objeção">
                  <InlineText valor={lead.objecaoPrincipal} placeholder="—" onSalvar={(v) => salvar({ objecaoPrincipal: v || undefined })} />
                </CampoLinha>
                <CampoLinha label="Temperatura">
                  <InlineSelect valor={lead.temperatura} opcoes={opcoes(TEMPERATURAS)} onSalvar={(v) => v && salvar({ temperatura: v })} />
                </CampoLinha>
                <CampoLinha label="Etiquetas">
                  <InlineTags
                    valor={lead.etiquetas}
                    sugestoes={[...new Set(leads.flatMap((l) => l.etiquetas))]}
                    onSalvar={(v) => salvar({ etiquetas: v })}
                  />
                </CampoLinha>
              </Secao>
              <Secao titulo="Observações">
                <InlineTextarea valor={lead.observacoes} onSalvar={(v) => salvar({ observacoes: v || undefined })} />
              </Secao>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                <span>Criado em {formatData(lead.criadoEm)}</span>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  onClick={async () => {
                    if (await confirmar({ titulo: `Excluir ${lead.nome}?`, mensagem: 'Todo o histórico, tarefas e simulações deste lead serão apagados.', confirmarLabel: 'Excluir', perigo: true })) {
                      await excluirLeads([lead.id]);
                      toast('Lead excluído', { tipo: 'info' });
                      navigate('/leads');
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir lead
                </button>
              </div>
            </div>
          </Card>

        </div>

        {/* Histórico */}
        <Card className={cn(aba !== 'historico' && 'hidden md:block', 'md:self-start')}>
          <CardHeader titulo="Linha do tempo" subtitulo={`${historico.length} registros`} />
          <div className="px-5 pb-6">
            <div className="mb-5 flex gap-2">
              <textarea
                ref={notaRef}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarNota();
                  }
                }}
                rows={1}
                placeholder="Adicionar anotação… (Enter para salvar)"
                className="min-h-[44px] flex-1 resize-none rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-800"
              />
              <Button variante="primario" aria-label="Salvar anotação" onClick={enviarNota} disabled={!nota.trim()} className="h-11 w-11 shrink-0 px-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Timeline atividades={historico} motivoPerda={lead.motivoPerda} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{titulo}</h3>
      {children}
    </div>
  );
}

