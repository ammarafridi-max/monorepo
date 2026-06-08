export default function PageHeading({ children, className = '' }) {
  return <h1 className={`font-normal text-3xl ${className}`}>{children}</h1>;
}
