import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[14px] font-light outline-0 ${className}`}
      {...props}
    />
  );
});

export default Textarea;
