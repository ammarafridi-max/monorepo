import { forwardRef } from 'react';

const Select = forwardRef(function Select({ children, className = '', ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
