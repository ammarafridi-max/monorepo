"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];
const PERIODS = ["AM", "PM"];

function parse24(str) {
  if (!str) return { hour: "12", minute: "00", period: "PM" };
  const [hStr, mStr] = str.split(":");
  let h = parseInt(hStr, 10);
  const m = String(parseInt(mStr, 10) || 0).padStart(2, "0");
  const snappedM = MINUTES.reduce((prev, cur) =>
    Math.abs(parseInt(cur) - parseInt(m)) <
    Math.abs(parseInt(prev) - parseInt(m))
      ? cur
      : prev,
  );
  const period = h < 12 ? "AM" : "PM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: String(h), minute: snappedM, period };
}

function to24(hour, minute, period) {
  let h = parseInt(hour, 10);
  if (period === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function format24(str) {
  if (!str) return "";
  const { hour, minute, period } = parse24(str);
  return `${hour}:${minute} ${period}`;
}

function Column({ items, selected, onSelect, itemRef }) {
  return (
    <ul className="flex h-36 flex-col overflow-y-auto py-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isActive = item === selected;
        return (
          <li key={item}>
            <button
              type="button"
              ref={isActive ? itemRef : null}
              onClick={() => onSelect(item)}
              className={[
                "w-full rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
                isActive
                  ? "bg-clay-100 font-semibold text-clay-700"
                  : "text-ink-soft hover:bg-sand-100 hover:text-ink",
              ].join(" ")}
            >
              {item}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  inputClassName,
}) {
  const parsed = parse24(value);
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  const containerRef = useRef(null);
  const activeHourRef = useRef(null);
  const activeMinuteRef = useRef(null);
  const activePeriodRef = useRef(null);

  useEffect(() => {
    const p = parse24(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const scroll = (ref) =>
      ref.current?.scrollIntoView({ block: "center", behavior: "instant" });
    const id = setTimeout(() => {
      scroll(activeHourRef);
      scroll(activeMinuteRef);
      scroll(activePeriodRef);
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function confirm() {
    onChange(to24(hour, minute, period));
    setOpen(false);
  }

  const triggerCls =
    inputClassName ||
    "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-[15px] text-ink focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 transition-colors";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 text-left ${triggerCls} ${!value ? "text-ink-mute" : ""}`}
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>
          {value ? format24(value) : placeholder}
        </span>
        <Clock size={15} className="shrink-0 text-ink-mute" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-warm">
          <div className="border-b border-sand-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
              Select time
            </p>
          </div>

          <div className="flex divide-x divide-sand-100">
            <div className="flex-1">
              <p className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
                Hour
              </p>
              <Column
                items={HOURS}
                selected={hour}
                onSelect={setHour}
                itemRef={activeHourRef}
              />
            </div>

            <div className="flex-1">
              <p className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
                Min
              </p>
              <Column
                items={MINUTES}
                selected={minute}
                onSelect={setMinute}
                itemRef={activeMinuteRef}
              />
            </div>

            <div className="w-16">
              <p className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
                &nbsp;
              </p>
              <Column
                items={PERIODS}
                selected={period}
                onSelect={setPeriod}
                itemRef={activePeriodRef}
              />
            </div>
          </div>

          <div className="border-t border-sand-100 p-3">
            <button
              type="button"
              onClick={confirm}
              className="w-full rounded-xl bg-clay-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-700"
            >
              Confirm — {hour}:{minute} {period}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
