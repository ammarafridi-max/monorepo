'use client';
import { useRef, useState } from 'react';
import { useOutsideClick } from '../hooks/general/useOutsideClick';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatToDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Calendar({ onDateClick, isDateDisabled, setShowCalendar }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const componentRef = useRef(null);

  const handleMonthChange = (delta) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  useOutsideClick(componentRef, () => setShowCalendar(false));

  const renderHeader = () => (
    <div className="flex justify-between items-center gap-3 w-full p-4 bg-black font-medium font-nunito text-sm sm:text-base">
      <p className="flex-1 text-left text-lg lg:text-[16px] text-white font-normal">
        {currentDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <ChevronLeft
        size={28}
        className="cursor-pointer duration-300 text-gray-400 hover:text-white"
        onClick={() => handleMonthChange(-1)}
      />
      <ChevronRight
        size={28}
        className="cursor-pointer duration-300 text-gray-400 hover:text-white"
        onClick={() => handleMonthChange(1)}
      />
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="flex w-full py-2 bg-gray-100 text-[12px] font-normal mb-0">
        {days.map((day) => (
          <div key={day} className="flex-1 text-center">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
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
        const isDisabled =
          (isDateDisabled && isDateDisabled(dayClone)) || dayClone.getMonth() !== currentDate.getMonth();
        const isOutOfMonth = dayClone.getMonth() !== currentDate.getMonth();

        days.push(
          <div
            key={formattedDate}
            onClick={() => !isDisabled && onDateClick(formattedDate)}
            className="flex-1 min-h-[40px] flex items-center justify-center text-sm sm:text-xs transition m-1"
          >
            <span
              className={`flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 rounded-full  transition
                ${isDisabled || isOutOfMonth ? 'text-gray-300 bg-white cursor-not-allowed' : 'bg-gray-100 border-gray-300 hover:bg-primary-900 hover:text-white hover:border-primary-500 cursor-pointer'}
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
      className="fixed inset-0 lg:absolute lg:top-3 lg:inset-auto z-[1000] bg-black/50 lg:bg-transparent flex items-center justify-center font-nunito"
      onClick={() => setShowCalendar(false)}
    >
      <div
        className="w-[85%] lg:min-w-[380px] bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
}
