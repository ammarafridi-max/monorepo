export default function InputWithIcon({
  icon,
  className = '',
  type = 'text',
  ...props
}) {
  return (
    <div className={`relative w-full ${className}`}>
      {icon && (
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
          <span className="text-base">{icon}</span>
        </div>
      )}
      <input
        type={type}
        className={`w-full bg-white text-sm text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 py-2.5 ${icon ? 'pl-11 pr-4' : 'px-4'}`}
        {...props}
      />
    </div>
  );
}
