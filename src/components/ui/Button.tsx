import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo' | 'sucesso' | 'whatsapp';
type Tamanho = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secundario:
    'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
  fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  perigo: 'bg-red-600 text-white hover:bg-red-700',
  sucesso: 'bg-emerald-600 text-white hover:bg-emerald-700',
  whatsapp: 'bg-[#1DA851] text-white hover:bg-[#178a45]',
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-full',
  md: 'h-10 px-4 text-sm gap-2 rounded-full',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-full',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: ReactNode;
  bloco?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variante = 'secundario', tamanho = 'md', icone, bloco, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-50',
        VARIANTES[variante],
        TAMANHOS[tamanho],
        bloco && 'w-full',
        className,
      )}
      {...rest}
    >
      {icone}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
