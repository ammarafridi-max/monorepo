'use client';
import { useRef, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';

export default function SelectCustom({ className = '', value, setValue, children, ...props }) {
  const inputRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      <div
        className={`grid grid-cols-[1fr_auto] relative bg-white rounded-sm w-full py-2 pl-5 pr-2 text-[14px] border border-gray-300 outline-0 disabled:bg-gray-100 ${className}`}
      >
        <input
          onChange={(e) => setValue(e.target.value)}
          onClick={() => setShowOptions((currentValue) => !currentValue)}
          value={value}
          ref={inputRef} // 👈 forward the ref so RHF can control it
          className="outline-0"
          {...props}
        />
        {value && (
          <button
            type="button"
            className="text-gray-500 text-end cursor-pointer"
            onClick={() => {
              setValue('');
              inputRef.current.focus();
            }}
          >
            <FaXmark className="text-[18px]" />
          </button>
        )}
      </div>
      {showOptions && (
        <div className="min-h-fit max-h-[300px] overflow-scroll bg-white rounded-sm border-1 border-gray-200">
          {children}
        </div>
      )}
    </>
  );
}
