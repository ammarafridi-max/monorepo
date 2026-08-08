import { Quote } from "lucide-react";

export default function TestimonialCard({ quote, name, location, stars, plan }) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mb-5">
        <Quote size={16} className="text-primary-600 fill-primary-200" />
      </div>

      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={i < stars ? "text-amber-400" : "text-gray-200"}
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      <p className="text-gray-600 text-sm leading-relaxed flex-1">"{quote}"</p>

      <div className="border-t border-gray-100 mt-6 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">{location}</p>
          </div>
        </div>
        {plan && (
          <span className="text-xs font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
            {plan}
          </span>
        )}
      </div>
    </div>
  );
}
