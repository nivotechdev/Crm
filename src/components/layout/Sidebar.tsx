import { NavLink } from 'react-router-dom';
import { Keyboard, Plus } from 'lucide-react';
import { NAV } from './nav';
import { useAcoes } from '../../store/AcoesContext';
import { useDerivados } from '../../hooks/useDerivados';
import { cn } from '../../lib/cn';

export function Sidebar() {
  const { abrirNovoLead, setAtalhosAbertos } = useAcoes();
  const d = useDerivados();
  const pendenciasAgenda = d.tarefasAtrasadas.length + d.tarefasHoje.length;
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">C</div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">CRM Consórcio</p>
          <p className="text-[11px] text-slate-500">Imóveis & veículos</p>
        </div>
      </div>
      <button
        onClick={() => abrirNovoLead()}
        className="mb-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> Novo lead
        <kbd className="ml-1 rounded bg-white/20 px-1.5 text-[10px]">N</kbd>
      </button>
      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Navegação principal">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={'fim' in n}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              )
            }
          >
            <n.icone className="h-[18px] w-[18px]" />
            <span className="flex-1">{n.label}</span>
            {n.to === '/agenda' && pendenciasAgenda > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-semibold tabular-nums text-white">{pendenciasAgenda}</span>
            )}
            <span className="hidden text-[10px] text-slate-400 group-hover:inline">{n.atalho}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => setAtalhosAbertos(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Keyboard className="h-4 w-4" /> Atalhos de teclado <kbd className="ml-auto rounded bg-slate-100 px-1.5 dark:bg-slate-800">?</kbd>
      </button>
    </aside>
  );
}
