import type { IconName } from './navIcons';
import type { Role } from './navItems';

export interface MenuEntry {
  icon: IconName;
  label: string;
  path: string;
}

/**
 * Menu da conta (só no computador), na ordem exibida.
 * "#atalhos" abre a janela de atalhos de teclado em vez de navegar.
 * "Sair da conta" entra aqui quando o app tiver login.
 */
export const ACCOUNT_MENU: Record<Role, MenuEntry[]> = {
  vendedor: [
    { icon: 'configuracoes', label: 'Configurações', path: '/configuracoes' },
    { icon: 'clientes', label: 'Clientes (pós-venda)', path: '/clientes' },
    { icon: 'notificacoes', label: 'Notificações', path: '/agenda' },
    { icon: 'ajuda', label: 'Atalhos e ajuda', path: '#atalhos' },
  ],
};
