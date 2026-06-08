'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useGetBookings } from '../../hooks/limo-bookings/useGetBookings';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function dateKeyOf(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function customerName(b) {
  const bd = b.bookingDetails || {};
  return `${bd.firstName || ''} ${bd.lastName || ''}`.trim() || b.bookingRef || 'Booking';
}

export default function AdminLimoBookingsCalendarPage() {
  const { bookings = [], isLoadingBookings } = useGetBookings({ page: 1, limit: 200 });

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getCalendarDays(year, month);

  const bookingsByDate = useMemo(() => {
    return (bookings || []).reduce((acc, b) => {
      const key = dateKeyOf(b.pickupDate);
      if (!key) return acc;
      (acc[key] = acc[key] || []).push(b);
      return acc;
    }, {});
  }, [bookings]);

  const selectedBookings = selectedDate ? bookingsByDate[selectedDate] || [] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/bookings"
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"
          title="Back"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Bookings Calendar</h2>
          <p className="text-sm text-gray-400 mt-0.5">Grouped by pickup date</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">
            {currentDate.toLocaleString('en-GB', { month: 'long' })} {year}
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {isLoadingBookings ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-7 gap-2 mb-2">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d}
                  className="text-[11px] font-bold text-gray-400 uppercase tracking-wide text-center"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2 auto-rows-auto md:auto-rows-[110px]">
              {days.map((day, index) => {
                if (!day) return <div key={index} className="hidden md:block" />;

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  day,
                ).padStart(2, '0')}`;
                const dayBookings = bookingsByDate[dateKey] || [];
                const isToday = dateKey === dateKeyOf(today.toISOString());

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => dayBookings.length && setSelectedDate(dateKey)}
                    className={`text-left rounded-xl p-2.5 flex flex-col transition ${
                      dayBookings.length
                        ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                        : 'bg-white border border-gray-100 cursor-default'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'bg-primary-700 text-white w-5 h-5 rounded-full flex items-center justify-center'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>
                      {dayBookings.length > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayBookings.slice(0, 2).map((b) => (
                        <span
                          key={b._id || b.id}
                          className="text-[10px] bg-primary-700 text-white rounded px-1.5 py-0.5 truncate"
                        >
                          {customerName(b)}
                        </span>
                      ))}
                      {dayBookings.length > 2 && (
                        <span className="text-[10px] text-gray-400">
                          +{dayBookings.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-lg w-full md:max-w-lg p-5 max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">
                Bookings on{' '}
                {new Date(selectedDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {selectedBookings.map((b) => (
                <Link
                  key={b._id || b.id}
                  href={`/admin/bookings/${b._id || b.id}`}
                  className="block bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition"
                >
                  <p className="text-sm font-bold text-gray-900">{customerName(b)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.pickup?.zone?.name || b.pickup?.name || '—'}
                    {b.dropoff?.zone?.name || b.dropoff?.name
                      ? ` → ${b.dropoff?.zone?.name || b.dropoff?.name}`
                      : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {b.pickupTime ? `${b.pickupTime} • ` : ''}
                    {b.vehicle?.brand} {b.vehicle?.model}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
