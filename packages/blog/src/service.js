import slugify from 'slugify';
import mongoose from 'mongoose';
import { AppError } from '@travel-suite/utils';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
}

function estimateReadingTime(content = '') {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function generateUniqueSlug(Blog, baseSlug, currentId = null) {
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const query = { slug: candidate };
    if (currentId) query._id = { $ne: currentId };
    const existing = await Blog.findOne(query).lean();
    if (!existing) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export function createBlogService({ Blog, BlogTag, imageStorage }) {
  const getBlogPopulation = () => [
    { path: 'author', select: 'name username email role status createdAt updatedAt' },
    { path: 'publisher', select: 'name username email role status createdAt updatedAt' },
  ];

  const getBlogs = async ({ page, limit, status, tag, search, author }) => {
    let currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (tag && tag !== 'all') filter.tags = new RegExp(`^${escapeRegex(tag)}$`, 'i');
    if (author && author !== 'all') filter.author = author;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: regex }, { excerpt: regex }, { content: regex }];
    }

    const total = await Blog.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate(getBlogPopulation());

    return {
      blogs,
      pagination: { page: currentPage, limit: pageSize, total, totalPages, hasNextPage: currentPage < totalPages, hasPrevPage: currentPage > 1 },
    };
  };

  const getBlogBySlug = async (slug) => {
    return Blog.findOne({ slug, status: 'published' }).populate(getBlogPopulation());
  };

  const normalizeBlogMetadata = (payload = {}) => ({
    excerpt: normalizeOptionalText(payload.excerpt),
    quickAnswer: normalizeOptionalText(payload.quickAnswer),
    metaTitle: normalizeOptionalText(payload.metaTitle),
    metaDescription: normalizeOptionalText(payload.metaDescription),
  });

  const normalizeTags = (tags) => {
    if (!tags) return [];
    const arr = Array.isArray(tags) ? tags : [tags];
    const normalized = arr.map((tag) => String(tag || '').trim()).filter(Boolean);
    const seen = new Set();
    return normalized.filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const parseFaqs = (faqs) => {
    if (faqs === undefined) return undefined;
    if (faqs === null || faqs === '') return [];

    let parsed = faqs;
    if (typeof faqs === 'string') {
      try { parsed = JSON.parse(faqs); } catch { throw new AppError('Invalid FAQs format', 400); }
    }

    if (!Array.isArray(parsed)) throw new AppError('FAQs must be an array', 400);

    return parsed
      .map((faq) => ({ question: String(faq?.question || '').trim(), answer: String(faq?.answer || '').trim() }))
      .filter((faq) => faq.question || faq.answer)
      .map((faq) => {
        if (!faq.question || !faq.answer) throw new AppError('Each FAQ must include both a question and an answer', 400);
        return faq;
      });
  };

  const ensureTagsExist = async (tags = []) => {
    if (!Array.isArray(tags) || tags.length === 0) return [];

    const existingTags = await BlogTag.find().select('name').lean();
    const nameByLower = new Map(existingTags.map((t) => [String(t.name).toLowerCase(), t.name]));
    const normalizeLoose = (v = '') => String(v).toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameByLoose = new Map(existingTags.map((t) => [normalizeLoose(t.name), t.name]));

    const resolved = [];
    const missing = [];

    for (const tag of tags) {
      const input = String(tag || '').trim();
      if (!input) continue;

      const byCaseInsensitive = nameByLower.get(input.toLowerCase());
      if (byCaseInsensitive) { resolved.push(byCaseInsensitive); continue; }

      const byLooseMatch = nameByLoose.get(normalizeLoose(input));
      if (byLooseMatch) { resolved.push(byLooseMatch); continue; }

      missing.push(input);
    }

    if (missing.length > 0) throw new AppError(`Unknown tag(s): ${missing.join(', ')}`, 400);

    return [...new Set(resolved)];
  };

  const saveCoverImage = async (file, blogId, existingImageUrl = null) => {
    if (!file) return existingImageUrl;
    if (!imageStorage) throw new AppError('Image storage is not configured', 500);

    if (existingImageUrl) {
      try { await imageStorage.deleteImage(existingImageUrl); } catch { /* non-fatal */ }
    }

    return imageStorage.saveImage(file.buffer, blogId);
  };

  const generateUniqueSlugFromInput = async (input, currentId = null) => {
    const base = slugify(input, { lower: true, strict: true });
    return generateUniqueSlug(Blog, base, currentId);
  };

  const generateSlugAndReadingTime = async (customSlug, title, content) => {
    const base = slugify(customSlug || title, { lower: true, strict: true });
    const uniqueSlug = await generateUniqueSlug(Blog, base);
    const readingTime = estimateReadingTime(content);
    return { uniqueSlug, readingTime };
  };

  const parseScheduledAt = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const publishDueScheduledBlogs = async () => {
    const now = new Date();
    const result = await Blog.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: now } },
      { $set: { status: 'published', publishedAt: now }, $unset: { scheduledAt: 1 } },
    );
    return result.modifiedCount || 0;
  };

  const validateBlogFields = (req, { requireCoverImage = true, requireTitle = true, requireContent = true } = {}) => {
    const { title, content } = req.body;
    if (requireTitle && !title) throw new AppError('Title is required', 400);
    if (requireContent && !content) throw new AppError('Content is required', 400);
    if (!requireTitle && title === '') throw new AppError('Title cannot be empty', 400);
    if (!requireContent && content === '') throw new AppError('Content cannot be empty', 400);
    if (requireCoverImage && !req.file) throw new AppError('Cover image is required', 400);
  };

  return {
    getBlogPopulation,
    getBlogs,
    getBlogBySlug,
    normalizeBlogMetadata,
    normalizeTags,
    parseFaqs,
    ensureTagsExist,
    saveCoverImage,
    generateUniqueSlugFromInput,
    generateSlugAndReadingTime,
    parseScheduledAt,
    publishDueScheduledBlogs,
    validateBlogFields,
    getReadingTime: estimateReadingTime,
  };
}
