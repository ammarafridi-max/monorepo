'use client';
import { useRef, useState } from 'react';
import { FaClock } from 'react-icons/fa6';
import { useOutsideClick } from '../../hooks/general/useOutsideClick';
import { motion, AnimatePresence } from 'framer-motion';

void motion;

export default function SelectTime({
  register,
  label = 'Pickup time',
  placeholder = 'Select time',
  name,
  setValue,
  defaultValue,
}) {
  const wrapperRef = useRef(null);
  const [time, setTime] = useState(defaultValue || '');
  const [showOptions, setShowOptions] = useState(false);
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('AM');

  useOutsideClick(wrapperRef, () => setShowOptions(false));

  function handleTimeSelect(h, m, p) {
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
    setTime(formatted);
    setValue && setValue(name, formatted);
    setShowOptions(false);
  }

  return (
    <div className="w-full" ref={wrapperRef}>
      <input type="hidden" {...register(name)} />
      <div
        onClick={() => setShowOptions(true)}
        className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-300 
        ${showOptions ? 'border-gray-700 shadow-sm' : 'border-gray-300 hover:border-gray-500'}`}
      >
        <span
          className={`text-[18px] ${showOptions ? 'text-gray-800' : 'text-gray-500'} ${time ? 'text-gray-800' : ''}`}
        >
          <FaClock />
        </span>
        <div className="flex flex-col w-full">
          <label
            className={`text-[11.5px] uppercase font-light tracking-wider cursor-pointer ${showOptions ? 'text-primary-900' : 'text-primary-500'}`}
          >
            {label}
          </label>
          <input
            readOnly
            className="bg-transparent border-0 outline-none w-full text-[15.5px] font-light text-primary-900 placeholder:text-primary-300 cursor-pointer"
            placeholder={placeholder}
            value={time}
          />
        </div>
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 md:relative w-dvw h-dvh md:w-auto md:h-auto flex items-center justify-center bg-black/70 z-100"
          >
            <div className="absolute top-auto md:top-2 bg-white border border-primary-100 shadow-[0_6px_24px_rgba(0,0,0,0.08)] rounded-lg w-full max-w-[380px] z-50 overflow-hidden p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[13px] font-light text-primary-500 mb-1 uppercase">Hour</p>
                  <div className="h-[200px] overflow-y-auto rounded-md border border-primary-50">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <p
                        key={h}
                        onClick={() => setHour(h)}
                        className={`py-1.5 text-[15px] cursor-pointer font-light transition-colors duration-150 ${
                          hour === h ? 'bg-primary-200 text-black' : 'hover:bg-primary-50 text-primary-800'
                        }`}
                      >
                        {h}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-light text-primary-500 mb-1 uppercase">Minute</p>
                  <div className="h-[200px] overflow-y-auto rounded-md border border-primary-50">
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                      <p
                        key={m}
                        onClick={() => setMinute(m)}
                        className={`py-1.5 text-[15px] cursor-pointer font-light transition-colors duration-150 ${
                          minute === m ? 'bg-primary-200 text-black' : 'hover:bg-primary-50 text-primary-800'
                        }`}
                      >
                        {String(m).padStart(2, '0')}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-light text-primary-500 mb-1 uppercase">AM / PM</p>
                  <div className="h-[200px] overflow-y-auto rounded-md border border-primary-50">
                    {['AM', 'PM'].map((p) => (
                      <p
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`py-1.5 text-[15px] cursor-pointer font-light transition-colors duration-150 ${
                          period === p ? 'bg-primary-200 text-black' : 'hover:bg-primary-50 text-primary-800'
                        }`}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              {hour && minute !== '' && (
                <button
                  type="button"
                  onClick={() => handleTimeSelect(hour, minute, period)}
                  className="w-full mt-4 py-2 rounded-md bg-accent-500 text-white text-[14px] font-light hover:bg-accent-600 transition-colors cursor-pointer"
                >
                  Set Time
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
