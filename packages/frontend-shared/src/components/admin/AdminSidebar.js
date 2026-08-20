'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import { useAdminLogout } from '../../hooks/auth/useAdminLogout.js';
import { isNavItemActive } from '../../utils/paths.js';
import { ICON_MAP, visibleNavFor } from './navIcons.js';

function NavItem({ item, collapsed }) {
  const pathname = usePathname();
  const isActive = isNavItemActive(pathname, item.href, item.exact);
  const Icon = ICON_MAP[item.icon];

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

export default function AdminSidebar({ nav = [], brand }) {
  const { adminUser } = useAdminAuth();
  const { logout, loggingOut } = useAdminLogout();
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = visibleNavFor(nav, adminUser?.role);
  const BrandIcon = brand?.icon ? ICON_MAP[brand.icon] : null;

  return (
    <aside
      className={`hidden lg:flex flex-col bg-gray-900 border-r border-white/10 transition-all duration-200 ease-in-out shrink-0 relative ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex flex-col h-full">

        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center shrink-0">
            {BrandIcon && <BrandIcon size={15} className="text-white" />}
          </div>
          {!collapsed && brand?.name && (
            <div className="min-w-0">
              <p className="text-white font-extrabold text-sm leading-none truncate">
                {brand.name}
              </p>
              <p className="text-primary-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                Admin Panel
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {visibleNav.map(({ section, items }) => (
            <div key={section}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  {section}
                </p>
              )}
              {collapsed && <div className="border-t border-white/10 mx-1 mb-2" />}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavItem key={item.href} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-white/10">
          <button
            onClick={logout}
            disabled={loggingOut}
            title={collapsed ? 'Sign out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-red-400 transition-all disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>}
          </button>
        </div>
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute bottom-24 -right-3 w-6 h-6 bg-gray-700 border border-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 transition shadow-sm"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
