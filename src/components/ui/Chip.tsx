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
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500',
        ativo
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700',
        className,
      )}
      {...rest}
    >
      {children}
      {contador !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 text-xs tabular-nums',
            ativo ? 'bg-white/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
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
        'inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
    >
      {children}
    </span>
  );
}
