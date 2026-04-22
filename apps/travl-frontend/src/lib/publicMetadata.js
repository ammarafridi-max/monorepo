import { SITE_URL } from '@/lib/schema';

export function buildMetadata({
  title,
  description,
  canonical,
  robots = { index: true, follow: true },
  images = [`${SITE_URL}/og-image.png`],
  type,
}) {
  return {
    title,
    description,
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    robots,
    openGraph: {
      ...(type ? { type } : {}),
      ...(canonical ? { url: canonical } : {}),
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}
