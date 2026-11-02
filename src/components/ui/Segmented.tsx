import { cn } from '../../lib/cn';

export function Segmented<T extends string>({
  valor,
  onChange,
  opcoes,
  className,
}: {
  valor: T;
  onChange: (v: T) => void;
  opcoes: Array<{ value: T; label: string; contador?: number }>;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-full bg-slate-100 p-1 dark:bg-slate-800/80', className)}>
      {opcoes.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={valor === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
            valor === o.value
              ? 'bg-white text-slate-900 shadow-card dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {o.label}
          {o.contador !== undefined && <span className="ml-1.5 tabular-nums text-slate-400">{o.contador}</span>}
        </button>
      ))}
    </div>
  );
}
