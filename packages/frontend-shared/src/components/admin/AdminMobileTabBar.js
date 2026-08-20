'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MoreHorizontal, X } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import { useAdminLogout } from '../../hooks/auth/useAdminLogout.js';
import { isNavItemActive } from '../../utils/paths.js';
import { ICON_MAP, visibleNavFor, mobileTabsFor } from './navIcons.js';

const SHEET_KEYFRAMES = `
@keyframes adminSheetFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes adminSheetRise { from { transform: translateY(100%) } to { transform: translateY(0) } }
`;

const ROLE_LABELS = {
  admin: 'Admin',
  agent: 'Agent',
  'blog-manager': 'Blog Manager',
};

function Tab({ icon, label, href, active, onClick }) {
  const Icon = ICON_MAP[icon] ?? MoreHorizontal;
  const body = (
    <>
      <span
        className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
          active ? 'bg-primary-50 text-primary-700' : 'text-gray-400'
        }`}
      >
        <Icon size={19} strokeWidth={active ? 2.4 : 2} />
      </span>
      <span
        className={`text-[10px] font-semibold leading-none truncate max-w-full px-1 ${
          active ? 'text-primary-700' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </>
  );

  const className =
    'flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full select-none active:scale-95 transition-transform';

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-expanded={active}>
      {body}
    </button>
  );
}

function MoreSheet({ nav, brand, onClose }) {
  const pathname = usePathname();
  const { adminUser } = useAdminAuth();
  const { logout, loggingOut } = useAdminLogout();
  const sections = visibleNavFor(nav, adminUser?.role);
  const BrandIcon = brand?.icon ? ICON_MAP[brand.icon] : null;

  const initials = adminUser?.name
    ? adminUser.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <style>{SHEET_KEYFRAMES}</style>
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-[adminSheetFade_150ms_ease-out]"
        onClick={onClose}
      />

      <div className="relative bg-gray-50 rounded-t-3xl max-h-[86vh] flex flex-col shadow-2xl animate-[adminSheetRise_220ms_cubic-bezier(0.32,0.72,0,1)]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center gap-3 px-5 pb-4 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center shrink-0">
            {BrandIcon ? <BrandIcon size={17} className="text-white" /> : (
              <span className="text-xs font-bold text-white">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-gray-900 leading-none truncate">
              {adminUser?.name ?? brand?.name}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 leading-none">
              {ROLE_LABELS[adminUser?.role] ?? adminUser?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 flex items-center justify-center text-gray-500 active:scale-95 transition"
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-4 space-y-5">
          {sections.map(({ section, items }) => (
            <div key={section}>
              <p className="px-1 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {section}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100">
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isNavItemActive(pathname, item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3.5 py-3 active:bg-gray-50 transition"
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {Icon && <Icon size={16} />}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          active ? 'font-semibold text-primary-700' : 'font-medium text-gray-700'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3.5 py-3 bg-white rounded-2xl text-sm font-semibold text-red-600 active:bg-red-50 transition disabled:opacity-50"
          >
            <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <LogOut size={16} />
            </span>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  );
}

export default function AdminMobileTabBar({ nav = [], brand }) {
  const pathname = usePathname();
  const { adminUser } = useAdminAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e) { if (e.key === 'Escape') setMoreOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const tabs = mobileTabsFor(nav, adminUser?.role);
  const moreActive =
    moreOpen || !tabs.some((t) => isNavItemActive(pathname, t.href, t.exact));

  return (
    <>
      {moreOpen && <MoreSheet nav={nav} brand={brand} onClose={() => setMoreOpen(false)} />}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-1px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-stretch h-14">
          {tabs.map((item) => (
            <Tab
              key={item.href}
              icon={item.icon}
              label={item.mobileLabel ?? item.label}
              href={item.href}
              active={isNavItemActive(pathname, item.href, item.exact)}
            />
          ))}
          <Tab
            icon="MoreHorizontal"
            label="More"
            active={moreActive}
            onClick={() => setMoreOpen((o) => !o)}
          />
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </>
  );
}
