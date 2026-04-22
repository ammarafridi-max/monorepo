import slugify from 'slugify';
import { AppError } from '@travel-suite/utils';

function decodeHtmlEntities(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeName(name = '') {
  return decodeHtmlEntities(name).trim();
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildBaseSlug(name = '') {
  return slugify(String(name || ''), { lower: true, strict: true, trim: true }) || 'tag';
}

export function createBlogTagService({ BlogTag, Blog }) {
  const buildUniqueSlug = async (name, excludeId = null) => {
    const baseSlug = buildBaseSlug(name);
    let candidate = baseSlug;
    let counter = 2;

    while (await BlogTag.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return candidate;
  };

  const ensureUniqueName = async (name, excludeId = null) => {
    const normalized = normalizeName(name);
    if (!normalized) throw new AppError('Tag name is required', 400);

    const query = { name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await BlogTag.findOne(query).lean();
    if (existing) throw new AppError('A tag with this name already exists', 400);

    return normalized;
  };

  const ensureUniqueSlug = async (slugInput, excludeId = null) => {
    const normalized = buildBaseSlug(slugInput);
    if (!normalized) throw new AppError('Tag slug is required', 400);

    const existing = await BlogTag.findOne({ slug: normalized, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).lean();
    if (existing) throw new AppError('A tag with this slug already exists', 400);

    return normalized;
  };

  const buildUniqueCopyName = async (baseName) => {
    const original = normalizeName(baseName);
    let candidate = `${original} Copy`;
    let counter = 2;

    while (await BlogTag.exists({ name: new RegExp(`^${escapeRegex(candidate)}$`, 'i') })) {
      candidate = `${original} Copy ${counter}`;
      counter += 1;
    }

    return candidate;
  };

  const backfillMissingSlugs = async () => {
    const tagsWithoutSlug = await BlogTag.find({
      $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }],
    });
    for (const tag of tagsWithoutSlug) {
      tag.slug = await buildUniqueSlug(tag.name, tag._id);
      await tag.save();
    }
  };

  const getAllTags = async (query = {}) => {
    await backfillMissingSlugs();
    const search = String(query.search || '').trim();
    const filter = search ? { name: new RegExp(escapeRegex(search), 'i') } : {};

    const tags = await BlogTag.find(filter).sort({ createdAt: -1 }).lean();
    const tagNames = tags.map((t) => t.name);

    const usage = tagNames.length
      ? await Blog.aggregate([
          { $unwind: '$tags' },
          { $match: { tags: { $in: tagNames } } },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
        ])
      : [];

    const usageMap = new Map(usage.map((e) => [e._id, e.count]));
    return tags.map((tag) => ({ ...tag, usageCount: usageMap.get(tag.name) || 0 }));
  };

  const getTagBySlug = async (slug) => {
    const normalized = String(slug || '').trim().toLowerCase();
    let tag = await BlogTag.findOne({ slug: normalized });

    const { Types } = await import('mongoose');
    if (!tag && Types.ObjectId.isValid(normalized)) {
      tag = await BlogTag.findById(normalized);
    }

    if (!tag) return null;

    if (!tag.slug) {
      tag.slug = await buildUniqueSlug(tag.name, tag._id);
      await tag.save();
    }

    return tag;
  };

  const createTag = async (payload) => {
    const name = await ensureUniqueName(payload.name);
    const slug = payload.slug ? await ensureUniqueSlug(payload.slug) : await buildUniqueSlug(name);

    return BlogTag.create({
      name,
      slug,
      description: decodeHtmlEntities(payload.description || ''),
      metaTitle: decodeHtmlEntities(payload.metaTitle || ''),
      metaDescription: decodeHtmlEntities(payload.metaDescription || ''),
    });
  };

  const updateTag = async (id, payload) => {
    const tag = await BlogTag.findById(id);
    if (!tag) throw new AppError('Blog tag not found', 404);

    const previousName = tag.name;

    if (Object.prototype.hasOwnProperty.call(payload, 'name')) tag.name = await ensureUniqueName(payload.name, tag._id);

    if (Object.prototype.hasOwnProperty.call(payload, 'slug')) {
      tag.slug = await ensureUniqueSlug(payload.slug, tag._id);
    } else if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
      tag.slug = await buildUniqueSlug(tag.name, tag._id);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'description')) tag.description = decodeHtmlEntities(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'metaTitle')) tag.metaTitle = decodeHtmlEntities(payload.metaTitle || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'metaDescription')) tag.metaDescription = decodeHtmlEntities(payload.metaDescription || '');

    await tag.save();

    if (previousName !== tag.name) {
      await Blog.updateMany(
        { tags: previousName },
        { $set: { 'tags.$[matchedTag]': tag.name } },
        { arrayFilters: [{ matchedTag: previousName }] },
      );
    }

    return tag;
  };

  const deleteTag = async (id) => {
    const tag = await BlogTag.findById(id);
    if (!tag) throw new AppError('Blog tag not found', 404);
    await Blog.updateMany({}, { $pull: { tags: tag.name } });
    await BlogTag.findByIdAndDelete(tag._id);
    return tag;
  };

  const duplicateTag = async (id) => {
    const tag = await BlogTag.findById(id);
    if (!tag) throw new AppError('Blog tag not found', 404);

    const duplicatedName = await buildUniqueCopyName(tag.name);

    return BlogTag.create({
      name: duplicatedName,
      slug: await buildUniqueSlug(duplicatedName),
      description: tag.description || '',
      metaTitle: tag.metaTitle || '',
      metaDescription: tag.metaDescription || '',
    });
  };

  return { getAllTags, getTagBySlug, createTag, updateTag, deleteTag, duplicateTag };
}
