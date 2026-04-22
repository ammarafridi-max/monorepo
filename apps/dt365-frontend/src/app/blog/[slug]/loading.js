export default function BlogPostLoading() {
  return (
    <div className="py-20 px-4 animate-pulse">
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-15 lg:grid-cols-[7fr_3fr]">
        <div>
          {/* Cover image skeleton */}
          <div className="mb-10 aspect-16/9 rounded-3xl bg-gray-100" />
          {/* Breadcrumb */}
          <div className="mb-3 h-3 w-48 rounded-full bg-gray-100" />
          {/* Title */}
          <div className="mb-2 h-8 w-3/4 rounded-xl bg-gray-100" />
          <div className="mb-8 h-6 w-1/2 rounded-xl bg-gray-100" />
          {/* Body lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-3 h-4 rounded-full bg-gray-100" style={{ width: i % 3 === 2 ? '70%' : '100%' }} />
          ))}
        </div>
        {/* Sidebar skeleton */}
        <div className="hidden lg:block space-y-4">
          <div className="h-5 w-3/4 rounded-lg bg-gray-100" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded-full bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
