import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, startOfDay, toInputDate } from '../../lib/dates';
import { cn } from '../../lib/cn';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** "2026-11-04" → Date local (meia-noite). */
function paraData(v: string): Date {
  const [a, m, d] = v.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Calendário de um mês. Valor no formato "AAAA-MM-DD". Dias passados ficam desativados. */
export function Calendario({ valor, onEscolher }: { valor: string; onEscolher: (v: string) => void }) {
  const hoje = startOfDay(new Date());
  const hojeStr = toInputDate(hoje.toISOString());
  const [mes, setMes] = useState(() => {
    const base = valor ? paraData(valor) : hoje;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const dias = useMemo(() => {
    const inicio = addDays(mes, -mes.getDay()); // começa no domingo
    return Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
  }, [mes]);
  // Só mostra a 6ª semana se ela tiver dias do mês
  const visiveis = dias[35].getMonth() === mes.getMonth() ? dias : dias.slice(0, 35);
  const podeVoltar = mes > new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const titulo = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          disabled={!podeVoltar}
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-slate-900 first-letter:uppercase dark:text-white" aria-live="polite">
          {titulo}
        </p>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center" role="grid" aria-label={titulo}>
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="pb-1 text-[11px] font-semibold text-slate-400" aria-hidden>
            {d}
          </span>
        ))}
        {visiveis.map((d) => {
          const v = toInputDate(d.toISOString());
          const doMes = d.getMonth() === mes.getMonth();
          const passado = d < hoje;
          const escolhido = v === valor;
          const ehHoje = v === hojeStr;
          return (
            <button
              key={v}
              type="button"
              role="gridcell"
              aria-selected={escolhido}
              aria-label={d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              disabled={passado}
              onClick={() => onEscolher(v)}
              className={cn(
                'num mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors disabled:pointer-events-none',
                escolhido
                  ? 'bg-brand-600 font-semibold text-white'
                  : ehHoje
                    ? 'font-semibold text-brand-700 ring-1 ring-inset ring-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:ring-brand-500/40 dark:hover:bg-brand-500/10'
                    : doMes
                      ? 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800',
                passado && 'text-slate-300 dark:text-slate-700',
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Horários de 15 em 15 minutos (06:00–22:00). `''` = dia todo (quando permitido). */
export function Horarios({ valor, onEscolher, permitirDiaTodo }: { valor: string; onEscolher: (v: string) => void; permitirDiaTodo: boolean }) {
  const lista = useMemo(() => {
    const out: string[] = [];
    for (let h = 6; h <= 22; h++) for (const m of [0, 15, 30, 45]) if (!(h === 22 && m > 0)) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    return out;
  }, []);
  const ref = useRef<HTMLDivElement>(null);

  // Abre já rolado até o horário escolhido (ou 09:00)
  useEffect(() => {
    const alvo = ref.current?.querySelector<HTMLElement>(`[data-hora="${valor || '09:00'}"]`);
    if (alvo && ref.current) ref.current.scrollTop = alvo.offsetTop - ref.current.clientHeight / 2 + alvo.clientHeight / 2;
  }, [valor]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
      {permitirDiaTodo && (
        <button
          type="button"
          onClick={() => onEscolher('')}
          aria-pressed={!valor}
          className={cn(
            'mb-1.5 h-10 w-full rounded-2xl text-sm font-medium transition-colors',
            !valor ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
          )}
        >
          Dia todo (sem horário)
        </button>
      )}
      <div ref={ref} className="grid max-h-52 grid-cols-4 gap-1 overflow-y-auto scrollbar-thin" role="listbox" aria-label="Horários">
        {lista.map((h) => {
          const escolhido = h === valor;
          return (
            <button
              key={h}
              type="button"
              role="option"
              aria-selected={escolhido}
              data-hora={h}
              onClick={() => onEscolher(h)}
              className={cn(
                'num h-10 rounded-xl text-sm transition-colors',
                escolhido
                  ? 'bg-brand-600 font-semibold text-white'
                  : h.endsWith(':00')
                    ? 'font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {h}
            </button>
          );
        })}
      </div>
    </div>
  );
}
