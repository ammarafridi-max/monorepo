import Link from 'next/link';

export default function ServiceCard({ href, image, title, text }) {
  return (
    <Link href={href} className="group block min-w-[18rem] lg:min-w-0">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 transition-all duration-500 hover:border-gray-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-[18px] font-light text-white tracking-wide leading-snug">{title}</h3>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-[13.5px] font-light leading-relaxed text-gray-500 flex-1 line-clamp-2">{text}</p>
          <span className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-primary-900 text-sm transition-all duration-300 group-hover:bg-primary-900 group-hover:text-white">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
