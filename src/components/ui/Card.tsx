import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl bg-white ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800', className)}
      {...p}
    />
  );
}

export function CardHeader({ titulo, acao, icone, subtitulo }: { titulo: ReactNode; acao?: ReactNode; icone?: ReactNode; subtitulo?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-4 sm:px-5">
      {icone && <span className="text-slate-400">{icone}</span>}
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>
        {subtitulo && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}
