import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, Check, Phone, X } from 'lucide-react';
import type { Canal, Lead, ResultadoContato } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { RESULTADOS, RESULTADOS_POR_CANAL } from '../../lib/labels';
import { ATALHOS_AGENDA, dataDaquiA } from '../../lib/agendamento';
import { formatData, formatHora, fromInputDate } from '../../lib/dates';
import { abrirWhatsApp, preencherModelo } from '../../lib/whatsapp';
import { cn } from '../../lib/cn';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

export interface ContatoEmAberto {
  contatoId: string;
  lead: Lead;
  canal: Canal;
  registradoEm: string;
}

/**
 * Mini-popup OPCIONAL exibido após registrar um contato.
 * Não bloqueia a tela: dá para continuar trabalhando na lista e ignorar.
 * Cada escolha é salva na hora.
 */
export function ContactOutcomeSheet({ contato, onFechar }: { contato: ContatoEmAberto; onFechar: () => void }) {
  const { atualizarContato, agendarRetorno, desfazerContato, config } = useData();
  const toast = useToast();
  const [resultado, setResultado] = useState<ResultadoContato | undefined>();
  const [obs, setObs] = useState('');
  const obsSalva = useRef('');
  const [agendado, setAgendado] = useState<string | null>(null);
  const [dataCustom, setDataCustom] = useState(false);
  const { lead, canal } = contato;

  const salvarObs = () => {
    if (obs.trim() !== obsSalva.current) {
      obsSalva.current = obs.trim();
      atualizarContato(contato.contatoId, { observacao: obs.trim() || undefined });
    }
  };

  const fechar = () => {
    salvarObs();
    onFechar();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role=dialog][aria-modal=true]')) fechar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const escolherResultado = (r: ResultadoContato) => {
    const novo = resultado === r ? undefined : r;
    setResultado(novo);
    atualizarContato(contato.contatoId, { resultado: novo });
  };

  const agendar = async (iso: string) => {
    await agendarRetorno(lead.id, iso, resultado === 'pediu_retorno' ? 'Retorno pedido pelo cliente' : 'Retornar contato');
    setAgendado(iso);
    setDataCustom(false);
    toast(`Retorno agendado para ${formatData(iso, { ano: false })}`);
  };

  const chip = (ativo: boolean) =>
    cn(
      'rounded-full px-3 py-1.5 text-xs font-medium transition-colors ring-1 ring-inset',
      ativo
        ? 'bg-brand-600 text-white ring-brand-600'
        : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700',
    );

  return (
    <div
      role="region"
      aria-label="Resultado do contato"
      className="fixed inset-x-2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 animate-slide-up rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 md:inset-x-auto md:bottom-6 md:right-6 md:w-[400px]"
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            canal === 'ligacao' ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
          )}
        >
          {canal === 'ligacao' ? <Phone className="h-4 w-4" /> : <WhatsAppIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.nome}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <Check className="mr-0.5 inline h-3 w-3 text-emerald-500" />
            {canal === 'ligacao' ? 'Ligação' : 'WhatsApp'} registrado às {formatHora(contato.registradoEm)} ·{' '}
            <button
              className="font-medium text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
              onClick={() => {
                desfazerContato(contato.contatoId);
                toast('Contato desfeito', { tipo: 'info' });
                onFechar();
              }}
            >
              desfazer
            </button>
          </p>
        </div>
        <button onClick={fechar} aria-label="Fechar (Esc)" className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Resultado (opcional)</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {RESULTADOS_POR_CANAL[canal].map((r) => (
          <button key={r} className={chip(resultado === r)} onClick={() => escolherResultado(r)} aria-pressed={resultado === r}>
            {RESULTADOS[r]}
          </button>
        ))}
      </div>

      <input
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        onBlur={salvarObs}
        onKeyDown={(e) => e.key === 'Enter' && (salvarObs(), (e.target as HTMLInputElement).blur())}
        placeholder="Observação curta…"
        className="mb-3 h-10 w-full rounded-lg border-0 bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
      />

      <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <CalendarPlus className="h-3.5 w-3.5" /> Próximo contato
      </p>
      {agendado ? (
        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4" /> Agendado para {formatData(agendado, { ano: false })}
          <button className="ml-1 text-xs font-normal text-slate-500 underline" onClick={() => setAgendado(null)}>
            agendar outro
          </button>
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {ATALHOS_AGENDA.map((a) => (
            <button key={a.dias} className={chip(false)} onClick={() => agendar(dataDaquiA(a.dias))}>
              {a.label}
            </button>
          ))}
          {dataCustom ? (
            <input
              type="date"
              autoFocus
              min={new Date().toISOString().slice(0, 10)}
              className="h-8 rounded-full border-0 bg-white px-3 text-xs ring-2 ring-brand-500 dark:bg-slate-800 dark:text-slate-100"
              onChange={(e) => {
                const iso = fromInputDate(e.target.value);
                if (iso) agendar(iso);
              }}
            />
          ) : (
            <button className={chip(false)} onClick={() => setDataCustom(true)}>
              Data…
            </button>
          )}
        </div>
      )}

      {canal === 'whatsapp' && config.modelos.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reabrir com modelo</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {config.modelos.map((m) => (
              <button
                key={m.id}
                className={cn(chip(false), 'shrink-0')}
                onClick={() => abrirWhatsApp(lead.telefone, preencherModelo(m.texto, lead, config))}
              >
                {m.nome}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
