import { SITE_URL } from "@/lib/schema";
import { getPublishedBlogsApi } from "@travel-suite/frontend-shared/services/apiBlog";
import { getBlogTagsApi } from "@travel-suite/frontend-shared/services/apiBlogTags";
import { getAuthorsApi } from "@travel-suite/frontend-shared/services/apiAuthors";
import { getPublicVisasForResidenceApi } from "@travel-suite/frontend-shared/services/apiVisa";
import { getVisaDestinationsApi } from "@travel-suite/frontend-shared/services/apiVisaRequirements";
import { LIVE_COUNTRIES } from "@/config/countries";

// Regenerate hourly so blog/visa/tag entries appear once the backend is reachable
// at runtime (the build-time Docker container usually can't reach it).
export const revalidate = 3600;
// Hand-written pages have no modification date in any datastore, so they carry
// none. A wrong lastmod is worse than an absent one: Google discounts the field
// site-wide once it stops matching what actually changed.
const staticPages = [
  { url: "/", changeFrequency: "weekly", priority: 1.0 },
  { url: "/uae", changeFrequency: "weekly", priority: 0.9 },
  { url: "/blog", changeFrequency: "daily", priority: 0.8 },
  { url: "/visa-check", changeFrequency: "weekly", priority: 0.8 },
  { url: "/blog/tags", changeFrequency: "weekly", priority: 0.5 },
  { url: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { url: "/about", changeFrequency: "monthly", priority: 0.5 },
  { url: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { url: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { url: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  // Next normalises canonicals without a trailing slash, so the root entry has
  // to match or the two disagree on the homepage URL.
  const staticEntries = staticPages.map(({ url, changeFrequency, priority }) => ({
    url: url === "/" ? SITE_URL : `${SITE_URL}${url}`,
    changeFrequency,
    priority,
  }));

  let blogEntries = [];
  let blogPool = [];
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    const blogs = data?.blogs || [];
    blogPool = blogs;
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

  // A tag is as fresh as its newest post. Tags with no posts yet stay listed
  // and simply carry no lastmod.
  let tagEntries = [];
  try {
    const data = await getBlogTagsApi();
    const tags = data?.tags || data || [];
    const newestByTag = new Map();
    for (const blog of blogPool) {
      const stamp = blog.updatedAt || blog.createdAt;
      if (!stamp) continue;
      for (const tag of blog.tags || []) {
        const name = tag?.name || tag?.slug || tag;
        const current = newestByTag.get(name);
        if (!current || new Date(stamp) > new Date(current)) newestByTag.set(name, stamp);
      }
    }
    tagEntries = tags
      .filter((tag) => tag?.slug)
      .map((tag) => {
        const newest = newestByTag.get(tag.name) || newestByTag.get(tag.slug);
        return {
          url: `${SITE_URL}/blog/tags/${tag.slug}`,
          ...(newest ? { lastModified: newest } : {}),
          changeFrequency: "weekly",
          priority: 0.5,
        };
      });
  } catch (err) {
    console.error("[sitemap] fetch failed:", err);
  }

  // One entry per destination that has a published rule. Param URLs are never
  // listed: they canonicalise to these.
  let visaCheckEntries = [];
  try {
    const list = await getVisaDestinationsApi();
    visaCheckEntries = (list?.data || list || [])
      .filter((d) => d?.code)
      .map((d) => ({
        url: `${SITE_URL}/visa-check/${String(d.code).toLowerCase()}`,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
  } catch (err) {
    console.error("[sitemap] visa-check destinations failed:", err);
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
    ...visaCheckEntries,
    ...authorEntries,
  ];
}
