import { SITE_URL } from "@/lib/schema";
import {
  fetchPublishedPosts,
  fetchBlogTags,
  fetchAuthors,
  staticEntries,
  postEntries,
  authorEntries,
} from "@travel-suite/frontend-shared/seo/sitemap";

export const revalidate = 3600;

const monthly = (url, priority = 0.8) => ({
  url,
  changeFrequency: "monthly",
  priority,
});

const insuranceSlugs = [
  "schengen-visa",
  "france-visa",
  "spain-visa",
  "italy-visa",
  "germany-visa",
  "greece-visa",
  "switzerland-visa",
  "netherlands-visa",
  "austria-visa",
  "uk-visa",
  "us-visa",
  "canada-visa",
  "australia-visa",
  "medical",
  "annual-multi-trip",
  "international",
  "single-trip",
  "indonesia",
  "family",
];

const staticPages = [
  { url: "/", changeFrequency: "weekly", priority: 1.0 },
  monthly("/travel-insurance"),
  monthly("/travel-itinerary"),
  ...insuranceSlugs.map((slug) => monthly(`/travel-insurance/${slug}`)),
  { url: "/blog", changeFrequency: "daily", priority: 0.8 },
  { url: "/blog/tags", changeFrequency: "weekly", priority: 0.6 },
  monthly("/faq", 0.7),
  monthly("/about", 0.5),
  monthly("/contact", 0.5),
  monthly("/claims", 0.6),
  { url: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { url: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
];

const countPostsPerTag = (posts) => {
  const counts = new Map();
  for (const post of posts) {
    for (const tag of post?.tags || []) {
      const name = typeof tag === "string" ? tag : tag?.name;
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  return counts;
};

export default async function sitemap() {
  const now = new Date().toISOString();

  const [posts, tags, authors] = await Promise.all([
    fetchPublishedPosts(),
    fetchBlogTags(),
    fetchAuthors(),
  ]);

  const postsPerTag = countPostsPerTag(posts);

  const tagEntries = tags
    .filter((tag) => tag?.slug && postsPerTag.get(tag.name) > 0)
    .map((tag) => ({
      url: `${SITE_URL}/blog/tags/${tag.slug}`,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  return [
    ...staticEntries({
      siteUrl: SITE_URL,
      pages: staticPages,
      now,
      lastModified: false,
    }),
    ...postEntries({ siteUrl: SITE_URL, posts, now }),
    ...tagEntries,
    ...authorEntries({ siteUrl: SITE_URL, authors, now }),
  ];
}
