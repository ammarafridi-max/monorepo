import Link from 'next/link';
import Image from 'next/image';

export default function BlogCard({ blog }) {
  const { coverImageUrl, title, excerpt, createdAt, readingTime, slug } = blog;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_14px_35px_rgba(16,24,40,0.08)] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,24,40,0.14)]"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={title || 'Blog post'}
            fill
            className="object-cover object-center duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        )}
      </div>
      <div className="px-5 py-6">
        <div className="flex items-center font-outfit text-[12px] font-light text-gray-500">
          <span>{formatDate(createdAt)}</span>
          <span className="mx-2">•</span>
          <span>{readingTime} mins</span>
        </div>
        <h2 className="mb-2 mt-1 line-clamp-2 font-outfit text-md font-medium leading-6 text-gray-900">
          {title}
        </h2>
        <p className="line-clamp-2 font-outfit text-sm font-light text-gray-600">
          {excerpt}
        </p>
      </div>
    </Link>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
