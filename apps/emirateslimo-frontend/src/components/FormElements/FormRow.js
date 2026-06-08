export default function FormRow({ children }) {
  return (
    <div className="grid grid-cols-[2fr_4fr_4fr] gap-5 items-center mb-3.75">
      {children}
    </div>
  );
}
