import { getPublishedBlogsApi } from '../services/apiBlog.js';
import { getBlogTagsApi } from '../services/apiBlogTags.js';
import { getAuthorsApi } from '../services/apiAuthors.js';

const asArray = (value, key) => {
  if (Array.isArray(value)) return value;
  const nested = value?.[key];
  return Array.isArray(nested) ? nested : [];
};

export async function fetchPublishedPosts() {
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    return asArray(data, 'blogs');
  } catch (err) {
    console.error('[sitemap] blog posts fetch failed:', err);
    return [];
  }
}

export async function fetchBlogTags() {
  try {
    return asArray(await getBlogTagsApi(), 'tags');
  } catch (err) {
    console.error('[sitemap] blog tags fetch failed:', err);
    return [];
  }
}

export async function fetchAuthors() {
  try {
    return asArray(await getAuthorsApi(), 'authors');
  } catch (err) {
    console.error('[sitemap] authors fetch failed:', err);
    return [];
  }
}

export function staticEntries({ siteUrl, pages, now, lastModified = true, bareRoot = false }) {
  return pages.map(({ url, changeFrequency, priority }) => ({
    url: bareRoot && url === '/' ? siteUrl : `${siteUrl}${url}`,
    ...(lastModified ? { lastModified: now } : {}),
    changeFrequency,
    priority,
  }));
}

export function postEntries({ siteUrl, posts, now, priority = 0.7 }) {
  return posts
    .filter((post) => post?.slug)
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.createdAt || now,
      changeFrequency: 'weekly',
      priority,
    }));
}

export function tagEntries({ siteUrl, tags, now, priority = 0.5 }) {
  return tags
    .filter((tag) => tag?.slug)
    .map((tag) => ({
      url: `${siteUrl}/blog/tags/${tag.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority,
    }));
}

export function authorEntries({ siteUrl, authors, now, priority = 0.5 }) {
  return authors
    .filter((author) => author?.authorProfile?.slug)
    .map((author) => ({
      url: `${siteUrl}/authors/${author.authorProfile.slug}`,
      lastModified: author.updatedAt || now,
      changeFrequency: 'monthly',
      priority,
    }));
}

export async function buildContentEntries(siteUrl, { now = new Date().toISOString() } = {}) {
  const [posts, tags, authors] = await Promise.all([
    fetchPublishedPosts(),
    fetchBlogTags(),
    fetchAuthors(),
  ]);

  return [
    ...postEntries({ siteUrl, posts, now }),
    ...tagEntries({ siteUrl, tags, now }),
    ...authorEntries({ siteUrl, authors, now }),
  ];
}
