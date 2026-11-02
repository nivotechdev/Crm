import type { ReactNode } from 'react';

export function EmptyState({ icone, titulo, descricao, acao }: { icone?: ReactNode; titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icone && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {icone}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{titulo}</p>
      {descricao && <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}
