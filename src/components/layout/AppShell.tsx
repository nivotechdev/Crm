import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAcoes } from '../../store/AcoesContext';
import { useHotkeys } from '../../hooks/useHotkeys';
import { cn } from '../../lib/cn';
import type { Role } from '../nav/navItems';
import { AppNav } from '../nav/AppNav';
import { CommandPalette } from './CommandPalette';
import { ShortcutsHelp } from './ShortcutsHelp';

/** Caminhos que são "raiz de aba": só neles a pílula do celular aparece. */
export const TAB_ROOTS: Record<Role, ReadonlySet<string>> = {
  vendedor: new Set(['/', '/leads', '/agenda']),
};

/** Qual aba fica acesa para o caminho atual (null = nenhuma). */
export function tabIdForPath(path: string, role: Role): string | null {
  if (role === 'vendedor') {
    if (path === '/') return 'inicio';
    if (path === '/leads' || path.startsWith('/leads/')) return 'leads';
    if (path === '/agenda') return 'agenda';
  }
  return null;
}

const ROLE: Role = 'vendedor';

export function AppShell() {
  const { abrirNovoLead, abrirAgendamento, setBuscaAberta, buscaAberta, setAtalhosAbertos } = useAcoes();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const naRaizDeAba = TAB_ROOTS[ROLE].has(pathname);
  const abaAtiva = tabIdForPath(pathname, ROLE);
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
    'g r': () => {
      navigate('/');
      setTimeout(() => document.getElementById('relatorios')?.scrollIntoView({ behavior: 'smooth' }), 120);
    },
    'g s': () => navigate('/configuracoes'),
  });

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[color:var(--app-bg)] text-slate-900 dark:text-slate-100" data-aba-ativa={abaAtiva ?? undefined}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      <AppNav role={ROLE} active={abaAtiva} showMobilePill={naRaizDeAba} />
      <main id="conteudo" className={cn('min-w-0 flex-1', naRaizDeAba ? 'pb-28 lg:pb-16' : 'pb-8 lg:pb-16')}>
        {/* Troca de tela: entrada suave (sem animação com movimento reduzido) */}
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
      <ShortcutsHelp />
    </div>
  );
}
