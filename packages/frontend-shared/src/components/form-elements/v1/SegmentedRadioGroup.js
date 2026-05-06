'use client';

import { LucideCheckCircle2 } from 'lucide-react';
import { formatAmount } from '../../../utils/currency';

function SegmentedRadioGroup({ name, value, options, onChange, textAlign = 'left', currencyCode = 'AED' }) {
  return (
    <div className="block lg:flex rounded-lg overflow-hidden border border-gray-300 divide-x divide-gray-200">
      {options.map((option, index) => {
        const isSelected = value === option.value;

        return (
          <label
            key={index}
            className={`relative flex flex-1 cursor-pointer transition-colors duration-200
                ${
                  isSelected
                    ? 'bg-primary-100'
                    : 'bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option)}
              className="absolute opacity-0"
            />

            <div
              className={`w-full h-full p-3 lg:p-2.5 flex items-center justify-between text-${textAlign} gap-1 text-[15px] font-light border-2 border-transparent`}
            >
              <div>
                <span>{option.label}</span>

                {option.price !== undefined && (
                  <>
                    <span> - </span>
                    <span className={`text-sm`}>
                      {currencyCode} {formatAmount(option.price)} / person
                    </span>
                  </>
                )}
              </div>
              <div>{isSelected && <LucideCheckCircle2 className="ml-1 text-primary-500" />}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default SegmentedRadioGroup;
