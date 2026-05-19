import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";

function getAuthorName(author) {
  if (typeof author === "string" && author.trim()) return author.trim();
  if (
    author &&
    typeof author === "object" &&
    typeof author.name === "string" &&
    author.name.trim()
  ) {
    return author.name.trim();
  }
  return "TravelShield Team";
}

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogCard({
  slug,
  category,
  title,
  excerpt,
  author,
  date,
  readTime,
  coverImageUrl,
  tags = [],
}) {
  const authorName = getAuthorName(author);

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative h-48 shrink-0">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full bg-linear-to-br from-primary-100 via-accent-50 to-white flex items-center justify-center">
            <span className="text-5xl opacity-30">✈️</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6">
        {category && (
          <span className="inline-block self-start bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {category}
          </span>
        )}

        <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-primary-700 transition-colors">
          {title}
        </h3>

        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">
          {excerpt}
        </p>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
              {authorName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">{authorName}</p>
              <p className="text-xs text-gray-400">{formatDate(date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            <span>{readTime} min read</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
