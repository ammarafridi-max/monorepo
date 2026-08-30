import Image from 'next/image';
import Link from 'next/link';

export default function AuthorBox({ author }) {
  const profile = author?.authorProfile;
  if (!author?.name || !profile?.slug) return null;

  const href = `/authors/${profile.slug}`;
  const summary = (profile.bio || '').split(/\n{2,}/)[0]?.trim();

  return (
    <section className="mt-14 rounded-2xl border border-gray-100 bg-gray-50/70 p-6 md:p-7">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
        Written by
      </p>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {profile.avatarUrl && (
          <Link href={href} className="shrink-0">
            <Image
              src={profile.avatarUrl}
              alt={author.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
            />
          </Link>
        )}

        <div className="min-w-0">
          <h2 className="text-lg font-medium text-gray-900">
            <Link href={href} className="hover:text-primary-700">
              {author.name}
            </Link>
          </h2>

          {profile.jobTitle && (
            <p className="mt-0.5 text-sm text-gray-500">{profile.jobTitle}</p>
          )}

          {summary && (
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{summary}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link href={href} className="font-medium text-primary-700 hover:underline">
              More articles by {author.name.split(' ')[0]}
            </Link>
            {(profile.sameAs || []).slice(0, 1).map((url) => (
              <a
                key={url}
                href={url}
                rel="me noopener noreferrer"
                target="_blank"
                className="text-gray-500 hover:text-gray-700 hover:underline"
              >
                LinkedIn
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
