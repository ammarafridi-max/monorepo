'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import { useDebounce } from '../../hooks/general/useDebounce.js';
import { useDummyTickets } from '../../hooks/dummy-tickets/useDummyTickets.js';
import { useGetInsuranceApplications } from '../../hooks/insurance/useGetInsuranceApplications.js';
import { useGetAdminVisaLeads } from '../../hooks/visa-leads/useGetAdminVisaLeads.js';
import { useGetAdminUsers } from '../../hooks/admin-users/useGetAdminUsers.js';
import { useGetBlogs } from '../../hooks/blog/useGetBlogs.js';

const ROLE_LABELS = {
  admin: 'Admin',
  agent: 'Agent',
  'blog-manager': 'Blog Manager',
};

export const TRAVEL_SEARCH_CATEGORIES = [
  { key: 'tickets',   label: 'Dummy Tickets', color: 'bg-blue-50 text-blue-700' },
  { key: 'insurance', label: 'Insurance',     color: 'bg-green-50 text-green-700' },
  { key: 'leads',     label: 'Visa Leads',    color: 'bg-violet-50 text-violet-700' },
  { key: 'users',     label: 'Admin Users',   color: 'bg-amber-50 text-amber-700' },
  { key: 'blogs',     label: 'Blog Posts',    color: 'bg-rose-50 text-rose-700' },
];

function normaliseResults(key, items = []) {
  if (key === 'tickets') {
    return items.slice(0, 4).map((t) => {
      const p = t.passengers?.[0];
      const name = p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : null;
      return {
        id: t.sessionId,
        primary: name || t.email || t.sessionId,
        secondary: name ? t.email : `${t.from ?? ''} → ${t.to ?? ''}`,
        href: `/admin/dummy-tickets/${t.sessionId}`,
      };
    });
  }

  if (key === 'insurance') {
    return items.slice(0, 4).map((a) => ({
      id: a.sessionId || a._id,
      primary: a.email || a.sessionId,
      secondary: a.sessionId,
      href: `/admin/insurance-applications/${a.sessionId}`,
    }));
  }

  if (key === 'leads') {
    return items.slice(0, 4).map((l) => ({
      id: l._id,
      primary: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim() || l.email,
      secondary: `${l.email}${l.visaCountryName ? ` · ${l.visaCountryName}` : ''}`,
      href: `/admin/visa-leads/${l._id}`,
    }));
  }

  if (key === 'users') {
    return items.slice(0, 4).map((u) => ({
      id: u._id || u.username,
      primary: u.name || u.username,
      secondary: `${u.email}${u.role ? ` · ${ROLE_LABELS[u.role] ?? u.role}` : ''}`,
      href: `/admin/users`,
    }));
  }

  if (key === 'blogs') {
    return items.slice(0, 4).map((b) => ({
      id: b._id,
      primary: b.title || b.slug || b._id,
      secondary: b.status ?? '',
      href: `/admin/blog/${b._id}`,
    }));
  }

  return [];
}

/**
 * A search source: given the debounced query, return `{ results, loading }` where
 * results is keyed by category and each item is { id, primary, secondary, href }.
 * Passed in as a prop so an app searches its OWN domains; this one is the travel
 * dashboard's. It is a hook, so it must be a stable module-level function.
 */
