import { SITE_URL } from "@/lib/schema";
import {
  fetchPublishedPosts,
  fetchBlogTags,
  fetchAuthors,
  staticEntries,
  postEntries,
  authorEntries,
} from "@travel-suite/frontend-shared/seo/sitemap";
import { getPublicVisasForResidenceApi } from "@travel-suite/frontend-shared/services/apiVisa";
import { getVisaDestinationsApi } from "@travel-suite/frontend-shared/services/apiVisaRequirements";
import { LIVE_COUNTRIES } from "@/config/countries";

export const revalidate = 3600;

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

const newestPostPerTag = (posts) => {
  const newest = new Map();
  for (const post of posts) {
    const stamp = post.updatedAt || post.createdAt;
    if (!stamp) continue;
    for (const tag of post.tags || []) {
      const name = tag?.name || tag?.slug || tag;
      const current = newest.get(name);
      if (!current || new Date(stamp) > new Date(current)) newest.set(name, stamp);
    }
  }
  return newest;
};

async function visaEntries(now) {
  const entries = [];
  for (const country of LIVE_COUNTRIES) {
    try {
      const res = await getPublicVisasForResidenceApi(country.code);
      const visas = Array.isArray(res) ? res : res?.data || [];
      entries.push(
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
  return entries;
}

async function visaCheckEntries() {
  try {
    const list = await getVisaDestinationsApi();
    return (list?.data || list || [])
      .filter((d) => d?.code)
      .map((d) => ({
        url: `${SITE_URL}/visa-check/${String(d.code).toLowerCase()}`,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
  } catch (err) {
    console.error("[sitemap] visa-check destinations failed:", err);
    return [];
  }
}

export default async function sitemap() {
  const now = new Date().toISOString();

  const [posts, tags, authors] = await Promise.all([
    fetchPublishedPosts(),
    fetchBlogTags(),
    fetchAuthors(),
  ]);

  const newestByTag = newestPostPerTag(posts);

  const tagEntries = tags
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

  return [
    ...staticEntries({
      siteUrl: SITE_URL,
      pages: staticPages,
      now,
      lastModified: false,
      bareRoot: true,
    }),
    ...postEntries({ siteUrl: SITE_URL, posts, now }),
    ...tagEntries,
    ...(await visaEntries(now)),
    ...(await visaCheckEntries()),
    ...authorEntries({ siteUrl: SITE_URL, authors, now }),
  ];
}
