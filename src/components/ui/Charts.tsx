import { cn } from '../../lib/cn';

export interface SerieEmpilhada {
  label: string;
  titulo?: string;
  valores: number[];
}

/** Barras verticais empilhadas simples (CSS), sem dependências. */
export function BarrasEmpilhadas({
  dados,
  cores,
  legendas,
  altura = 160,
  mostrarCadaN = 1,
}: {
  dados: SerieEmpilhada[];
  cores: string[];
  legendas: string[];
  altura?: number;
  mostrarCadaN?: number;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valores.reduce((a, b) => a + b, 0)));
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height: altura }} role="img" aria-label="Gráfico de barras">
        {dados.map((d, i) => {
          const total = d.valores.reduce((a, b) => a + b, 0);
          return (
            <div key={i} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${d.titulo ?? d.label}: ${d.valores.map((v, j) => `${legendas[j]} ${v}`).join(' · ')}`}>
              {total > 0 && (
                <span className="mb-0.5 hidden text-center text-[10px] font-semibold tabular-nums text-slate-500 group-hover:block">{total}</span>
              )}
              <div className="flex flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `${(total / max) * 100}%` }}>
                {d.valores.map((v, j) => (
                  <div key={j} className={cn(cores[j], 'transition-all')} style={{ height: total ? `${(v / total) * 100}%` : 0 }} />
                ))}
              </div>
              {total === 0 && <div className="h-[2px] rounded bg-slate-200 dark:bg-slate-700" />}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {dados.map((d, i) => (
          <span key={i} className="min-w-0 flex-1 truncate text-center text-[10px] text-slate-400">
            {i % mostrarCadaN === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        {legendas.map((l, j) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', cores[j])} /> {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barras horizontais com rótulo e valor. */
export function BarrasHorizontais({ itens, cor = 'bg-brand-500' }: { itens: Array<{ label: string; valor: number; texto?: string; cor?: string }>; cor?: string }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.label}>
          <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium text-slate-700 dark:text-slate-300">{i.label}</span>
            <span className="shrink-0 tabular-nums text-slate-500">{i.texto ?? i.valor}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={cn('h-full rounded-full', i.cor ?? cor)} style={{ width: `${(i.valor / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
