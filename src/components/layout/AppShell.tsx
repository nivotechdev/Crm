import { Outlet, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAcoes } from '../../store/AcoesContext';
import { useHotkeys } from '../../hooks/useHotkeys';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { CommandPalette } from './CommandPalette';
import { ShortcutsHelp } from './ShortcutsHelp';

export function AppShell() {
  const { abrirNovoLead, setBuscaAberta, buscaAberta, setAtalhosAbertos } = useAcoes();
  const navigate = useNavigate();
  const modalAberto = () => !!document.querySelector('[role=dialog][aria-modal=true]');

  useHotkeys({
    'mod+k': () => setBuscaAberta(!buscaAberta),
    '/': () => !modalAberto() && setBuscaAberta(true),
    n: () => !modalAberto() && abrirNovoLead(),
    'shift+?': () => setAtalhosAbertos(true),
    '?': () => setAtalhosAbertos(true),
    'g d': () => navigate('/'),
    'g l': () => navigate('/leads'),
    'g f': () => navigate('/funil'),
    'g k': () => navigate('/funil'),
    'g a': () => navigate('/agenda'),
    'g c': () => navigate('/clientes'),
    'g r': () => navigate('/relatorios'),
    'g s': () => navigate('/configuracoes'),
  });

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="conteudo" className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
          <Outlet />
        </main>
      </div>
      <button
        onClick={() => abrirNovoLead()}
        aria-label="Novo lead"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 active:scale-95 md:hidden"
      >
        <Plus className="h-7 w-7" />
      </button>
      <BottomNav />
      <CommandPalette />
      <ShortcutsHelp />
    </div>
  );
}
