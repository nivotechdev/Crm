import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, Clock, Link2, MapPin, Phone, Search, Video, X } from 'lucide-react';
import type { FormatoReuniao, Lead, TipoTarefa } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { addDays, formatHora, fromInputDate, startOfDay, toInputDate } from '../../lib/dates';
import { formatTelefone, primeiroNome } from '../../lib/format';
import { FORMATOS_REUNIAO, TIPOS_TAREFA } from '../../lib/labels';
import { buscaLead } from '../../lib/leadFilters';
import { linkWhatsApp } from '../../lib/whatsapp';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { inputBase } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { EtapaBadge } from '../leads/Badges';
import { Calendario, Horarios } from './Seletores';
import { LastContactBadge } from '../leads/LastContactBadge';

/** No app só se agenda reunião ou retorno. */
export type TipoAgendavel = Extract<TipoTarefa, 'reuniao' | 'retorno'>;
export interface AgendamentoPrefill {
  leadId?: string;
  tipo?: TipoAgendavel;
}

const TIPOS: TipoAgendavel[] = ['reuniao', 'retorno'];
const FORMATO_ICONE: Record<FormatoReuniao, typeof Video> = { video: Video, presencial: MapPin, telefone: Phone };

function proximaSegunda(): Date {
  const d = startOfDay(new Date());
  const dow = d.getDay();
  return addDays(d, ((8 - dow) % 7) || 7);
}

function atalhosData() {
  const hoje = startOfDay(new Date());
  return [
    { label: 'Hoje', valor: toInputDate(hoje.toISOString()) },
    { label: 'Amanhã', valor: toInputDate(addDays(hoje, 1).toISOString()) },
    { label: 'Em 2 dias', valor: toInputDate(addDays(hoje, 2).toISOString()) },
    { label: 'Segunda', valor: toInputDate(proximaSegunda().toISOString()) },
  ];
}

