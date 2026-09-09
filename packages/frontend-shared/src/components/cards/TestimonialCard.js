export default function TestimonialCard({ quote, name, location, stars, plan }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 md:p-7 transition-colors duration-200 hover:border-primary-300">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={i < stars ? 'text-amber-400' : 'text-gray-200'}
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="sr-only">{stars} out of 5 stars</span>
        </div>
        {plan && (
          <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700">
            {plan}
          </span>
        )}
      </div>

      <blockquote className="flex-1 text-[16px] font-light leading-7 text-gray-700">
        {quote}
      </blockquote>

      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[12px] font-semibold text-primary-700">
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-gray-900">
            {name}
          </p>
          <p className="truncate text-[13px] text-gray-500">{location}</p>
        </div>
      </div>
    </div>
  );
}
