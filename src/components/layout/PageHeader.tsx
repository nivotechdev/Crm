import type { ReactNode } from 'react';

export function PageHeader({ titulo, subtitulo, acoes }: { titulo: ReactNode; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3 md:mb-6">
      <div className="min-w-0">
        <h1 className="truncate text-[26px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white md:text-[30px]">{titulo}</h1>
        {subtitulo && <p className="mt-1 truncate text-[13px] text-slate-500 dark:text-slate-400">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
    </div>
  );
}
