import { SITE_URL } from "@/lib/schema";
import { getPublishedBlogsApi } from "@travel-suite/frontend-shared/services/apiBlog";
import { getBlogTagsApi } from "@travel-suite/frontend-shared/services/apiBlogTags";
import { getAuthorsApi } from "@travel-suite/frontend-shared/services/apiAuthors";
import { getPublicVisasForResidenceApi } from "@travel-suite/frontend-shared/services/apiVisa";
import { LIVE_COUNTRIES } from "@/config/countries";

// Regenerate hourly so blog/visa/tag entries appear once the backend is reachable
// at runtime (the build-time Docker container usually can't reach it).
export const revalidate = 3600;
const staticPages = [
  { url: "/", changeFrequency: "weekly", priority: 1.0, lastmod: "2026-08-09" },
  { url: "/uae", changeFrequency: "weekly", priority: 0.9, lastmod: "2026-08-11" },
  { url: "/blog", changeFrequency: "daily", priority: 0.8, lastmod: "2026-08-09" },
  { url: "/blog/tags", changeFrequency: "weekly", priority: 0.5, lastmod: "2026-08-09" },
  { url: "/faq", changeFrequency: "monthly", priority: 0.6, lastmod: "2026-08-09" },
  { url: "/about", changeFrequency: "monthly", priority: 0.5, lastmod: "2026-08-09" },
  { url: "/contact", changeFrequency: "monthly", priority: 0.5, lastmod: "2026-08-09" },
  { url: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3, lastmod: "2026-08-09" },
  { url: "/privacy-policy", changeFrequency: "yearly", priority: 0.3, lastmod: "2026-08-09" },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  const staticEntries = staticPages.map(
    ({ url, changeFrequency, priority, lastmod }) => ({
      url: `${SITE_URL}${url}`,
      lastModified: lastmod,
      changeFrequency,
      priority,
    }),
  );

  let blogEntries = [];
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    const blogs = data?.blogs || [];
    blogEntries = blogs
      .filter((blog) => blog?.slug)
      .map((blog) => ({
        url: `${SITE_URL}/blog/${blog.slug}`,
        lastModified: blog.updatedAt || blog.createdAt || now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch (err) {
    console.error("[sitemap] fetch failed:", err);
  }

  // One entry per live country per destination it actually serves. A country
  // with no overlay for a destination has no page for it, so it is not listed.
  let visaEntries = [];
  for (const country of LIVE_COUNTRIES) {
    try {
      const res = await getPublicVisasForResidenceApi(country.code);
      const visas = Array.isArray(res) ? res : res?.data || [];
      visaEntries.push(
        ...visas
          .filter((visa) => visa?.slug)
          .map((visa) => ({
            url: `${SITE_URL}/${country.slug}/visa/${visa.slug}`,
            lastModified: visa.updatedAt || visa.createdAt || now,
            changeFrequency: "weekly",
            priority: 0.7,
          })),
      );
    } catch (err) {
      console.error(`[sitemap] visas for ${country.slug} failed:`, err);
    }
  }

  let tagEntries = [];
  try {
    const data = await getBlogTagsApi();
    const tags = data?.tags || data || [];
    tagEntries = tags
      .filter((tag) => tag?.slug)
      .map((tag) => ({
        url: `${SITE_URL}/blog/tags/${tag.slug}`,
        lastModified: "2026-04-28",
        changeFrequency: "weekly",
        priority: 0.5,
      }));
  } catch (err) {
    console.error("[sitemap] fetch failed:", err);
  }

  let authorEntries = [];
  try {
    const authors = await getAuthorsApi();
    authorEntries = (authors || [])
      .filter((author) => author?.authorProfile?.slug)
      .map((author) => ({
        url: `${SITE_URL}/authors/${author.authorProfile.slug}`,
        lastModified: author.updatedAt || now,
        changeFrequency: "monthly",
        priority: 0.5,
      }));
  } catch (err) {
    console.error("[sitemap] authors fetch failed:", err);
  }

  return [
    ...staticEntries,
    ...blogEntries,
    ...tagEntries,
    ...visaEntries,
    ...authorEntries,
  ];
}
