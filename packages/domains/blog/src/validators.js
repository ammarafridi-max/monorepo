import slugify from 'slugify';
import { AppError } from '@travel-suite/utils';

function normalizeRequiredString(value, label) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new AppError(`${label} is required`, 400);
  return normalized;
}

function normalizeOptionalSlug(value) {
  if (value === undefined) return undefined;
  const slug = slugify(String(value || ''), { lower: true, strict: true, trim: true });
  if (!slug) throw new AppError('Tag slug is required', 400);
  return slug;
}

export const createBlogTagSchema = (body = {}) => ({
  name: normalizeRequiredString(body.name, 'Tag name'),
  slug: normalizeOptionalSlug(body.slug),
  description: body.description === undefined ? undefined : String(body.description || '').trim(),
  metaTitle: body.metaTitle === undefined ? undefined : String(body.metaTitle || '').trim(),
  metaDescription: body.metaDescription === undefined ? undefined : String(body.metaDescription || '').trim(),
});

export const updateBlogTagSchema = (body = {}) => {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = String(body.name || '').trim();
    if (!name) throw new AppError('Tag name is required', 400);
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'slug')) payload.slug = normalizeOptionalSlug(body.slug);
  if (Object.prototype.hasOwnProperty.call(body, 'description')) payload.description = String(body.description || '').trim();
  if (Object.prototype.hasOwnProperty.call(body, 'metaTitle')) payload.metaTitle = String(body.metaTitle || '').trim();
  if (Object.prototype.hasOwnProperty.call(body, 'metaDescription')) payload.metaDescription = String(body.metaDescription || '').trim();

  if (!Object.keys(payload).length) throw new AppError('At least one tag field is required', 400);

  return payload;
};
