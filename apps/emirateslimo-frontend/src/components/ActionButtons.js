'use client';

import { useRef, useState } from 'react';
import { useOutsideClick } from '@travel-suite/frontend-shared/hooks/general/useOutsideClick';
import { ChevronDown } from 'lucide-react';
import Button from '@/components/Button';

export default function ActionButtons({ actions = [] }) {
  const [showOptions, setShowOptions] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setShowOptions(false));
  return (
    <div className="relative" ref={ref}>
      <Button
        className="flex items-center gap-2 justify-between"
        onClick={() => setShowOptions((val) => !val)}
      >
        <span>Actions</span>
        <span>
          <ChevronDown size={16} />
        </span>
      </Button>
      {showOptions && (
        <div className="absolute top-10 right-0 w-50 flex flex-col bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {actions.map((action, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2 py-2 px-3 text-[13px] font-light text-left cursor-pointer hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
              type="button"
              onClick={() => {
                setShowOptions(false);
                action.onClick();
              }}
              disabled={action.disabled}
            >
              <action.icon size={13} />
              {action.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
