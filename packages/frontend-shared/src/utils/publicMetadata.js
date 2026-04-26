export function buildMetadata({
  siteUrl = '',
  title,
  description,
  canonical,
  robots = { index: true, follow: true },
  images,
  type,
}) {
  const resolvedImages = images ?? (siteUrl ? [`${siteUrl}/og-image.png`] : []);

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      ...(type ? { type } : {}),
      ...(canonical ? { url: canonical } : {}),
      title,
      description,
      images: resolvedImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: resolvedImages,
    },
  };
}
