export default function PrimaryButtonOutline({
  children,
  className = '',
  size = 'small',
  selected,
  ...props
}) {
  let newClassName =
    className +
    ' inline-flex items-center justify-center gap-2 text-center no-underline font-outfit rounded-lg border border-solid border-accent-500 cursor-pointer transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed';

  if (size === 'large') {
    newClassName = newClassName + ` text-sm md:text-base py-2.5 px-4 `;
  } else if (size === 'small') {
    newClassName = newClassName + ` text-xs md:text-sm py-1.5 px-3`;
  } else {
    newClassName = newClassName + ` text-xs md:text-sm py-2 px-3.5`;
  }

  if (selected) {
    newClassName = newClassName + ` bg-accent-500 text-white`;
  } else {
    newClassName = newClassName + ` bg-white text-accent-600 hover:bg-accent-50`;
  }

  return (
    <button className={newClassName} {...props}>
      {children}
    </button>
  );
}
