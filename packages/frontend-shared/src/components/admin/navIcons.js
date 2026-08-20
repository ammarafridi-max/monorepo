import {
  LayoutDashboard, Ticket, ShieldCheck, Inbox, Mail, BookOpen, Tag, Stamp,
  TrendingUp, Link2, Package, DollarSign, CircleDollarSign, Users, Handshake,
  UserCircle, Plane, ClipboardList, Shield, CalendarCheck, Car, MapPin,
  SlidersHorizontal, CalendarDays, FileText, MessageSquare,
} from 'lucide-react';

export const ICON_MAP = {
  LayoutDashboard, Ticket, ShieldCheck, Inbox, Mail, BookOpen, Tag, Stamp,
  TrendingUp, Link2, Package, DollarSign, CircleDollarSign, Users, Handshake,
  UserCircle, Plane, ClipboardList, Shield, CalendarCheck, Car, MapPin,
  SlidersHorizontal, CalendarDays, FileText, MessageSquare,
};

export function visibleNavFor(nav = [], role) {
  return nav
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}

export function mobileTabsFor(nav = [], role, limit = 4) {
  const items = visibleNavFor(nav, role).flatMap((section) => section.items);
  const flagged = items
    .filter((item) => item.mobile)
    .sort((a, b) => (a.mobile === true ? 0 : a.mobile) - (b.mobile === true ? 0 : b.mobile));
  return (flagged.length ? flagged : items).slice(0, limit);
}
