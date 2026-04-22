import { forwardRef } from 'react';

const TextArea = forwardRef(function TextArea({ className = '', rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
});

export default TextArea;
