import Link from 'next/link';
import { format } from 'date-fns';
import { DotIcon } from 'lucide-react';

export default function BlogCard({ slug, category, title, excerpt, author, date, readTime, coverImageUrl, tags = [] }) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group bg-white rounded-3xl overflow-hidden cursor-pointer duration-300 shadow-[0_14px_35px_rgba(16,24,40,0.08)] border border-gray-100 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,24,40,0.14)]"
    >
      <div className="aspect-video bg-gray-100 overflow-hidden">
        <img
          src={coverImageUrl}
          className="h-full w-full object-cover object-center duration-500 group-hover:scale-105"
          loading="lazy"
          alt={title ? title : 'Blog post'}
        />
      </div>
      <div className="py-6 px-5">
        <div className="flex items-center font-outfit font-light text-[12px] text-gray-500">
          <span>{date ? format(new Date(date), 'dd MMM yyyy') : ''}</span>
          <DotIcon />
          <span>{readTime} mins</span>
        </div>
        <h3 className="font-outfit font-medium mt-1 mb-2 leading-6 text-md line-clamp-2 text-gray-900">
          {title}
        </h3>
        <p className="font-outfit font-light text-sm text-gray-600 line-clamp-3">{excerpt}</p>
      </div>
    </Link>
  );
}