/** "2026-11-04" → "Qua, 04 de nov." */
function dataCurta(v: string): string {
  const [a, m, d] = v.split('-').map(Number);
  const s = new Date(a, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "2026-11-04" → "Qua., 04/11" */
function dataMinima(v: string): string {
  const [a, m, d] = v.split('-').map(Number);
  const dia = new Date(a, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short' });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** Botão grande que mostra o valor escolhido e abre o seletor. */
function BotaoCampo({
  rotulo,
  icone,
  valor,
  valorCurto,
  aberto,
  onClick,
  autoFoco,
}: {
  rotulo: string;
  icone: ReactNode;
  valor: string;
  /** Versão curta para telas estreitas */
  valorCurto?: string;
  aberto: boolean;
  onClick: () => void;
  autoFoco?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={aberto}
      data-autofocus={autoFoco ? true : undefined}
      className={cn(
        'flex h-[3.75rem] min-w-0 items-center gap-3 rounded-2xl border px-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
        aberto
          ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
      )}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', aberto ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">{rotulo}</span>
        <span className="num block truncate text-[15px] font-semibold text-slate-900 dark:text-white">
          {valorCurto ? (
            <>
              <span className="sm:hidden">{valorCurto}</span>
              <span className="hidden sm:inline">{valor}</span>
            </>
          ) : (
            valor
          )}
        </span>
      </span>
    </button>
  );
}

function dataPorExtenso(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

/** Opção em pílula (escolha única). */
function Opcao({ ativo, onClick, children, className }: { ativo: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
        ativo
          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Secao({ titulo, icone, children }: { titulo: string; icone?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        {icone}
        {titulo}
      </p>
      {children}
    </div>
  );
}

/**
 * Card de agendamento rápido: lead (com busca), tipo, formato, data, horário e local.
 * Só a data é obrigatória; tudo vem com um padrão sensato.
 */
export function ScheduleModal({ prefill, onFechar }: { prefill: AgendamentoPrefill | null; onFechar: () => void }) {
  const { leads, tarefas, config, criarTarefa, moverEtapa } = useData();
  const toast = useToast();
  const aberto = !!prefill;

  const [leadId, setLeadId] = useState<string | undefined>();
  const [busca, setBusca] = useState('');
  const [listaAberta, setListaAberta] = useState(false);
  const [sel, setSel] = useState(0);
  const [tipo, setTipo] = useState<TipoAgendavel>('reuniao');
  const [formato, setFormato] = useState<FormatoReuniao>('video');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('10:00');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [moverParaReuniao, setMoverParaReuniao] = useState(true);
  const [erro, setErro] = useState('');
  const [seletor, setSeletor] = useState<'data' | 'hora' | null>(null);
  const buscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!prefill) return;
    const t = prefill.tipo ?? 'reuniao';
    setLeadId(prefill.leadId);
    setBusca('');
    setListaAberta(false);
    setSel(0);
    setTipo(t);
    setFormato('video');
    setData(atalhosData()[1].valor);
    setHora(t === 'reuniao' ? '10:00' : '');
    setLocal('');
    setDescricao('');
    setMoverParaReuniao(true);
    setErro('');
    setSeletor(null);
    if (!prefill.leadId) requestAnimationFrame(() => buscaRef.current?.focus());
  }, [prefill]);

  const lead = leads.find((l) => l.id === leadId);

  const resultados = useMemo(() => {
    if (!busca.trim()) {
      // Sugestões: leads ativos contatados mais recentemente
      const abertas = new Set(config.etapas.filter((e) => e.tipo === 'aberta').map((e) => e.id));
      return leads
        .filter((l) => abertas.has(l.etapaId))
        .sort((a, b) => (b.ultimoContatoEm ?? '').localeCompare(a.ultimoContatoEm ?? ''))
        .slice(0, 5);
    }
    return leads.filter((l) => buscaLead(l, busca)).slice(0, 6);
  }, [busca, leads, config.etapas]);

  useEffect(() => setSel(0), [busca]);

  const escolher = (l: Lead) => {
    setLeadId(l.id);
    setBusca('');
    setListaAberta(false);
  };

  const mudarTipo = (t: TipoAgendavel) => {
    setTipo(t);
    if (t === 'reuniao' && !hora) setHora('10:00');
    if (t !== 'reuniao' && tipo === 'reuniao' && hora === '10:00') setHora('');
  };

  // Compromissos já marcados no dia escolhido
  const doDia = useMemo(() => {
    if (!data) return [];
    return tarefas
      .filter((t) => !t.concluida && toInputDate(t.dataHora) === data)
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  }, [tarefas, data]);
  const conflito = !!hora && doDia.some((t) => !t.diaInteiro && formatHora(t.dataHora) === hora);

  const etapaReuniao = config.etapas.find((e) => e.id === 'reuniao') ?? config.etapas.find((e) => e.tipo === 'aberta' && /reuni/i.test(e.nome));
  const abertas = config.etapas.filter((e) => e.tipo === 'aberta');
  const podeAvancar =
    tipo === 'reuniao' &&
    !!lead &&
    !!etapaReuniao &&
    abertas.findIndex((e) => e.id === lead.etapaId) >= 0 &&
    abertas.findIndex((e) => e.id === lead.etapaId) < abertas.findIndex((e) => e.id === etapaReuniao.id);

  const salvar = async () => {
    setErro('');
    if (!data) return setErro('Escolha a data');
    if (tipo === 'reuniao' && !hora) return setErro('Escolha o horário da reunião');
    const dataHora = hora ? new Date(`${data}T${hora}:00`).toISOString() : fromInputDate(data)!;
    const titulo =
      descricao.trim() ||
      (tipo === 'reuniao'
        ? formato === 'presencial'
          ? 'Reunião presencial'
          : formato === 'video'
            ? 'Reunião por videochamada'
            : 'Reunião por telefone'
        : 'Retornar contato');
    await criarTarefa({
      titulo,
      tipo,
      dataHora,
      diaInteiro: !hora,
      leadId: lead?.id,
      ...(tipo === 'reuniao' && { formato, local: local.trim() || undefined }),
    });
    if (podeAvancar && moverParaReuniao && lead && etapaReuniao) await moverEtapa(lead.id, etapaReuniao.id);

    const quando = `${new Date(dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')}${hora ? ` às ${hora}` : ''}`;
    const msgConfirmacao =
      lead && tipo === 'reuniao'
        ? `Olá, ${primeiroNome(lead.nome)}! Confirmando nossa reunião ${dataPorExtenso(dataHora)}, às ${hora}` +
          (formato === 'video' ? ` por videochamada${local.trim() ? `: ${local.trim()}` : ''}` : formato === 'presencial' ? (local.trim() ? `, em ${local.trim()}` : ', presencialmente') : ', por telefone') +
          '. Qualquer imprevisto, é só me avisar. Até lá!'
        : null;
    toast(`${tipo === 'retorno' ? 'Retorno agendado' : 'Reunião agendada'} · ${quando}`, {
      duracao: msgConfirmacao ? 7000 : undefined,
      acao: msgConfirmacao ? { label: 'Confirmar no WhatsApp', href: linkWhatsApp(lead!.telefone, msgConfirmacao) } : undefined,
    });
    onFechar();
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={tipo === 'reuniao' ? 'Agendar reunião' : 'Agendar retorno'}
      rodape={
        <>
          {erro && <p className="mr-auto text-sm font-medium text-red-600 dark:text-red-400">{erro}</p>}
          <Button variante="fantasma" onClick={onFechar}>
            Cancelar
          </Button>
          <Button variante="primario" onClick={salvar}>
            Agendar
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
      >
        {/* Lead */}
        <Secao titulo="Com quem">
          {lead ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <Avatar nome={lead.nome} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.nome}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="num text-xs text-slate-500">{formatTelefone(lead.telefone)}</span>
                  <EtapaBadge etapaId={lead.etapaId} />
                </div>
              </div>
              <button
                type="button"
                aria-label="Trocar lead"
                onClick={() => {
                  setLeadId(undefined);
                  requestAnimationFrame(() => buscaRef.current?.focus());
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={buscaRef}
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setListaAberta(true);
                }}
                onFocus={() => setListaAberta(true)}
                onBlur={() => setTimeout(() => setListaAberta(false), 150)}
                onKeyDown={(e) => {
                  if (!listaAberta || resultados.length === 0) return;
                  if (e.key === 'ArrowDown') (e.preventDefault(), setSel((s) => Math.min(resultados.length - 1, s + 1)));
                  if (e.key === 'ArrowUp') (e.preventDefault(), setSel((s) => Math.max(0, s - 1)));
                  if (e.key === 'Enter') (e.preventDefault(), escolher(resultados[sel]));
                }}
                placeholder="Buscar lead pelo nome ou telefone"
                aria-label="Buscar lead"
                role="combobox"
                aria-expanded={listaAberta}
                aria-controls="agendar-resultados"
                autoComplete="off"
                className={cn(inputBase, 'h-11 rounded-full pl-10')}
              />
              {listaAberta && (
                <ul
                  id="agendar-resultados"
                  role="listbox"
                  className="absolute inset-x-0 top-full z-10 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-pop dark:border-slate-700 dark:bg-slate-900"
                >
                  {!busca.trim() && resultados.length > 0 && <li className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Contatados recentemente</li>}
                  {resultados.map((l, i) => (
                    <li
                      key={l.id}
                      role="option"
                      aria-selected={i === sel}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={() => setSel(i)}
                      onClick={() => escolher(l)}
                      className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2', i === sel && 'bg-slate-100 dark:bg-slate-800')}
                    >
                      <Avatar nome={l.nome} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{l.nome}</p>
                        <p className="num truncate text-xs text-slate-500">{formatTelefone(l.telefone)}</p>
                      </div>
                      <LastContactBadge ultimoContatoEm={l.ultimoContatoEm} canal={l.ultimoContatoCanal} compacto className="hidden sm:inline-flex" />
                    </li>
                  ))}
                  {busca.trim() && resultados.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">Nenhum lead encontrado para “{busca}”.</li>}
                </ul>
              )}
            </div>
          )}
        </Secao>

        {/* Tipo */}
        <Secao titulo="Tipo">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800/80" role="radiogroup" aria-label="Tipo">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tipo === t}
                onClick={() => mudarTipo(t)}
                className={cn(
                  'h-9 rounded-full text-[13px] font-semibold transition-colors',
                  tipo === t ? 'bg-white text-slate-900 shadow-card dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                )}
              >
                {TIPOS_TAREFA[t]}
              </button>
            ))}
          </div>
        </Secao>

        {tipo === 'reuniao' && (
          <Secao titulo="Formato">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FORMATOS_REUNIAO) as FormatoReuniao[]).map((f) => {
                const Icone = FORMATO_ICONE[f];
                return (
                  <Opcao key={f} ativo={formato === f} onClick={() => setFormato(f)}>
                    <Icone className="h-4 w-4" />
                    {FORMATOS_REUNIAO[f]}
                  </Opcao>
                );
              })}
            </div>
          </Secao>
        )}

        {/* Data e horário: um botão para cada, que abre o seletor logo abaixo */}
        <div>
          <div className="grid grid-cols-[1.4fr_1fr] gap-2">
            <BotaoCampo
              rotulo="Data"
              icone={<CalendarDays className="h-[18px] w-[18px]" />}
              valor={data ? dataCurta(data) : 'Escolher data'}
              valorCurto={data ? dataMinima(data) : 'Escolher'}
              aberto={seletor === 'data'}
              onClick={() => setSeletor((v) => (v === 'data' ? null : 'data'))}
              autoFoco={!!prefill?.leadId}
            />
            <BotaoCampo
              rotulo="Horário"
              icone={<Clock className="h-[18px] w-[18px]" />}
              valor={hora || (tipo === 'reuniao' ? 'Escolher' : 'Dia todo')}
              aberto={seletor === 'hora'}
              onClick={() => setSeletor((v) => (v === 'hora' ? null : 'hora'))}
            />
          </div>
          {seletor === 'data' && (
            <div className="mt-2 animate-fade-in">
              <Calendario
                valor={data}
                onEscolher={(v) => {
                  setData(v);
                  setSeletor('hora'); // próximo passo natural: o horário
                }}
              />
            </div>
          )}
          {seletor === 'hora' && (
            <div className="mt-2 animate-fade-in">
              <Horarios
                valor={hora}
                permitirDiaTodo={tipo !== 'reuniao'}
                onEscolher={(v) => {
                  setHora(v);
                  setSeletor(null);
                }}
              />
            </div>
          )}
          {doDia.length > 0 && (
            <div className={cn('mt-3 rounded-2xl px-3.5 py-2.5 text-xs', conflito ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400')}>
              <p className="mb-1 font-semibold">{conflito ? 'Você já tem um compromisso nesse horário' : 'Já marcado neste dia'}</p>
              <ul className="space-y-0.5">
                {doDia.slice(0, 4).map((t) => (
                  <li key={t.id} className="num truncate">
                    {t.diaInteiro ? 'Dia todo' : formatHora(t.dataHora)} · {TIPOS_TAREFA[t.tipo]}
                    {t.leadId && ` com ${leads.find((l) => l.id === t.leadId)?.nome ?? '—'}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {tipo === 'reuniao' && formato !== 'telefone' && (
          <Secao titulo={formato === 'video' ? 'Link da chamada (opcional)' : 'Local (opcional)'} icone={formato === 'video' ? <Link2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}>
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder={formato === 'video' ? 'https://meet.google.com/…' : 'Endereço ou ponto de encontro'}
              className={cn(inputBase, 'h-11')}
            />
          </Secao>
        )}

        <Secao titulo="Observação (opcional)">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === 'reuniao' ? 'Ex.: apresentar simulação de R$ 300 mil' : 'Ex.: retornar sobre a proposta'}
            className={cn(inputBase, 'h-11')}
          />
        </Secao>

        {podeAvancar && etapaReuniao && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-200">
            <input type="checkbox" checked={moverParaReuniao} onChange={(e) => setMoverParaReuniao(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Mover {primeiroNome(lead!.nome)} para “{etapaReuniao.nome}”
          </label>
        )}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
