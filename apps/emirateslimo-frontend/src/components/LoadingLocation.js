'use client';
export default function LoadingLocation() {
  return (
    <div className="flex flex-col h-fit gap-1 px-4 py-1.5 font-light text-[15px] animate-pulse">
      <p className="w-[100%] h-5 bg-gray-200 animate-pulse"></p>
      <p className="w-[40%] h-5 bg-gray-200 animate-pulse"></p>
    </div>
  );
}
