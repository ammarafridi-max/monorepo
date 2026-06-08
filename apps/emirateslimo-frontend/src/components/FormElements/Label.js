import { FaCircleInfo } from 'react-icons/fa6';
import { Tooltip } from 'react-tooltip';

export default function Label({ children, className, htmlFor, required, optional, tooltip }) {
  return (
    <label htmlFor={htmlFor} className={`text-[14px] font-light text-gray-700 flex items-center gap-1 ${className}`}>
      <span>{children}</span>

      {optional && <span className="text-primary-500 text-[12px] tracking-wide">(optional)</span>}

      {required && <span className="text-red-500 font-semibold">*</span>}

      {tooltip && (
        <>
          <FaCircleInfo
            size={14}
            className="text-gray-400 hover:text-primary-500 cursor-pointer transition"
            data-tooltip-id={`tooltip-${htmlFor}`}
            data-tooltip-content={tooltip}
          />

          <Tooltip
            id={`tooltip-${htmlFor}`}
            place="top"
            className="text-[13px] max-w-[200px] whitespace-normal leading-snug"
          />
        </>
      )}
    </label>
  );
}
