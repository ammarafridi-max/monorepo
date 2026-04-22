import { getBlogBySlugApi, getPublishedBlogsApi } from '@/services/apiBlog';

function stripHtml(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHeading(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function addHeadingIds(html = '') {
  return String(html).replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_match, attrs = '', content = '') => {
    const text = stripHtml(content);
    const id = slugifyHeading(text);

    if (!id) return `<h2${attrs}>${content}</h2>`;
    if (/\sid=/.test(attrs)) return `<h2${attrs}>${content}</h2>`;

    return `<h2${attrs} id="${id}">${content}</h2>`;
  });
}

function extractHeadings(html = '') {
  const matches = String(html).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  return Array.from(matches)
    .map((match) => stripHtml(match[1]))
    .filter(Boolean)
    .map((text) => ({ text }));
}

function resolveAuthorName(author) {
  if (typeof author === 'string' && author.trim()) return author.trim();
  if (author && typeof author === 'object' && typeof author.name === 'string' && author.name.trim()) {
    return author.name.trim();
  }

  return 'TravelShield Team';
}

function formatPublishedDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function mapBlogPost(blog) {
  if (!blog) return null;

  const category = blog.tags?.[0] || 'Travel Insurance';
  const contentWithHeadingIds = addHeadingIds(blog.content);

  return {
    ...blog,
    content: contentWithHeadingIds,
    category,
    authorName: resolveAuthorName(blog.author),
    dateLabel: formatPublishedDate(blog.publishedAt || blog.createdAt),
    readTimeLabel: Number(blog.readingTime) || 1,
    excerptText: blog.excerpt || stripHtml(blog.quickAnswer || contentWithHeadingIds).slice(0, 180),
    headings: extractHeadings(contentWithHeadingIds),
    plainText: stripHtml(contentWithHeadingIds),
  };
}

export async function getPublishedBlogPosts({ limit = 100, page = 1, tag, author } = {}) {
  const data = await getPublishedBlogsApi({ page, limit, tag, author });
  const blogs = Array.isArray(data?.blogs) ? data.blogs : [];

  return {
    blogs: blogs.map(mapBlogPost).filter(Boolean),
    pagination: data?.pagination || null,
  };
}

export async function getPublishedBlogPostBySlug(slug) {
  const blog = await getBlogBySlugApi(slug);
  return mapBlogPost(blog);
}
