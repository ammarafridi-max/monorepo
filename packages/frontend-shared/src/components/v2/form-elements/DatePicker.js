'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

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
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  minDate,
  maxDate,
  markedDate,
  markedLabel,
  required,
  inputClassName,
}) {
  const [open, setOpen]       = useState(false);
  const [viewYear, setViewYear]   = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const [mode, setMode]       = useState('calendar');

  const containerRef = useRef(null);
  const selected  = parseDate(value);
  const minD      = parseDate(minDate);
  const maxD      = parseDate(maxDate);
  const marked    = parseDate(markedDate);

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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
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

  function formatDisplay(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const yearRange = (() => {
    const currentYear = new Date().getFullYear();
    const start = minD ? minD.getFullYear() : currentYear - 100;
    const end   = maxD ? maxD.getFullYear() : currentYear + 10;
    const years = [];
    for (let y = start; y <= end; y++) years.push(y);
    return years;
  })();

  const canGoPrev = (() => {
    if (!minD) return true;
    const prev = viewMonth === 0 ? new Date(viewYear - 1, 11, 1) : new Date(viewYear, viewMonth - 1, 1);
    const lastOfPrev = new Date(prev.getFullYear(), prev.getMonth() + 1, 0);
    return lastOfPrev >= startOfDay(minD);
  })();

  const canGoNext = (() => {
    if (!maxD) return true;
    const next = viewMonth === 11 ? new Date(viewYear + 1, 0, 1) : new Date(viewYear, viewMonth + 1, 1);
    return next <= startOfDay(maxD);
  })();

  const cells = getDaysInGrid();

  const inputCls = inputClassName ||
    'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full';

  return (
    <div className="relative" ref={containerRef}>

      <button
        type="button"
        onClick={openPicker}
        className={`flex items-center justify-between gap-2 text-left ${inputCls}`}
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>{selected ? formatDisplay(selected) : placeholder}</span>
        <CalendarDays size={15} className="text-gray-400 shrink-0" />
      </button>

      {open && viewYear !== null && (
        <div className="absolute z-50 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl w-72 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            {mode === 'calendar' ? (
              <button
                type="button"
                onClick={() => setMode('month')}
                className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-primary-700 transition-colors"
              >
                {MONTHS[viewMonth]} {viewYear}
                <ChevronDown size={13} className="text-gray-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('calendar')}
                className="text-sm font-bold text-primary-700 hover:underline"
              >
                Back to calendar
              </button>
            )}

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {mode === 'month' && (
            <div className="p-3 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {MONTHS.map((name, idx) => {
                  const isActive = idx === viewMonth;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setViewMonth(idx); setMode('year'); }}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-primary-700 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'year' && (
            <div className="p-3 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1.5">
                {yearRange.map((yr) => {
                  const isActive = yr === viewYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => { setViewYear(yr); setMode('calendar'); }}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-primary-700 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'calendar' && (
            <div className="p-3">
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((date, i) => {
                  if (!date) return <div key={`e-${i}`} />;

                  const isSelected  = isSameDay(date, selected);
                  const isMarked    = isSameDay(date, marked);
                  const isDisabled  = isDisabledDay(date);
                  const isToday     = isSameDay(date, new Date());

                  return (
                    <button
                      key={toStr(date)}
                      type="button"
                      onClick={() => selectDay(date)}
                      disabled={isDisabled}
                      title={isMarked && markedLabel ? markedLabel : undefined}
                      className={`
                        relative w-full aspect-square flex items-center justify-center text-xs rounded-full transition-colors
                        ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                        ${isSelected ? 'bg-primary-700 text-white font-bold' : ''}
                        ${isMarked && !isSelected ? 'bg-primary-100 text-primary-700 font-bold ring-2 ring-primary-400 ring-offset-1' : ''}
                        ${!isSelected && !isMarked && !isDisabled ? 'hover:bg-gray-100 text-gray-700' : ''}
                        ${isToday && !isSelected && !isMarked ? 'font-bold text-primary-600' : ''}
                      `}
                    >
                      {date.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                      )}
                      {isMarked && !isSelected && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-500 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {(marked || selected) && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-xs">
                  {marked && (
                    <span className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
                      {markedLabel || 'Marked'}: {formatDisplay(marked)}
                    </span>
                  )}
                  {selected && (
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary-700 inline-block" />
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
