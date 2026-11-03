import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, CalendarClock, Gavel, Menu, User } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { useNotificacoes, type Notificacao } from '../../hooks/useNotificacoes';
import { iniciais } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Logo } from '../layout/Logo';
import { NAV_ICONS } from './navIcons';
import { ACCOUNT_MENU } from './accountMenu';
import type { NavItem, Role } from './navItems';

/** Última posição do sublinhado, guardada fora do componente para sobreviver a remontagens. */
let ultimaPosicao: { x: number; w: number } | null = null;

const CURVA = 'cubic-bezier(0.22, 1, 0.36, 1)';
const anel = 'outline-none focus-visible:ring-4 focus-visible:ring-brand-100 dark:focus-visible:ring-brand-500/30';

type Painel = 'notificacoes' | 'conta' | null;

/** Barra do topo em "ilha" (≥ 770 px): logo · abas · notificações e conta. */
export function TopBar({ role, items, active }: { role: Role; items: NavItem[]; active: string | null }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { config } = useData();
  const { setAtalhosAbertos } = useAcoes();
  const notif = useNotificacoes();
  const [painel, setPainel] = useState<Painel>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const barraRef = useRef<HTMLSpanElement>(null);
  const contaRef = useRef<HTMLDivElement>(null);

  // ── Vidro ao rolar: um único listener passivo alternando a classe
  useEffect(() => {
    const h = headerRef.current;
    if (!h) return;
    const aoRolar = () => h.classList.toggle('is-scrolled', window.scrollY > 8);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  // ── Sublinhado deslizante único
  useLayoutEffect(() => {
    const nav = navRef.current;
    const barra = barraRef.current;
    if (!nav || !barra) return;
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const aplicar = (x: number, w: number, animar: boolean) => {
      barra.style.transition = animar && !semAnimacao ? `transform 380ms ${CURVA}, width 380ms ${CURVA}` : 'none';
      barra.style.transform = `translateX(${x}px)`;
      barra.style.width = `${w}px`;
    };
    const posicionar = (animar: boolean) => {
      const aba = active ? nav.querySelector<HTMLElement>(`[data-tab-id="${active}"]`) : null;
      if (!aba || !aba.offsetWidth) {
        barra.style.opacity = '0';
        return;
      }
      barra.style.opacity = '1';
      aplicar(aba.offsetLeft, aba.offsetWidth, animar);
      ultimaPosicao = { x: aba.offsetLeft, w: aba.offsetWidth };
    };

    // Ao (re)montar, parte de onde estava e desliza até a aba ativa
    if (ultimaPosicao && !barra.dataset.montado) {
      aplicar(ultimaPosicao.x, ultimaPosicao.w, false);
      barra.style.opacity = '1';
      void barra.offsetWidth; // força o navegador a registrar o ponto de partida
    }
    const primeiraVez = !barra.dataset.montado && !ultimaPosicao;
    barra.dataset.montado = '1';
    posicionar(!primeiraVez);

    const aoRedimensionar = () => posicionar(false);
    window.addEventListener('resize', aoRedimensionar);
    let vivo = true;
    document.fonts?.ready.then(() => vivo && posicionar(false));
    return () => {
      vivo = false;
      window.removeEventListener('resize', aoRedimensionar);
    };
  }, [active]);

  // ── Painéis: Esc fecha; navegar fecha
  useEffect(() => {
    if (!painel) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setPainel(null);
      }
    };
    document.addEventListener('keydown', aoTeclar, true);
    return () => document.removeEventListener('keydown', aoTeclar, true);
  }, [painel]);
  useEffect(() => setPainel(null), [pathname, search]);

  // Foco no 1º item ao abrir o menu da conta
  useEffect(() => {
    if (painel === 'conta') requestAnimationFrame(() => contaRef.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus());
  }, [painel]);

  const ir = (path: string) => {
    setPainel(null);
    navigate(path);
  };
  const alternar = (p: Exclude<Painel, null>) => setPainel((atual) => (atual === p ? null : p));

  const nome = config.nomeVendedor.trim();
  const itensConta = ACCOUNT_MENU[role];

  return (
    <header ref={headerRef} className="app-header page-x pointer-events-none sticky top-0 z-30 hidden pb-2 pt-3 lg:block">
      {painel && <div className="pointer-events-auto fixed inset-0" aria-hidden onClick={() => setPainel(null)} />}

      <div className="app-island pointer-events-auto relative mx-auto grid h-[4.25rem] w-full max-w-[1000px] grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-full pl-3 pr-2.5">
        {/* Esquerda: logo */}
        <div className="flex items-center">
          <button type="button" onClick={() => ir('/')} aria-label="Consórcio CRM, ir para o início" className={cn('flex items-center gap-2.5 rounded-full pr-2', anel)}>
            <Logo />
            <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">Consórcio</span>
          </button>
        </div>

        {/* Centro: abas + sublinhado deslizante */}
        <nav ref={navRef} aria-label="Navegação principal" className="relative flex items-center gap-7 xl:gap-9">
          {items.map((it) => {
            const Icone = NAV_ICONS[it.icon];
            const ativo = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                data-tab-id={it.id}
                aria-current={ativo ? 'page' : undefined}
                onClick={() => ir(it.path)}
                className={cn(
                  'group inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl text-[0.9375rem] font-semibold transition-colors duration-200',
                  anel,
                  ativo ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                    ativo
                      ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-raised'
                      : 'bg-slate-100 text-slate-600 group-hover:scale-105 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700',
                  )}
                >
                  <Icone size={19} strokeWidth={2} />
                </span>
                {it.desktopLabel ?? it.label}
              </button>
            );
          })}
          <span ref={barraRef} aria-hidden className="pointer-events-none absolute left-0 top-[calc(100%+0.375rem)] h-0.5 rounded-full bg-brand-500 opacity-0" />
        </nav>

        {/* Direita: notificações + conta */}
        <div className="flex items-center justify-end gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => alternar('notificacoes')}
              aria-haspopup="dialog"
              aria-expanded={painel === 'notificacoes'}
              aria-label={notif.naoLidas ? `Notificações, ${notif.naoLidas} novas` : 'Notificações'}
              className={cn(
                'relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                painel === 'notificacoes' && 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white',
                anel,
              )}
            >
              <Bell size={18} strokeWidth={2} />
              {notif.naoLidas > 0 && (
                <span className="num absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[rgb(var(--c-surface))]">
                  {notif.naoLidas > 99 ? '99+' : notif.naoLidas}
                </span>
              )}
            </button>
            {painel === 'notificacoes' && (
              <PainelNotificacoes
                itens={notif.itens}
                isLida={notif.isLida}
                onAbrir={(n) => {
                  notif.marcarLida(n.id);
                  ir(n.path);
                }}
                onMarcarTodas={notif.marcarTodas}
                onVerTodas={() => ir('/agenda')}
              />
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => alternar('conta')}
              aria-haspopup="menu"
              aria-expanded={painel === 'conta'}
              aria-label="Menu da conta"
              className={cn(
                'flex h-11 items-center gap-2.5 rounded-full border border-slate-200 bg-white/80 pl-3.5 pr-1.5 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white',
                anel,
              )}
            >
              <Menu size={18} strokeWidth={2} />
              <Avatar nome={nome} tamanho={32} />
            </button>
            {painel === 'conta' && (
              <div
                ref={contaRef}
                role="menu"
                aria-label="Menu da conta"
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                  e.preventDefault();
                  const els = [...(contaRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])];
                  const i = els.indexOf(document.activeElement as HTMLElement);
                  els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus();
                }}
                className="absolute right-0 top-full mt-3 w-72 animate-fade-in rounded-2xl border border-slate-200 bg-white py-2 shadow-float dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 px-4 pb-3 pt-1.5">
                  <Avatar nome={nome} tamanho={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{nome || 'Vendedor'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Conta de vendedor</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" role="separator" />
                {itensConta.map((m) => {
                  const Icone = NAV_ICONS[m.icon];
                  return (
                    <button
                      key={m.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (m.path === '#atalhos') {
                          setPainel(null);
                          setAtalhosAbertos(true);
                        } else ir(m.path);
                      }}
                      className="flex h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-slate-700 outline-none transition-colors hover:bg-slate-50 focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
                    >
                      <Icone size={18} className="shrink-0 text-slate-400" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Avatar({ nome, tamanho }: { nome: string; tamanho: 32 | 40 }) {
  return (
    <span
      aria-hidden
      style={{ width: tamanho, height: tamanho }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
        tamanho === 40 ? 'text-sm' : 'text-xs',
      )}
    >
      {nome ? iniciais(nome) : <User size={tamanho === 40 ? 20 : 16} />}
    </span>
  );
}

const ICONE_AVISO: Record<Notificacao['tipo'], { Icone: typeof Bell; cls: string }> = {
  atrasada: { Icone: AlertCircle, cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' },
  hoje: { Icone: CalendarClock, cls: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300' },
  assembleia: { Icone: Gavel, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

function PainelNotificacoes({
  itens,
  isLida,
  onAbrir,
  onMarcarTodas,
  onVerTodas,
}: {
  itens: Notificacao[];
  isLida: (id: string) => boolean;
  onAbrir: (n: Notificacao) => void;
  onMarcarTodas: () => void;
  onVerTodas: () => void;
}) {
  const temNaoLidas = itens.some((n) => !isLida(n.id));
  return (
    <div role="dialog" aria-label="Notificações" className="absolute right-0 top-full mt-3 w-96 animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-float dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Notificações</p>
        {temNaoLidas && (
          <button type="button" onClick={onMarcarTodas} className={cn('rounded-full px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10', anel)}>
            Marcar todas como lidas
          </button>
        )}
      </div>
      {itens.length === 0 ? (
        <p className="px-4 pb-6 pt-4 text-center text-sm text-slate-500">Nada pendente por aqui.</p>
      ) : (
        <ul className="max-h-[22rem] overflow-y-auto px-2 pb-1">
          {itens.map((n) => {
            const { Icone, cls } = ICONE_AVISO[n.tipo];
            const lida = isLida(n.id);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onAbrir(n)}
                  className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:bg-slate-100 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', cls)}>
                    <Icone size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', lida ? 'font-medium text-slate-600 dark:text-slate-400' : 'font-semibold text-slate-900 dark:text-white')}>{n.titulo}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{n.detalhe}</span>
                  </span>
                  {!lida && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Não lida" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-slate-100 p-2 dark:border-slate-800">
        <button type="button" onClick={onVerTodas} className={cn('h-10 w-full rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800', anel)}>
          Ver todas na agenda
        </button>
      </div>
    </div>
  );
}
