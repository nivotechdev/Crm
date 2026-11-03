import { NavLink } from 'react-router-dom';
import { NAV } from './nav';
import { useDerivados } from '../../hooks/useDerivados';
import { cn } from '../../lib/cn';

/** Navegação inferior (celular): 5 seções, sem menu "Mais". */
export function BottomNav() {
  const d = useDerivados();
  const pend = d.tarefasAtrasadas.length + d.tarefasHoje.length;
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200/70 bg-white/90 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:hidden"
    >
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={'fim' in n}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1.5 pt-2 text-[11px] font-medium',
              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500',
            )
          }
        >
          <span className="relative">
            <n.icone className="h-[22px] w-[22px]" strokeWidth={2} />
            {n.to === '/agenda' && pend > 0 && (
              <span className="num absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {pend}
              </span>
            )}
          </span>
          <span className="truncate">{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
