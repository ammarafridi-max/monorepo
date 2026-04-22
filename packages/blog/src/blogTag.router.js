import { Router } from 'express';
import { createBlogTagSchema, updateBlogTagSchema } from './validators.js';

function validate(schemaFn) {
  return (req, res, next) => {
    try {
      req.body = schemaFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function createBlogTagRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/', controller.getAllBlogTags);
  router.get('/slug/:slug', controller.getBlogTagBySlug);
  router.get('/:id', controller.getBlogTagById);

  router.use(protect, restrictTo('admin', 'blog-manager'));

  router.post('/', validate(createBlogTagSchema), controller.createBlogTag);
  router.patch('/:id', validate(updateBlogTagSchema), controller.updateBlogTag);
  router.delete('/:id', controller.deleteBlogTag);
  router.post('/:id/duplicate', controller.duplicateBlogTag);

  return router;
}
