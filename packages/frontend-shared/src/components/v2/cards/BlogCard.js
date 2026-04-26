import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

function getAuthorName(author) {
  if (typeof author === 'string' && author.trim()) return author.trim();
  if (author && typeof author === 'object' && typeof author.name === 'string' && author.name.trim()) {
    return author.name.trim();
  }

  return 'TravelShield Team';
}

export default function BlogCard({ slug, category, title, excerpt, author, date, readTime }) {
  const authorName = getAuthorName(author);

  return (
    <article className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gradient-to-br from-primary-100 via-accent-50 to-white flex items-center justify-center shrink-0">
        <span className="text-5xl opacity-30">✈️</span>
      </div>

      <div className="flex flex-col flex-1 p-6">
        <span className="inline-block self-start bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {category}
        </span>

        <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-primary-700 transition-colors">
          <Link href={`/blog/${slug}`}>{title}</Link>
        </h3>

        <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{excerpt}</p>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
              {authorName.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">{authorName}</p>
              <p className="text-xs text-gray-400">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            <span>{readTime} min read</span>
          </div>
        </div>

        <Link
          href={`/blog/${slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:gap-2 transition-all"
        >
          Read more <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
