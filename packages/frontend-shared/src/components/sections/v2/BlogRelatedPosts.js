import Image from "next/image";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function BlogRelatedPosts({ posts = [], heading = "Keep reading" }) {
  if (!posts.length) return null;

  return (
    <section className="mt-14 border-t border-gray-100 pt-10">
      <h2 className="mb-6 text-xl font-medium text-gray-900">{heading}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-3/2 overflow-hidden rounded-xl bg-gray-100">
              {post.coverImageUrl && (
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  loading="lazy"
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div>
              <h3 className="text-[15px] font-medium leading-snug text-gray-900 transition-colors group-hover:text-primary-700">
                {post.title}
              </h3>
              {post.publishedAt && (
                <p className="mt-1 text-[12px] font-light text-gray-500">
                  {formatDate(post.publishedAt)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
