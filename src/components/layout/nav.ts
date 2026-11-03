import { BarChart3, CalendarCheck, Home, LayoutGrid, Settings, UserCheck } from 'lucide-react';

/** Navegação principal (menu lateral e barra inferior). */
export const NAV = [
  { to: '/', label: 'Início', icone: Home, atalho: 'G D', fim: true },
  { to: '/leads', label: 'Leads', icone: LayoutGrid, atalho: 'G L', fim: true },
  { to: '/agenda', label: 'Agenda', icone: CalendarCheck, atalho: 'G A' },
  { to: '/clientes', label: 'Clientes', icone: UserCheck, atalho: 'G C' },
  { to: '/relatorios', label: 'Relatórios', icone: BarChart3, atalho: 'G R' },
] as const;

/** Configurações ficam fora da navegação: botão na tela inicial (e atalho G S). */
export const NAV_CONFIG = { to: '/configuracoes', label: 'Configurações', icone: Settings, atalho: 'G S' } as const;
