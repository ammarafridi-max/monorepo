const SIZE_CLASSES = {
  large: 'text-[15px] lg:text-[16px] py-2.5 px-6',
  medium: 'text-[14px] lg:text-[15px] py-2.5 px-5',
  small: 'text-[13px] lg:text-[14px] py-2 px-4',
};

const VARIANT_CLASSES = {
  primary:
    'text-white bg-accent-500 border-accent-500 hover:bg-accent-600 hover:border-accent-600 active:scale-[0.98]',
  secondary:
    'text-white bg-primary-900 border-primary-900 hover:bg-primary-600 hover:border-primary-600 active:scale-[0.98]',
  success:
    'text-white bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 active:scale-[0.98]',
  danger:
    'text-white bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 active:scale-[0.98]',
  outline:
    'text-accent-500 bg-transparent border-accent-500 hover:bg-accent-600 hover:text-white hover:border-accent-600 active:scale-[0.98]',
  text: 'text-primary-500 bg-transparent border-transparent hover:text-primary-700',
};

export default function Button({
  children,
  className = '',
  size = 'medium',
  variant = 'primary',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center text-center font-outfit font-normal rounded-xl capitalize border border-solid cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:opacity-60 disabled:cursor-not-allowed';

  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.medium;
  const variantClasses = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

  return (
    <button className={`${base} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
