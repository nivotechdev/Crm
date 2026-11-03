import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAcoes } from '../../store/AcoesContext';
import { useHotkeys } from '../../hooks/useHotkeys';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { CommandPalette } from './CommandPalette';
import { ShortcutsHelp } from './ShortcutsHelp';

export function AppShell() {
  const { abrirNovoLead, abrirAgendamento, setBuscaAberta, buscaAberta, setAtalhosAbertos } = useAcoes();
  const { pathname } = useLocation();
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
    m: () => {
      if (modalAberto()) return;
      const id = pathname.match(/^\/leads\/([^/]+)$/)?.[1];
      abrirAgendamento(id ? { leadId: id, tipo: 'reuniao' } : { tipo: 'reuniao' });
    },
    'g a': () => navigate('/agenda'),
    'g c': () => navigate('/clientes'),
    'g r': () => navigate('/relatorios'),
    'g s': () => navigate('/configuracoes'),
  });

  return (
    <div className="flex min-h-dvh bg-[color:var(--app-bg)] text-slate-900 dark:text-slate-100">
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
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[0_10px_24px_-6px_rgba(238,74,6,0.55)] transition-transform active:scale-95 md:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <BottomNav />
      <CommandPalette />
      <ShortcutsHelp />
    </div>
  );
}
