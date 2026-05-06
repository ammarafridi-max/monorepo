import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { className = '', type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      {...props}
      className={`w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 ${className}`}
    />
  );
});

export default Input;
