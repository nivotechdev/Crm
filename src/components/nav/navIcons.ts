import { CalendarDays, Bell, Home, Keyboard, Settings, UserCheck, Users, type LucideIcon } from 'lucide-react';

/** Ícones usados pela navegação (mesma biblioteca do restante do app). */
export type IconName = 'inicio' | 'leads' | 'agenda' | 'configuracoes' | 'clientes' | 'notificacoes' | 'ajuda';

export const NAV_ICONS: Record<IconName, LucideIcon> = {
  inicio: Home,
  leads: Users,
  agenda: CalendarDays,
  configuracoes: Settings,
  clientes: UserCheck,
  notificacoes: Bell,
  ajuda: Keyboard,
};
