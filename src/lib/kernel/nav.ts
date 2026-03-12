import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Inbox,
  MessageSquare,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
}

/**
 * Maps module IDs → sidebar nav items (healthcare vertical).
 * The kernel owns this. Modules do NOT define their own nav.
 * Rule: No module imports from another module.
 */
const MODULE_NAV: Record<string, NavItem[]> = {
  _always:  [{ href: '/admin',               label: 'Dashboard',    Icon: LayoutDashboard, exact: true }],
  crm:      [{ href: '/admin/contacts',       label: 'Contacts',     Icon: Users }],
  calendar: [{ href: '/admin/appointments',  label: 'Appointments', Icon: CalendarDays }],
  inbox:    [{ href: '/admin/inquiries',     label: 'Inquiries',    Icon: Inbox },
             { href: '/admin/messages',      label: 'Messages',     Icon: MessageSquare }],
  entities: [{ href: '/admin/blog',          label: 'Blog',         Icon: BookOpen }],
};

export function getNavForModules(activeModules: string[]): NavItem[] {
  const items: NavItem[] = [...(MODULE_NAV['_always'] ?? [])];
  for (const moduleId of activeModules) {
    items.push(...(MODULE_NAV[moduleId] ?? []));
  }
  return items;
}
