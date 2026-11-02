import { Moon, Search, Sun } from 'lucide-react';
import { useAcoes } from '../../store/AcoesContext';
import { useTheme } from '../../store/ThemeContext';
import { DailyCounter } from './DailyCounter';
import { Logo } from './Logo';
import { IconButton } from '../ui/Button';

export function Topbar() {
  const { setBuscaAberta } = useAcoes();
  const { escuro, setTema } = useTheme();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-slate-50/85 dark:bg-slate-950/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-slate-800/80">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <Logo className="h-8 w-8 md:hidden" />
        <button
          onClick={() => setBuscaAberta(true)}
          className="hidden h-10 w-80 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-slate-200/80 bg-white px-4 text-sm text-slate-400 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 md:flex"
        >
          <Search className="h-4 w-4 shrink-0" /> <span className="truncate">Buscar lead ou cliente</span>
          <kbd className="ml-auto shrink-0 font-sans text-[11px] font-medium text-slate-400">Ctrl K</kbd>
        </button>
        <div className="min-w-0 flex-1 md:hidden">
          <DailyCounter compacto />
        </div>
        <div className="ml-auto hidden lg:block">
          <DailyCounter />
        </div>
        <IconButton label="Buscar" className="md:hidden" onClick={() => setBuscaAberta(true)}>
          <Search className="h-5 w-5" />
        </IconButton>
        <IconButton label={escuro ? 'Usar modo claro' : 'Usar modo escuro'} onClick={() => setTema(escuro ? 'claro' : 'escuro')} className="md:ml-auto lg:ml-0">
          {escuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </IconButton>
      </div>
      <div className="hidden px-8 pb-3 md:block lg:hidden">
        <DailyCounter />
      </div>
    </header>
  );
}
