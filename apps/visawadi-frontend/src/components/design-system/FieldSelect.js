"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

function Flag({ code }) {
  const cc = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return <span aria-hidden="true">🏳️</span>;
  const points = [...cc].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return (
    <span className="text-lg leading-none" aria-hidden="true">
      {String.fromCodePoint(...points)}
    </span>
  );
}

export default function FieldSelect({
  label,
  hint,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const triggerRef = useRef(null);

  const id = useId();
  const listId = `${id}-list`;
  const labelId = `${id}-label`;

  const selected = useMemo(
    () => options.find((o) => o.code === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase() === q,
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();

    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function close({ focusTrigger = false } = {}) {
    setOpen(false);
    setQuery("");
    if (focusTrigger) triggerRef.current?.focus();
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    setActive(Math.max(0, options.findIndex((o) => o.code === value)));
    setOpen(true);
  }

  function pick(option) {
    if (!option) return;
    onChange(option.code);
    close({ focusTrigger: true });
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close({ focusTrigger: true });
    } else if (e.key === "Tab") {
      close();
    }
  }

  return (
    <div className="relative w-full" ref={rootRef}>
      <span
        id={labelId}
        className="mb-2 block text-label font-semibold text-ink-body"
      >
        {label}
        {hint && (
          <span className="ml-1.5 font-normal text-ink-faint">{hint}</span>
        )}
      </span>

      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelId}
        className={`flex min-h-14 w-full items-center gap-2.5 rounded-field border bg-canvas px-4 text-left transition-all duration-150 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 ${
          invalid
            ? "border-notice"
            : open
              ? "border-brand-600 bg-surface ring-2 ring-brand-100"
              : "border-line hover:border-ink-faint"
        }`}
      >
        {selected && <Flag code={selected.flagCode || selected.code} />}
        <span
          className={`min-w-0 flex-1 truncate text-base ${
            selected ? "font-medium text-ink" : "text-ink-soft"
          }`}
        >
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-panel border border-line bg-surface shadow-sheet sm:min-w-[18rem]">
          <div className="border-b border-line-soft p-2">
            <div className="flex items-center gap-2 rounded-field bg-canvas px-3 py-2.5">
              <Search size={14} aria-hidden="true" className="shrink-0 text-ink-faint" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  filtered[active] ? `${id}-opt-${filtered[active].code}` : undefined
                }
                aria-label={`Search ${label}`}
                placeholder="Search"
                className="w-full bg-transparent text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          </div>

          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-labelledby={labelId}
            className="max-h-64 overflow-y-auto py-1.5"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-4 text-center text-sm text-ink-faint">
                No matches
              </li>
            ) : (
              filtered.map((o, i) => {
                const isSelected = o.code === value;
                return (
                  <li key={o.code}>
                    <button
                      type="button"
                      id={`${id}-opt-${o.code}`}
                      role="option"
                      aria-selected={isSelected}
                      data-active={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(o)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[0.9375rem] transition-colors ${
                        i === active ? "bg-brand-50" : ""
                      } ${isSelected ? "font-medium text-brand-700" : "text-ink"}`}
                    >
                      <Flag code={o.flagCode || o.code} />
                      <span className="min-w-0 flex-1 truncate">{o.name}</span>
                      {isSelected && (
                        <Check size={15} aria-hidden="true" className="shrink-0 text-brand-600" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
