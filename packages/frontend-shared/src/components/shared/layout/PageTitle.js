export default function PageTitle({ children, className }) {
  return (
    <h1
      className={`text-black text-[26px] md:text-[36px] capitalize font-medium font-outfit leading-8 md:leading-12 ${className}`}
    >
      {children}
    </h1>
  );
}
