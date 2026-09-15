'use client';
import { useRef, useState } from 'react';
import { FaClock } from 'react-icons/fa6';
import { useOutsideClick } from '@travel-suite/frontend-shared/hooks/general/useOutsideClick';
import { motion, AnimatePresence } from 'framer-motion';
import { TIME_SLOTS, isTooSoon } from '../../lib/pickupTime';

void motion;

export default function SelectTime({
  register,
  label = 'Pickup time',
  placeholder = 'Select time',
  name,
  setValue,
  defaultValue,
  value,
  onChange,
  selectedDate,
  enforceLeadTime = false,
}) {
  const wrapperRef = useRef(null);
  const [internalTime, setInternalTime] = useState(defaultValue ?? '');
  const [showOptions, setShowOptions] = useState(false);
  const inputId = `${name || 'time'}-field`;
  const time = value !== undefined ? value : internalTime;

  useOutsideClick(wrapperRef, () => setShowOptions(false));

  function handleSelect(slot) {
    setInternalTime(slot);
    setValue?.(name, slot);
    onChange?.(slot);
    setShowOptions(false);
  }

  const disabledSlot = (slot) => enforceLeadTime && !!selectedDate && isTooSoon(selectedDate, slot);
  const noneAvailable = enforceLeadTime && !!selectedDate && TIME_SLOTS.every(disabledSlot);

  return (
    <div className="w-full" ref={wrapperRef}>
      {register && <input type="hidden" {...register(name)} />}
      <button
        type="button"
        onClick={() => setShowOptions((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={showOptions}
        className={`w-full flex items-center gap-3 bg-white border rounded-xl px-4 py-2.5 cursor-pointer text-left transition-all duration-300
        ${showOptions ? 'border-gray-700 shadow-sm' : 'border-gray-300 hover:border-gray-500'}`}
      >
        <span className={`text-[18px] ${showOptions || time ? 'text-gray-800' : 'text-gray-500'}`}>
          <FaClock />
        </span>
        <span className="flex flex-col w-full">
          <label
            htmlFor={inputId}
            className={`text-[11.5px] uppercase font-light tracking-wider cursor-pointer ${showOptions ? 'text-primary-900' : 'text-primary-500'}`}
          >
            {label}
          </label>
          <input
            id={inputId}
            readOnly
            tabIndex={-1}
            className="bg-transparent border-0 outline-none w-full text-[15.5px] font-light text-primary-900 placeholder:text-primary-300 cursor-pointer pointer-events-none"
            placeholder={placeholder}
            value={time}
          />
        </span>
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 md:relative md:inset-auto flex items-end md:items-start justify-center bg-black/60 md:bg-transparent z-100"
            onClick={() => setShowOptions(false)}
          >
            <div
              role="listbox"
              aria-label={label}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:absolute md:top-2 md:left-0 md:max-w-[320px] bg-white border border-primary-100 shadow-[0_6px_24px_rgba(0,0,0,0.08)] rounded-t-2xl md:rounded-lg overflow-hidden"
            >
              <p className="px-4 pt-4 pb-2 text-[12px] uppercase tracking-wider font-light text-primary-500">
                {noneAvailable ? 'No times left today, pick another date' : 'Choose a pickup time'}
              </p>
              <div className="max-h-[50dvh] md:max-h-[280px] overflow-y-auto pb-2">
                {TIME_SLOTS.map((slot) => {
                  const disabled = disabledSlot(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="option"
                      aria-selected={time === slot}
                      disabled={disabled}
                      onClick={() => handleSelect(slot)}
                      className={`w-full min-h-11 px-4 text-left text-[15px] font-light transition-colors ${
                        time === slot
                          ? 'bg-primary-200 text-black'
                          : disabled
                            ? 'text-primary-300 cursor-not-allowed'
                            : 'text-primary-800 hover:bg-primary-50'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
