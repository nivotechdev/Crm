import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

const SUGESTOES = [20, 30, 40, 50, 60, 80];

/** Edição rápida da meta diária de contatos (ligações + WhatsApps). */
export function MetaModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { config, salvarConfig } = useData();
  const toast = useToast();
  const [meta, setMeta] = useState(config.metaDiaria);

  useEffect(() => {
    if (aberto) setMeta(config.metaDiaria);
  }, [aberto, config.metaDiaria]);

  const ajustar = (v: number) => setMeta(Math.max(1, Math.min(500, Math.round(v) || 1)));
  const salvar = async () => {
    await salvarConfig({ ...config, metaDiaria: meta });
    toast(`Meta diária: ${meta} contatos`);
    onFechar();
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Meta diária de contatos"
      subtitulo="Soma de ligações e WhatsApps registrados no dia"
      tamanho="sm"
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar}>
            Cancelar
          </Button>
          <Button variante="primario" onClick={salvar}>
            Salvar meta
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
      >
        <div className="flex items-center justify-center gap-4 py-2">
          <button
            type="button"
            aria-label="Diminuir meta"
            onClick={() => ajustar(meta - 5)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Minus className="h-5 w-5" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={meta}
            min={1}
            max={500}
            onChange={(e) => ajustar(Number(e.target.value))}
            aria-label="Meta diária"
            className="num w-28 rounded-2xl border-0 bg-transparent text-center text-5xl font-bold tracking-tight text-slate-900 outline-none focus:ring-4 focus:ring-brand-500/15 dark:text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="Aumentar meta"
            onClick={() => ajustar(meta + 5)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-center text-xs text-slate-500">contatos por dia · cerca de {Math.ceil(meta / 8)} por hora em 8h de trabalho</p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setMeta(s)}
              className={cn(
                'num h-9 rounded-full border px-4 text-[13px] font-medium transition-colors',
                meta === s
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
