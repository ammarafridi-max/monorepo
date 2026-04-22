'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getYearsRange = (start = 2000, end = new Date().getFullYear() + 5) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const formatToDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Calendar({
  onDateClick,
  isDateDisabled,
  setShowCalendar,
  minYear = 2000,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const componentRef = useRef(null);

  const handleMonthChange = (delta) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(1); // 🔥 prevent overflow
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  useOutsideClick(componentRef, () => setShowCalendar(false));

  const renderHeader = () => {
    const years = getYearsRange(minYear, new Date().getFullYear() + 10);

    return (
      <div className="flex items-center justify-between w-full px-4 py-3 border-b border-gray-100 bg-white">
        {/* Month + Year */}
        <div className="flex items-center gap-2">
          <select
            value={currentDate.getMonth()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(Number(e.target.value));
              setCurrentDate(newDate);
            }}
            className="rounded-md border border-gray-200 px-2 py-1.5 text-gray-800 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={currentDate.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(Number(e.target.value));
              setCurrentDate(newDate);
            }}
            className="rounded-md border border-gray-200 px-2 py-1.5 text-gray-800 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleMonthChange(-1)}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={() => handleMonthChange(1)}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-gray-50 transition"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="flex w-full py-2 bg-gray-50 text-[14px] lg:text-[13px] font-normal mb-0">
        {days.map((day) => (
          <div key={day} className="flex-1 text-center">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const rows = [];
    let days = [];
    let day = new Date(startDate);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayClone = new Date(day);
        const formattedDate = formatToDateString(dayClone);
        const isDisabled = isDateDisabled && isDateDisabled(dayClone);
        const isOutOfMonth = dayClone.getMonth() !== currentDate.getMonth();

        days.push(
          <div
            key={formattedDate}
            onClick={() => !isDisabled && onDateClick(formattedDate)}
            className="flex-1 min-h-[40px] flex items-center justify-center text-sm sm:text-xs transition m-1"
          >
            <span
              className={`flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-full  transition
                ${isDisabled || isOutOfMonth ? 'text-gray-300 bg-white cursor-not-allowed' : 'bg-transparent border border-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 cursor-pointer'}
                 `}
            >
              {dayClone.getDate()}
            </span>
          </div>,
        );
        day.setDate(day.getDate() + 1);
      }

      rows.push(
        <div key={day.toISOString()} className="flex w-full">
          {days}
        </div>,
      );
      days = [];
    }

    return <div className="flex flex-col w-full">{rows}</div>;
  };

  return (
    <div
      className="fixed inset-0 z-1000 bg-black/60 flex items-center justify-center px-4 font-nunito"
      onClick={() => setShowCalendar(false)}
    >
      <div
        className="w-full max-w-[370px] sm:max-w-[350px] bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
}
