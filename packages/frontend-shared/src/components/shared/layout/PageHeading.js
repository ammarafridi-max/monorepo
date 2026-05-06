export default function PageHeading({ children, className = '', mb = 'mb-5' }) {
  return (
    <div className={mb}>
      <h1
        className={`font-semibold tracking-tight text-[30px] text-gray-900 leading-tight ${className}`}
      >
        {children}
      </h1>
      <div className="mt-2 h-[3px] w-14 rounded-full bg-linear-to-r from-primary-600 to-accent-500" />
    </div>
  );
}
