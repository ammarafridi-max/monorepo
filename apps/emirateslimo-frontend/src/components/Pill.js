const VARIANT_CLASSES = {
  success: 'bg-green-500/15 text-green-800',
  danger: 'bg-red-500/15 text-red-800',
  warning: 'bg-orange-100 text-orange-800',
  neutral: 'bg-gray-100 text-gray-800',
};

export default function Pill({
  children,
  variant = 'neutral',
  className = '',
}) {
  const variantClasses = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-center text-[12px] font-bold ${variantClasses} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
