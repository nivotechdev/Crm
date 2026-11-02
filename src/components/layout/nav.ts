import { BarChart3, CalendarCheck, Columns3, Home, List, Settings, UserCheck } from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Painel', icone: Home, atalho: 'G D', fim: true },
  { to: '/leads', label: 'Leads', icone: List, atalho: 'G L', fim: true },
  { to: '/funil', label: 'Funil', icone: Columns3, atalho: 'G F' },
  { to: '/agenda', label: 'Agenda', icone: CalendarCheck, atalho: 'G A' },
  { to: '/clientes', label: 'Clientes', icone: UserCheck, atalho: 'G C' },
  { to: '/relatorios', label: 'Relatórios', icone: BarChart3, atalho: 'G R' },
  { to: '/configuracoes', label: 'Configurações', icone: Settings, atalho: 'G S' },
] as const;
