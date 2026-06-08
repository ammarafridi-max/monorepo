'use client';
import { useState, useRef, useEffect } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

export default function FAQAccordion({ question, children }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (open) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [open]);

  return (
    <div
      className={`w-full bg-white border rounded-2xl px-6 py-5 transition-all duration-300 cursor-pointer ${
        open ? 'border-accent-300/60 shadow-sm' : 'border-gray-100 hover:border-gray-200'
      }`}
      onClick={() => setOpen((prev) => !prev)}
    >
      <button className="w-full flex justify-between items-center text-left gap-4 cursor-pointer">
        <h3
          className={`text-[15px] lg:text-[16px] font-light leading-snug transition-colors duration-300 ${
            open ? 'text-primary-900' : 'text-gray-800'
          }`}
        >
          {question}
        </h3>

        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
            open
              ? 'bg-accent-500 border-accent-500 text-white rotate-45'
              : 'border-gray-200 text-gray-400 hover:border-accent-300 hover:text-accent-500'
          }`}
        >
          <HiOutlinePlus className="text-base" />
        </span>
      </button>

      <div style={{ height }} className="overflow-hidden transition-all duration-500 ease-in-out">
        <div ref={contentRef} className="pt-4 pb-1 text-gray-500 text-[14.5px] lg:text-[15px] leading-[1.85] font-light">
          {children}
        </div>
      </div>
    </div>
  );
}
