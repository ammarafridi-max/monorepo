'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../contexts/AdminAuthContext.js';
import {
  Plane,
  LayoutDashboard,
  Ticket,
  Users,
  Handshake,
  BookOpen,
  Tag,
  CircleDollarSign,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

const NAV = [
  {
    section: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true,
        roles: ['admin', 'agent', 'blog-manager'],
      },
    ],
  },
  {
    section: 'Orders',
    items: [
      {
        label: 'Dummy Tickets',
        href: '/admin/dummy-tickets',
        icon: Ticket,
        roles: ['admin', 'agent'],
      },
      {
        label: 'Insurance',
        href: '/admin/insurance-applications',
        icon: ShieldCheck,
        roles: ['admin', 'agent'],
      },
    ],
  },
  {
    section: 'Content',
    items: [
      {
        label: 'Blog',
        href: '/admin/blog',
        icon: BookOpen,
        roles: ['admin', 'blog-manager'],
      },
      {
        label: 'Blog Tags',
        href: '/admin/blog-tags',
        icon: Tag,
        roles: ['admin', 'blog-manager'],
      },
    ],
  },
  {
    section: 'Finance',
    items: [
      {
        label: 'Pricing',
        href: '/admin/pricing',
        icon: DollarSign,
        roles: ['admin'],
      },
      {
        label: 'Currencies',
        href: '/admin/currencies',
        icon: CircleDollarSign,
        roles: ['admin'],
      },
    ],
  },
  {
    section: 'People',
    items: [
      {
        label: 'Admin Users',
        href: '/admin/users',
        icon: Users,
        roles: ['admin'],
      },
      {
        label: 'Affiliates',
        href: '/admin/affiliates',
        icon: Handshake,
        roles: ['admin', 'agent'],
      },
    ],
  },
  {
    section: 'Settings',
    items: [
      {
        label: 'My Account',
        href: '/admin/account',
        icon: UserCircle,
        roles: ['admin', 'agent', 'blog-manager'],
      },
    ],
  },
];

function NavItem({ item, collapsed }) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-primary-700 text-white shadow-sm shadow-primary-900/40'
          : 'text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export default function AdminSidebar() {
  const router = useRouter();
  const { adminUser, setAdminUser } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleNav = NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(adminUser?.role);
    }),
  })).filter((section) => section.items.length > 0);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // continue — cookie will expire naturally
    } finally {
      setAdminUser(null);
      router.push('/admin/login');
      router.refresh();
    }
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center shrink-0">
          <Plane size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm leading-none truncate">
              Travl
            </p>
            <p className="text-primary-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {visibleNav.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {section}
              </p>
            )}
            {collapsed && (
              <div className="border-t border-white/10 mx-1 mb-2" />
            )}
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavItem key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-red-400 transition-all disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && (
            <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-gray-900 border border-white/10 rounded-xl flex items-center justify-center text-white shadow-lg"
      >
        <Menu size={16} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
        >
          <X size={14} />
        </button>
        {SidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-gray-900 border-r border-white/10 transition-all duration-200 ease-in-out shrink-0 relative ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {SidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute bottom-24 -right-3 w-6 h-6 bg-gray-700 border border-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 transition shadow-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
