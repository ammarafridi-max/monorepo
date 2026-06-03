'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplay(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  markedDate,
  markedLabel,
  inputClassName,
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const [mode, setMode] = useState('calendar');

  const containerRef = useRef(null);
  const selected = parseDate(value);
  const minD = parseDate(minDate);
  const maxD = parseDate(maxDate);
  const marked = parseDate(markedDate);

  useEffect(() => {
    const base = selected || minD || new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setMode('calendar');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function openPicker() {
    const base = selected || minD || new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setMode('calendar');
    setOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(date) {
    if (isDisabledDay(date)) return;
    onChange(toStr(date));
    setOpen(false);
    setMode('calendar');
  }

  function isDisabledDay(date) {
    const d = startOfDay(date);
    if (minD && d < startOfDay(minD)) return true;
    if (maxD && d > startOfDay(maxD)) return true;
    return false;
  }

  function getDaysInGrid() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  const yearRange = (() => {
    const currentYear = new Date().getFullYear();
    const start = minD ? minD.getFullYear() : currentYear;
    const end = maxD ? maxD.getFullYear() : currentYear + 2;
    const years = [];
    for (let y = start; y <= end; y++) years.push(y);
    return years;
  })();

  const canGoPrev = (() => {
    if (!minD) return true;
    const prev =
      viewMonth === 0
        ? new Date(viewYear - 1, 11, 1)
        : new Date(viewYear, viewMonth - 1, 1);
    return new Date(prev.getFullYear(), prev.getMonth() + 1, 0) >= startOfDay(minD);
  })();

  const canGoNext = (() => {
    if (!maxD) return true;
    const next =
      viewMonth === 11
        ? new Date(viewYear + 1, 0, 1)
        : new Date(viewYear, viewMonth + 1, 1);
    return next <= startOfDay(maxD);
  })();

  const cells = getDaysInGrid();

  const triggerCls =
    inputClassName ||
    'w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-mute focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 transition-colors';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={openPicker}
        className={`flex items-center justify-between gap-2 text-left ${triggerCls} ${!selected ? 'text-ink-mute' : ''}`}
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <CalendarDays size={15} className="shrink-0 text-ink-mute" />
      </button>

      {open && viewYear !== null && (
        <div className="absolute left-0 z-50 mt-1.5 w-72 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-warm">

          <div className="flex items-center justify-between border-b border-sand-100 px-4 py-3">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>

            {mode === 'calendar' ? (
              <button
                type="button"
                onClick={() => setMode('month')}
                className="flex items-center gap-1 text-sm font-bold text-ink transition-colors hover:text-clay-600"
              >
                {MONTHS[viewMonth]} {viewYear}
                <ChevronDown size={13} className="text-ink-mute" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('calendar')}
                className="text-sm font-bold text-clay-600 hover:underline"
              >
                Back to calendar
              </button>
            )}

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {mode === 'month' && (
            <div className="max-h-64 overflow-y-auto p-3">
              <div className="mb-3 grid grid-cols-3 gap-1.5">
                {MONTHS.map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setViewMonth(idx); setMode('year'); }}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                      idx === viewMonth
                        ? 'bg-clay-600 text-white'
                        : 'text-ink-soft hover:bg-sand-100'
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'year' && (
            <div className="max-h-64 overflow-y-auto p-3">
              <div className="grid grid-cols-4 gap-1.5">
                {yearRange.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => { setViewYear(yr); setMode('calendar'); }}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                      yr === viewYear
                        ? 'bg-clay-600 text-white'
                        : 'text-ink-soft hover:bg-sand-100'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'calendar' && (
            <div className="p-3">
              <div className="mb-1 grid grid-cols-7">
                {DAYS.map((d) => (
                  <div key={d} className="py-1 text-center text-xs font-bold text-ink-mute">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((date, i) => {
                  if (!date) return <div key={`e-${i}`} />;
                  const isSelected = isSameDay(date, selected);
                  const isMarked = isSameDay(date, marked);
                  const isDisabled = isDisabledDay(date);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button
                      key={toStr(date)}
                      type="button"
                      onClick={() => selectDay(date)}
                      disabled={isDisabled}
                      title={isMarked && markedLabel ? markedLabel : undefined}
                      className={[
                        'relative flex h-8 w-full items-center justify-center rounded-full text-xs transition-colors',
                        isDisabled ? 'cursor-not-allowed text-sand-400' : 'cursor-pointer',
                        isSelected ? 'bg-clay-600 font-bold text-white' : '',
                        isMarked && !isSelected
                          ? 'bg-clay-50 font-bold text-clay-700 ring-2 ring-clay-400 ring-offset-1'
                          : '',
                        !isSelected && !isMarked && !isDisabled
                          ? 'text-ink hover:bg-sand-100'
                          : '',
                        isToday && !isSelected && !isMarked ? 'font-bold text-clay-600' : '',
                      ].join(' ')}
                    >
                      {date.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-clay-500" />
                      )}
                      {isMarked && !isSelected && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-clay-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {(marked || selected) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-sand-100 pt-2 text-xs">
                  {marked && (
                    <span className="flex items-center gap-1 rounded-full bg-clay-50 px-2 py-0.5 font-medium text-clay-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-clay-500" />
                      {markedLabel || 'Marked'}: {formatDisplay(marked)}
                    </span>
                  )}
                  {selected && (
                    <span className="flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 font-medium text-ink-soft">
                      <span className="inline-block h-2 w-2 rounded-full bg-clay-600" />
                      Selected: {formatDisplay(selected)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
