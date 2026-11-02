import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarCheck, Columns3, Home, List, MoreHorizontal, Settings, UserCheck } from 'lucide-react';
import { useDerivados } from '../../hooks/useDerivados';
import { cn } from '../../lib/cn';
import { Modal } from '../ui/Modal';

const ITENS = [
  { to: '/', label: 'Início', icone: Home, end: true },
  { to: '/leads', label: 'Leads', icone: List, end: true },
  { to: '/funil', label: 'Funil', icone: Columns3 },
  { to: '/agenda', label: 'Agenda', icone: CalendarCheck },
];

const MAIS = [
  { to: '/clientes', label: 'Clientes', icone: UserCheck },
  { to: '/relatorios', label: 'Relatórios', icone: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icone: Settings },
];

/** Navegação inferior (celular). */
export function BottomNav() {
  const [mais, setMais] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const d = useDerivados();
  const pend = d.tarefasAtrasadas.length + d.tarefasHoje.length;
  const maisAtivo = MAIS.some((m) => pathname.startsWith(m.to));

  const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium';
  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
      >
        {ITENS.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => cn(item, isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400')}
          >
            <span className="relative">
              <n.icone className="h-6 w-6" />
              {n.to === '/agenda' && pend > 0 && (
                <span className="absolute -right-2 -top-1 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">{pend}</span>
              )}
            </span>
            {n.label}
          </NavLink>
        ))}
        <button onClick={() => setMais(true)} className={cn(item, maisAtivo ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400')}>
          <MoreHorizontal className="h-6 w-6" />
          Mais
        </button>
      </nav>
      <Modal aberto={mais} onFechar={() => setMais(false)} titulo="Mais">
        <div className="grid gap-1 pb-2">
          {MAIS.map((m) => (
            <button
              key={m.to}
              onClick={() => {
                setMais(false);
                navigate(m.to);
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-left text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <m.icone className="h-5 w-5 text-slate-500" /> {m.label}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
