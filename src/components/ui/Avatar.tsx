import { iniciais } from '../../lib/format';
import { cn } from '../../lib/cn';

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}
