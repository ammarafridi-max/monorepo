export default function FlightSkeleton() {
  return (
    <div className="w-full p-5 bg-white rounded-[10px] shadow-[0_0_10px_2px_rgba(240,240,240,1)] flex flex-col gap-2.5 mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-[60px] h-[60px] rounded-full bg-gray-300 animate-pulse" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 w-1/2 rounded bg-gray-300 animate-pulse" />
          <div className="h-3 w-full rounded bg-gray-300 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="w-full h-4 bg-gray-300 rounded animate-pulse" />
        <div className="w-full h-4 bg-gray-300 rounded animate-pulse" />
      </div>

      <div className="flex items-center gap-2.5 mt-2">
        <div className="w-1/3 h-5 bg-gray-300 rounded animate-pulse" />
        <div className="w-[100px] h-9 bg-gray-300 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
