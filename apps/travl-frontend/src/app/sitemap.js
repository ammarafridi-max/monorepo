import { SITE_URL } from "@/lib/schema";
import { getPublishedBlogsApi } from "@travel-suite/frontend-shared/services/apiBlog";
import { getBlogTagsApi } from "@travel-suite/frontend-shared/services/apiBlogTags";
import { getPublicVisasApi } from "@travel-suite/frontend-shared/services/apiVisa";

// Regenerate hourly so blog/visa/tag entries appear once the backend is reachable
// at runtime (the build-time Docker container usually can't reach it).
export const revalidate = 3600;
const staticPages = [
  { url: "/", changeFrequency: "weekly", priority: 1.0, lastmod: "2026-04-28" },
  {
    url: "/travel-insurance",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/travel-insurance/schengen-visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-06-08",
  },
  {
    url: "/travel-insurance/france-visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-06-08",
  },
  {
    url: "/travel-insurance/spain-visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-06-08",
  },
  {
    url: "/travel-insurance/italy-visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-06-08",
  },
  {
    url: "/travel-insurance/germany-visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-06-08",
  },
  {
    url: "/travel-insurance/greece-visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-06-08",
  },
  {
    url: "/travel-insurance/medical",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/travel-insurance/annual-multi-trip",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/travel-insurance/international",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/travel-insurance/single-trip",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/visa",
    changeFrequency: "monthly",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/blog",
    changeFrequency: "daily",
    priority: 0.8,
    lastmod: "2026-04-28",
  },
  {
    url: "/blog/tags",
    changeFrequency: "weekly",
    priority: 0.6,
    lastmod: "2026-04-28",
  },
  {
    url: "/faq",
    changeFrequency: "monthly",
    priority: 0.7,
    lastmod: "2026-04-28",
  },
  {
    url: "/about",
    changeFrequency: "monthly",
    priority: 0.5,
    lastmod: "2026-06-08",
  },
  {
    url: "/contact",
    changeFrequency: "monthly",
    priority: 0.5,
    lastmod: "2026-06-08",
  },
  {
    url: "/claims",
    changeFrequency: "monthly",
    priority: 0.6,
    lastmod: "2026-06-08",
  },
  {
    url: "/terms-and-conditions",
    changeFrequency: "yearly",
    priority: 0.3,
    lastmod: "2026-04-28",
  },
  {
    url: "/privacy-policy",
    changeFrequency: "yearly",
    priority: 0.3,
    lastmod: "2026-04-28",
  },
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

  let visaEntries = [];
  try {
    const visas = (await getPublicVisasApi()) || [];
    visaEntries = visas
      .filter((visa) => visa?.slug)
      .map((visa) => ({
        url: `${SITE_URL}/visa/${visa.slug}`,
        lastModified: visa.updatedAt || visa.createdAt || now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch (err) {
    console.error("[sitemap] fetch failed:", err);
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

  return [...staticEntries, ...blogEntries, ...tagEntries, ...visaEntries];
}
