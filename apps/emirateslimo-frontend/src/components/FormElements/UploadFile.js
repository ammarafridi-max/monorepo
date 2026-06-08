'use client';

import { forwardRef } from 'react';

const UploadFile = forwardRef(function UploadFile(props, ref) {
  return (
    <input
      type="file"
      ref={ref}
      {...props}
      className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50"
    />
  );
});

export default UploadFile;
