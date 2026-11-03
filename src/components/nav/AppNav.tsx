import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { NAV_ICONS } from './navIcons';
import { NAV_ITEMS, type Role } from './navItems';
import { TopBar } from './TopBar';

interface Props {
  role: Role;
  /** id da aba ativa (ou null quando nenhuma) */
  active: string | null;
  /** A pílula do celular só aparece nas telas que são raiz de aba. */
  showMobilePill?: boolean;
}

/**
 * Navegação principal: pílula flutuante embaixo no celular (< 770 px)
 * e barra do topo em "ilha" no computador (≥ 770 px). Mesmas abas nos dois.
 */
export function AppNav({ role, active, showMobilePill = true }: Props) {
  const navigate = useNavigate();
  const items = NAV_ITEMS[role];

  return (
    <div className="contents">
      {showMobilePill && (
        <nav
          aria-label="Navegação principal"
          className="app-glass fixed inset-x-0 z-30 mx-auto flex items-stretch gap-1 rounded-full p-1.5 lg:hidden"
          style={{
            bottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))',
            width: `min(calc(100vw - 1.5rem), ${items.length <= 3 ? 21 : 23}rem)`,
          }}
        >
          {items.map((it) => {
            const Icone = NAV_ICONS[it.icon];
            const ativo = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                aria-current={ativo ? 'page' : undefined}
                onClick={() => navigate(it.path)}
                className={cn(
                  'flex h-[3.375rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 outline-none transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-brand-100 dark:focus-visible:ring-brand-500/30',
                  ativo
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-700 active:bg-slate-200/60 dark:text-slate-300 dark:active:bg-slate-700/60',
                )}
              >
                <Icone size={22} strokeWidth={2} aria-hidden />
                <span className="max-w-full truncate text-[0.75rem] font-semibold leading-4">{it.label}</span>
              </button>
            );
          })}
        </nav>
      )}
      <TopBar role={role} items={items} active={active} />
    </div>
  );
}
