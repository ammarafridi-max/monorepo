export default function TestimonialCard({ quote, name, location, stars = 5, plan }) {
  return (
    <div className="relative min-w-[85%] snap-center md:min-w-auto group bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out p-6 md:p-7 w-full max-w-md mx-auto font-outfit">
      <div className="absolute top-4 right-5 text-primary-100 text-5xl select-none font-serif leading-none">
        "
      </div>

      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={i < stars ? 'text-amber-400' : 'text-gray-200'}
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      <p className="text-[15px] text-gray-700 leading-relaxed font-light py-3">
        {quote}
      </p>

      <div className="flex items-center gap-3 pt-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0 border border-primary-200">
          {name.split(' ').map((n) => n[0]).join('')}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-[15px]">{name}</p>
          {location && <p className="font-light text-[13px] text-gray-500">{location}</p>}
        </div>
        {plan && (
          <span className="ml-auto text-xs font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
            {plan}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-linear-to-r from-primary-300 to-primary-500 rounded-b-2xl opacity-60 transition-opacity duration-300" />
    </div>
  );
}
