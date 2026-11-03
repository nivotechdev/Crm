import { NavLink } from 'react-router-dom';
import { Keyboard, Plus } from 'lucide-react';
import { NAV, NAV_CONFIG } from './nav';
import { Logo } from './Logo';
import { useAcoes } from '../../store/AcoesContext';
import { useDerivados } from '../../hooks/useDerivados';
import { cn } from '../../lib/cn';

export function Sidebar() {
  const { abrirNovoLead, setAtalhosAbertos } = useAcoes();
  const d = useDerivados();
  const pendenciasAgenda = d.tarefasAtrasadas.length + d.tarefasHoje.length;
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200/70 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <Logo />
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">Consórcio</p>
          <p className="text-[11px] font-medium text-slate-400">CRM de vendas</p>
        </div>
      </div>
      <button
        onClick={() => abrirNovoLead()}
        className="mb-6 flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} /> Novo lead
      </button>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={'fim' in n}
            title={`${n.label} (${n.atalho})`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
              )
            }
          >
            <n.icone className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="flex-1">{n.label}</span>
            {n.to === '/agenda' && pendenciasAgenda > 0 && (
              <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">{pendenciasAgenda}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to={NAV_CONFIG.to}
        className={({ isActive }) =>
          cn(
            'mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
            isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800',
          )
        }
      >
        <NAV_CONFIG.icone className="h-4 w-4" /> {NAV_CONFIG.label}
      </NavLink>
      <button
        onClick={() => setAtalhosAbertos(true)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800"
      >
        <Keyboard className="h-4 w-4" /> Atalhos <kbd className="ml-auto font-sans">?</kbd>
      </button>
    </aside>
  );
}
