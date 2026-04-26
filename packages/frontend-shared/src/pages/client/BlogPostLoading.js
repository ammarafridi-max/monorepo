export default function BlogPostLoading() {
  return (
    <div className="animate-pulse px-4 py-20">
      <div className="mx-auto max-w-6xl grid grid-cols-1 gap-15 lg:grid-cols-[7fr_3fr]">
        <div>
          <div className="mb-10 aspect-video rounded-3xl bg-gray-100" />

          <div className="mb-3 h-3 w-48 rounded-full bg-gray-100" />
          <div className="mb-2 h-8 w-3/4 rounded-xl bg-gray-100" />
          <div className="mb-8 h-6 w-1/2 rounded-xl bg-gray-100" />

          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="mb-3 h-4 rounded-full bg-gray-100"
              style={{ width: i % 3 === 2 ? '70%' : '100%' }}
            />
          ))}
        </div>
        <div className="hidden space-y-4 lg:block">
          <div className="h-5 w-3/4 rounded-lg bg-gray-100" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded-full bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
