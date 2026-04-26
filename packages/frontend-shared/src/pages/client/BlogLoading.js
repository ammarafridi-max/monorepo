export default function BlogLoading() {
  return (
    <div className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Hero skeleton */}
        <div className="mb-14">
          <div className="mb-5 h-4 w-32 rounded-full bg-gray-100" />
          <div className="mb-4 h-10 w-2/3 rounded-xl bg-gray-100" />
          <div className="h-6 w-1/2 rounded-xl bg-gray-100" />
        </div>
        {/* Grid skeleton */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="aspect-video bg-gray-100" />
              <div className="space-y-3 px-5 py-6">
                <div className="h-3 w-24 rounded-full bg-gray-100" />
                <div className="h-5 w-full rounded-lg bg-gray-100" />
                <div className="h-4 w-4/5 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
