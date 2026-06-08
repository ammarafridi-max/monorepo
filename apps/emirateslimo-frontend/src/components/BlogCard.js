import { format } from 'date-fns';
import Link from 'next/link';

export default function BlogCard({ blog }) {
  const { coverImageUrl, title, excerpt, createdAt, readingTime, slug } = blog;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-400 hover:border-accent-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
    >
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
        <img
          src={coverImageUrl}
          className="h-full w-full object-cover object-center transition-transform duration-600 group-hover:scale-105"
          loading="lazy"
          alt={title || 'Blog post'}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-light text-gray-400 tracking-wide">
            {format(new Date(createdAt), 'dd MMM yyyy')}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
          <span className="text-[11px] font-light text-gray-400 tracking-wide">{readingTime} min read</span>
        </div>

        <h3 className="text-[16px] font-light leading-snug text-primary-900 mb-2 line-clamp-2 group-hover:text-accent-600 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-[13.5px] font-light text-gray-500 line-clamp-2 leading-relaxed mb-4">{excerpt}</p>

        <div className="flex items-center gap-1.5 text-[12.5px] font-light text-accent-600 tracking-wide">
          <span>Read article</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}
