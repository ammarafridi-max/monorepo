import { catchAsync, AppError } from '@travel-suite/utils';

export function createBlogTagController({ service, BlogTag }) {
  const getAllBlogTags = catchAsync(async (req, res) => {
    const tags = await service.getAllTags(req.query);
    res.status(200).json({ status: 'success', results: tags.length, data: tags });
  });

  const getBlogTagBySlug = catchAsync(async (req, res, next) => {
    const tag = await service.getTagBySlug(req.params.slug);
    if (!tag) return next(new AppError('Blog tag not found', 404));
    res.status(200).json({ status: 'success', data: tag });
  });

  const getBlogTagById = catchAsync(async (req, res, next) => {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag) return next(new AppError('Blog tag not found', 404));
    res.status(200).json({ status: 'success', data: tag });
  });

  const createBlogTag = catchAsync(async (req, res) => {
    const tag = await service.createTag(req.body);
    res.status(201).json({ status: 'success', message: 'Blog tag created successfully', data: tag });
  });

  const updateBlogTag = catchAsync(async (req, res, next) => {
    const tag = await service.updateTag(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Blog tag updated successfully', data: tag });
  });

  const deleteBlogTag = catchAsync(async (req, res) => {
    await service.deleteTag(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  });

  const duplicateBlogTag = catchAsync(async (req, res) => {
    const tag = await service.duplicateTag(req.params.id);
    res.status(201).json({ status: 'success', message: 'Blog tag duplicated successfully', data: tag });
  });

  return { getAllBlogTags, getBlogTagBySlug, getBlogTagById, createBlogTag, updateBlogTag, deleteBlogTag, duplicateBlogTag };
}
