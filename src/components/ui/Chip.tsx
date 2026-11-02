import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Botão-pílula para filtros e escolhas rápidas. */
export function Chip({
  ativo,
  className,
  children,
  contador,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { ativo?: boolean; contador?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500',
        ativo
          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700',
        className,
      )}
      {...rest}
    >
      {children}
      {contador !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 text-xs tabular-nums',
            ativo ? 'text-white/70 dark:text-slate-500' : 'text-slate-400',
          )}
        >
          {contador}
        </span>
      )}
    </button>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
    >
      {children}
    </span>
  );
}
