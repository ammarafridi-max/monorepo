export default function PrimaryButton({
  children,
  className = '',
  size = 'small',
  colorType = 'primary',
  ...props
}) {
  let newClassName = className;

  const baseClassName =
    'inline-flex items-center justify-center gap-2 text-center no-underline font-outfit rounded-lg border border-solid cursor-pointer transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed';

  const colorClassName =
    colorType === 'danger'
      ? 'text-white border-red-600 bg-red-600 hover:bg-red-700'
      : colorType === 'neutral'
        ? 'text-gray-800 border-gray-300 bg-white hover:bg-gray-100'
        : 'text-white border-accent-500 bg-accent-500 hover:bg-accent-600';

  if (size === 'large') {
    newClassName = `${newClassName} ${baseClassName} ${colorClassName} text-sm md:text-base font-normal py-2.5 px-4`;
  } else if (size === 'small') {
    newClassName = `${newClassName} ${baseClassName} ${colorClassName} text-xs md:text-sm font-normal py-2 px-3`;
  } else {
    newClassName = `${newClassName} ${baseClassName} ${colorClassName} text-xs md:text-sm font-normal py-2 px-3.5`;
  }

  return (
    <button className={newClassName} {...props}>
      {children}
    </button>
  );
}
