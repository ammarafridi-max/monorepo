export default function Container({ children, className }) {
  return <div className={`w-[92%] md:w-[85%] lg:w-[80%] mx-auto ${className}`}>{children}</div>;
}
