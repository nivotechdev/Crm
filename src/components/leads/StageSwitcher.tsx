import { useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { corEtapa } from '../../lib/etapas';
import { formatBRLCompacto } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Modal } from '../ui/Modal';

export interface ResumoEtapa {
  qtd: number;
  valor: number;
}

/**
 * Troca de etapa do funil. Cada etapa é uma "tela" de cards.
 * - Celular: botão grande com setas ‹ › e lista completa ao tocar.
 * - Desktop: abas em pílula com a contagem de cada etapa.
 * `''` = Todas as etapas ativas.
 */
export function StageSwitcher({
  atual,
  resumo,
  onChange,
}: {
  atual: string;
  resumo: Record<string, ResumoEtapa>;
  onChange: (etapaId: string) => void;
}) {
  const { config } = useData();
  const [lista, setLista] = useState(false);
  const itens = [{ id: '', nome: 'Todas', tipo: 'aberta' as const, cor: '' }, ...config.etapas];
  const idx = Math.max(0, itens.findIndex((i) => i.id === atual));
  const item = itens[idx];
  const r = resumo[item.id] ?? { qtd: 0, valor: 0 };
  const dot = (id: string, cor: string) => (id === '' ? 'bg-slate-900 dark:bg-white' : corEtapa({ id, cor, nome: '', tipo: 'aberta' }).dot);

  return (
    <>
      {/* Celular */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <button
          type="button"
          aria-label="Etapa anterior"
          disabled={idx === 0}
          onClick={() => onChange(itens[idx - 1].id)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setLista(true)}
          aria-haspopup="dialog"
          className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-slate-200 bg-white pl-4 pr-3 text-left dark:border-slate-800 dark:bg-slate-900"
        >
          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dot(item.id, item.cor))} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-white">{item.nome}</span>
            <span className="num block truncate text-[11px] text-slate-500">
              {r.qtd} {r.qtd === 1 ? 'lead' : 'leads'} · {formatBRLCompacto(r.valor)}
            </span>
          </span>
          <span className="num shrink-0 text-[11px] font-medium text-slate-400">
            {idx + 1}/{itens.length}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <button
          type="button"
          aria-label="Próxima etapa"
          disabled={idx === itens.length - 1}
          onClick={() => onChange(itens[idx + 1].id)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop */}
      <div role="tablist" aria-label="Etapas do funil" className="no-scrollbar mb-5 hidden items-center gap-1.5 overflow-x-auto md:flex">
        {itens.map((e, i) => {
          const ativo = e.id === atual;
          const q = resumo[e.id]?.qtd ?? 0;
          return (
            <div key={e.id || 'todas'} className="flex shrink-0 items-center">
              {i > 0 && e.tipo !== 'aberta' && itens[i - 1].tipo === 'aberta' && <span className="mx-1.5 h-5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden />}
              <button
                type="button"
                role="tab"
                aria-selected={ativo}
                onClick={() => onChange(e.id)}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors',
                  ativo
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white',
                )}
              >
                {e.id !== '' && <span className={cn('h-2 w-2 rounded-full', dot(e.id, e.cor))} />}
                {e.nome}
                <span className={cn('num text-xs', ativo ? 'text-white/60 dark:text-slate-500' : 'text-slate-400')}>{q}</span>
              </button>
            </div>
          );
        })}
      </div>

      <Modal aberto={lista} onFechar={() => setLista(false)} titulo="Etapas do funil" tamanho="sm">
        <ul className="-mx-2 pb-2">
          {itens.map((e) => {
            const ativo = e.id === atual;
            const s = resumo[e.id] ?? { qtd: 0, valor: 0 };
            return (
              <li key={e.id || 'todas'}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(e.id);
                    setLista(false);
                  }}
                  className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left', ativo ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60')}
                >
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dot(e.id, e.cor))} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-slate-900 dark:text-white">{e.nome}</span>
                    <span className="num block text-xs text-slate-500">{formatBRLCompacto(s.valor)} em cartas</span>
                  </span>
                  <span className="num text-sm font-semibold text-slate-700 dark:text-slate-200">{s.qtd}</span>
                  {ativo && <Check className="h-4 w-4 text-brand-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
