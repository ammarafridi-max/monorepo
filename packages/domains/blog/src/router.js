import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function createBlogRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/', controller.getBlogPosts);
  router.get('/slug/:slug', controller.getBlogPostBySlug);

  router.use(protect, restrictTo('admin', 'blog-manager'));

  router.get('/admin/list', controller.getAdminBlogPosts);
  router.post('/', upload.single('coverImage'), controller.createBlogPost);
  router.get('/:id', controller.getBlogPostById);
  router.patch('/:id', upload.single('newCoverImage'), controller.updateBlogPost);
  router.delete('/:id', controller.deleteBlogPost);
  router.patch('/:id/publish', controller.publishBlog);
  router.post('/:id/duplicate', controller.duplicateBlogPost);

  return router;
}
