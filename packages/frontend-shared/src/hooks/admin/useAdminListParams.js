'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '../general/useDebounce';

export function useAdminListParams({
  defaults = {},
  searchKey = 'search',
  pageKey = 'page',
  method = 'push',
  scroll,
  debounceMs = 300,
  clearValues = [],
  countFilters,
  syncSearch = true,
  resetPage = true,
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [pending, setPending] = useState({});
  useEffect(() => {
    setPending({});
  }, [queryString]);

  function baseline(key) {
    return defaults[key] ?? '';
  }

  function urlValue(key) {
    const raw = searchParams.get(key);
    return raw === null || raw === '' ? baseline(key) : raw;
  }

  function navigate(next) {
    const url = `${pathname}?${next.toString()}`;
    if (scroll === undefined) router[method](url);
    else router[method](url, { scroll });
  }

  function setParams(entries) {
    const next = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries(entries)) {
      if (!value || clearValues.includes(value)) next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete(pageKey);
    setPending((prev) => ({ ...prev, ...entries }));
    navigate(next);
  }

  function setParam(key, value) {
    setParams({ [key]: value });
  }

  function goToPage(target) {
    const next = new URLSearchParams(queryString);
    next.set(pageKey, String(target));
    navigate(next);
  }

  const urlSearch = syncSearch ? urlValue(searchKey) : '';
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search, debounceMs);

  useEffect(() => {
    if (!syncSearch) return;
    setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  useEffect(() => {
    if (!syncSearch) return;
    if (debouncedSearch !== search) return;
    if (debouncedSearch === urlSearch) return;
    const next = new URLSearchParams(queryString);
    if (debouncedSearch) next.set(searchKey, debouncedSearch);
    else next.delete(searchKey);
    next.delete(pageKey);
    navigate(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, search, urlSearch]);

  const params = {};
  for (const key of new Set([...Object.keys(defaults), searchKey])) {
    params[key] = key in pending ? pending[key] : urlValue(key);
  }
  const filterKeys = countFilters ?? Object.keys(defaults).filter((key) => key !== searchKey);
  const activeFilterCount = filterKeys.filter((key) => params[key] !== baseline(key)).length;

  return {
    params,
    page: Number(searchParams.get(pageKey) || 1),
    search,
    setSearch,
    setParam,
    setParams,
    goToPage,
    activeFilterCount,
    searchParams,
  };
}
