import { Moon, Search, Sun } from 'lucide-react';
import { useAcoes } from '../../store/AcoesContext';
import { useTheme } from '../../store/ThemeContext';
import { DailyCounter } from './DailyCounter';
import { IconButton } from '../ui/Button';

export function Topbar() {
  const { setBuscaAberta } = useAcoes();
  const { escuro, setTema } = useTheme();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-14 items-center gap-2 px-3 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">C</div>
        </div>
        <button
          onClick={() => setBuscaAberta(true)}
          className="hidden h-9 w-72 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-slate-100 px-3 text-sm text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 md:flex"
        >
          <Search className="h-4 w-4 shrink-0" /> <span className="truncate">Buscar nome, telefone, cidade…</span>
          <kbd className="ml-auto shrink-0 rounded bg-white px-1.5 text-[11px] text-slate-500 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">Ctrl K</kbd>
        </button>
        <div className="flex-1 md:hidden">
          <DailyCounter compacto />
        </div>
        <div className="ml-auto hidden lg:block">
          <DailyCounter />
        </div>
        <IconButton label="Buscar" className="md:hidden" onClick={() => setBuscaAberta(true)}>
          <Search className="h-5 w-5" />
        </IconButton>
        <IconButton label={escuro ? 'Usar modo claro' : 'Usar modo escuro'} onClick={() => setTema(escuro ? 'claro' : 'escuro')} className="lg:ml-2">
          {escuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </IconButton>
      </div>
      <div className="hidden border-t border-slate-100 px-6 py-2 dark:border-slate-800 md:block lg:hidden">
        <DailyCounter />
      </div>
    </header>
  );
}
