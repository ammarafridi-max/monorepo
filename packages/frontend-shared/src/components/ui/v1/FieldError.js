export default function FieldError({ children }) {
  return (
    <div className="w-full rounded-sm my-1.25 text-[14px] text-red-700">
      {children}
    </div>
  );
}
