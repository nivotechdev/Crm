import type { IconName } from './navIcons';

/** Perfis de usuário. Este app tem um só: o vendedor. */
export type Role = 'vendedor';

export interface NavItem {
  id: string;
  icon: IconName;
  label: string;
  /** Rótulo opcional mais longo, só no computador. */
  desktopLabel?: string;
  path: string;
}

/** Abas principais (celular e computador). 1ª = Início; no máximo 3–4 abas. */
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  vendedor: [
    { id: 'inicio', icon: 'inicio', label: 'Início', path: '/' },
    { id: 'leads', icon: 'leads', label: 'Leads', path: '/leads' },
    { id: 'agenda', icon: 'agenda', label: 'Agenda', path: '/agenda' },
  ],
};
