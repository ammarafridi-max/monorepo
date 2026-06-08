import { forwardRef } from 'react';
import Label from './Label';

const Input = forwardRef(function Input({ className = '', label, optional, required, tooltip, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <Label required={required} optional={optional} tooltip={tooltip}>
          {label}
        </Label>
      )}
      <input
        ref={ref}
        className={`w-full bg-transparent text-[14px] font-light px-3 lg:px-3 py-2 rounded-md border border-gray-300 focus:border-primary-900 outline-0 ${className}`}
        required={required}
        {...props}
      />
    </div>
  );
});

export default Input;
