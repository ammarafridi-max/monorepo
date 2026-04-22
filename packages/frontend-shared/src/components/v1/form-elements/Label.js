export default function Label({ children, htmlFor, optional, required, className }) {
  return (
    <label
      className={`text-[14px] md:text-[14px] font-normal text-black/80 capitalize ${className}`}
      htmlFor={htmlFor}
    >
      {children}
      {optional && <span className="ml-0.75 text-gray-400 font-normal">(Optional)</span>}
      {required && <span className="ml-0.75 text-red-600 font-normal">*</span>}
    </label>
  );
}
