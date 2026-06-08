'use client';
import React from 'react';
import { Controller } from 'react-hook-form';

const CheckboxGroup = ({
  name,
  control,
  options = [], // array of { value: string, label: string }
  className = '',
  disabled = false,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field }) => {
        const { value: selectedValues = [], onChange } = field;

        const handleToggle = (optionValue) => {
          if (selectedValues.includes(optionValue)) {
            // remove
            onChange(selectedValues.filter((v) => v !== optionValue));
          } else {
            // add
            onChange([...selectedValues, optionValue]);
          }
        };

        return (
          <div className={`checkbox-group flex gap-10 ${className}`}>
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`checkbox-option flex items-center space-x-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selectedValues.includes(opt.value)}
                  disabled={disabled}
                  onChange={() => handleToggle(opt.value)}
                />
                <span className="text-[14px] font-light">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }}
    />
  );
};

export default CheckboxGroup;