export function useTravelSearchResults(debouncedQuery, enabled) {
  const searchFilters = { search: debouncedQuery, limit: 4 };
  // No brand mounts all five domains, so several of these always 404. Retrying
  // them holds the dropdown on a spinner for seconds.
  const searchOpts = { enabled, retry: false };

  const { dummyTickets, isLoadingDummyTickets } = useDummyTickets(searchFilters, searchOpts);
  const { applications, isLoadingApplications } = useGetInsuranceApplications(searchFilters, searchOpts);
  const { leads, isLoadingLeads } = useGetAdminVisaLeads(searchFilters, { ...searchOpts, refetchInterval: false });
  const { users, isLoadingUsers } = useGetAdminUsers(searchFilters, searchOpts);
  const { blogs, isLoadingBlogs } = useGetBlogs(searchFilters, searchOpts);

  const loading =
    enabled &&
    (isLoadingDummyTickets || isLoadingApplications || isLoadingLeads || isLoadingUsers || isLoadingBlogs);

  const results = useMemo(() => {
    if (!enabled) return {};
    const userList = Array.isArray(users) ? users : users?.users ?? [];
    return {
      tickets: normaliseResults('tickets', dummyTickets ?? []),
      insurance: normaliseResults('insurance', applications ?? []),
      leads: normaliseResults('leads', leads ?? []),
      users: normaliseResults('users', userList),
      blogs: normaliseResults('blogs', blogs ?? []),
    };
  }, [enabled, dummyTickets, applications, leads, users, blogs]);

  return { results, loading };
}

function GlobalSearch({ categories, useSearchResults, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), 300);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const enabled = debouncedQuery.length >= 2;
  const { results, loading } = useSearchResults(debouncedQuery, enabled);

  useEffect(() => {
    if (enabled) setOpen(true);
  }, [enabled, debouncedQuery]);

  const searched = enabled && !loading;

  const totalResults = Object.values(results).reduce((s, arr) => s + arr.length, 0);
  const hasResults = totalResults > 0;

  function handleSelect() {
    setOpen(false);
    setQuery('');
  }

  function handleClear() {
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">

      <div className="relative">
        <Search
          size={15}
          className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (searched) setOpen(true); }}
          placeholder={placeholder}
          className="w-full h-9 pl-7 pr-7 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 border-0 rounded-none focus:outline-none"
        />

        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={14} className="text-gray-500 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-900 transition"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-[440px] overflow-y-auto">
          {loading && !searched ? (
            <div className="px-4 py-6 text-center text-[13px] text-gray-400">
              Searching…
            </div>
          ) : !hasResults && searched ? (
            <div className="px-4 py-6 text-center text-[13px] text-gray-400">
              No results for <span className="font-medium text-gray-600">"{debouncedQuery}"</span>
            </div>
          ) : (
            <div className="py-1.5">
              {categories.map(({ key, label, color }) => {
                const items = results[key] ?? [];
                if (!items.length) return null;
                return (
                  <div key={key}>

                    <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${color}`}>
                        {label}
                      </span>
                    </div>

                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={handleSelect}
                        className="flex flex-col gap-0.5 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[13px] font-medium text-gray-800 leading-snug truncate">
                          {item.primary}
                        </span>
                        {item.secondary && (
                          <span className="text-[11px] text-gray-400 leading-snug truncate">
                            {item.secondary}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * `globalSearch` mounts the header search. The data source is a prop so each app
 * searches its OWN domains; the defaults are the travel dashboard's. An app with
 * none of those either passes its own `useSearchResults` + `searchCategories`, or
 * false, rather than firing requests that all 404.
 */
export default function AdminHeader({
  globalSearch = true,
  searchCategories = TRAVEL_SEARCH_CATEGORIES,
  useSearchResults = useTravelSearchResults,
  searchPlaceholder = 'Search tickets, insurance, leads…',
}) {
  const { adminUser } = useAdminAuth();

  const initials = adminUser?.name
    ? adminUser.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="hidden lg:flex h-14 bg-white border-b border-gray-100 shrink-0 items-center gap-4 px-6">
      {globalSearch ? (
        <Suspense fallback={<div className="flex-1 max-w-md" />}>
          <GlobalSearch
            categories={searchCategories}
            useSearchResults={useSearchResults}
            placeholder={searchPlaceholder}
          />
        </Suspense>
      ) : (
        <div className="flex-1 max-w-md" />
      )}

      <div className="flex-1" />

      {adminUser && (
        <Link
          href="/admin/account"
          className="flex items-center gap-2.5 hover:opacity-80 transition shrink-0"
        >
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-800 leading-none">
              {adminUser.name}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
              {ROLE_LABELS[adminUser.role] ?? adminUser.role}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
        </Link>
      )}
    </header>
  );
}
