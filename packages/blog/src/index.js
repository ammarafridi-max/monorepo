import BlogSchema from './schemas/blog.schema.js';
import BlogTagSchema from './schemas/blogTag.schema.js';
import { createBlogService } from './service.js';
import { createBlogTagService } from './blogTag.service.js';
import { createBlogController } from './controller.js';
import { createBlogTagController } from './blogTag.controller.js';
import { createBlogRouterFromParts } from './router.js';
import { createBlogTagRouterFromParts } from './blogTag.router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

/**
 * @param {{
 *   db: import('mongoose').Connection,
 *   auth: { protect: Function, restrictTo: Function },
 *   imageStorage?: { saveImage(buffer: Buffer, blogId: string): Promise<string>, deleteImage(url: string): Promise<void> }
 * }} deps
 * @returns {import('express').Router}
 */
export function createBlogRouter({ db, auth, imageStorage }) {
  const Blog = getOrRegisterModel(db, 'Blog', BlogSchema);
  const BlogTag = getOrRegisterModel(db, 'blog-tag', BlogTagSchema);
  const service = createBlogService({ Blog, BlogTag, imageStorage });
  const controller = createBlogController({ service, Blog });
  return createBlogRouterFromParts({ controller, auth });
}

/**
 * @param {{
 *   db: import('mongoose').Connection,
 *   auth: { protect: Function, restrictTo: Function }
 * }} deps
 * @returns {import('express').Router}
 */
export function createBlogTagRouter({ db, auth }) {
  const Blog = getOrRegisterModel(db, 'Blog', BlogSchema);
  const BlogTag = getOrRegisterModel(db, 'blog-tag', BlogTagSchema);
  const service = createBlogTagService({ BlogTag, Blog });
  const controller = createBlogTagController({ service, BlogTag });
  return createBlogTagRouterFromParts({ controller, auth });
}

/**
 * One-shot function to auto-publish any scheduled blogs that are past due.
 * Safe to call from a cron job — pass the db connection to get the Blog model.
 *
 * @param {import('mongoose').Connection} db
 * @returns {Promise<number>} count of blogs published
 */
export async function publishDueScheduledBlogs(db) {
  const Blog = getOrRegisterModel(db, 'Blog', BlogSchema);
  const now = new Date();
  const result = await Blog.updateMany(
    { status: 'scheduled', scheduledAt: { $lte: now } },
    { $set: { status: 'published', publishedAt: now }, $unset: { scheduledAt: 1 } },
  );
  return result.modifiedCount || 0;
}
