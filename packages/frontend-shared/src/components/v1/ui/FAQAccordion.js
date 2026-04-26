'use client';

import { useState } from 'react';
import { HiOutlineMinus, HiOutlinePlus } from 'react-icons/hi';

export default function FAQAccordion({ question, children }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="w-full border-b border-gray-100 py-1.5">
      <button
        onClick={() => setShowAnswer(prev => !prev)}
        className="w-full flex items-center justify-between text-left py-3 px-2 sm:px-4 transition-all duration-200 cursor-pointer group rounded-xl"
      >
        <h3
          className={`text-[16px] sm:text-[18px] font-medium leading-snug transition-colors duration-200 ${showAnswer ? 'text-primary-600' : 'text-gray-800 group-hover:text-primary-500'}`}
        >
          {question}
        </h3>

        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200
                     ${showAnswer ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 bg-white text-gray-500 group-hover:border-primary-400 group-hover:text-primary-500'}`}
        >
          {showAnswer ? (
            <HiOutlineMinus className="text-lg" />
          ) : (
            <HiOutlinePlus className="text-lg" />
          )}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showAnswer ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 sm:px-4 pb-4 text-gray-600 text-[15px] sm:text-[16px] leading-relaxed font-light font-nunito">
          {children}
        </div>
      </div>
    </div>
  );
}
