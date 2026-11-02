import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900', className)} {...p} />;
}

export function CardHeader({ titulo, acao, icone, subtitulo }: { titulo: ReactNode; acao?: ReactNode; icone?: ReactNode; subtitulo?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-5 pb-3 pt-5">
      {icone && <span className="mt-0.5 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icone}</span>}
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}
