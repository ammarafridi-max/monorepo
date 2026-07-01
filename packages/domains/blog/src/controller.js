import mongoose from "mongoose";
import { catchAsync, AppError } from "@travel-suite/utils";

export function createBlogController({ service, Blog }) {
  const getBlogPosts = catchAsync(async (req, res) => {
    await service.publishDueScheduledBlogs();
    const { page = 1, limit = 10, tag, search, author } = req.query;
    const result = await service.getBlogs({
      page,
      limit,
      status: "published",
      tag,
      search,
      author,
    });
    res
      .status(200)
      .json({ status: "success", results: result.blogs.length, data: result });
  });

  const getAdminBlogPosts = catchAsync(async (req, res) => {
    await service.publishDueScheduledBlogs();
    const { page = 1, limit = 10, status, tag, search, author } = req.query;
    const result = await service.getBlogs({
      page,
      limit,
      status,
      tag,
      search,
      author,
    });
    res
      .status(200)
      .json({ status: "success", results: result.blogs.length, data: result });
  });

  const getBlogPostBySlug = catchAsync(async (req, res, next) => {
    await service.publishDueScheduledBlogs();
    const blog = await service.getBlogBySlug(req.params.slug);
    if (!blog) return next(new AppError("Blog post not found", 404));
    res.status(200).json({ status: "success", data: blog });
  });

  const getBlogPostById = catchAsync(async (req, res, next) => {
    const blog = await Blog.findById(req.params.id).populate(
      service.getBlogPopulation(),
    );
    if (!blog) return next(new AppError("Blog post not found", 404));
    res.status(200).json({ status: "success", data: blog });
  });

  const createBlogPost = catchAsync(async (req, res, next) => {
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      quickAnswer,
      status,
      tags,
      metaTitle,
      metaDescription,
    } = req.body;
    const requestedStatus = status || "draft";
    const scheduledAt = service.parseScheduledAt(req.body.scheduledAt);
    const faqs = service.parseFaqs(req.body.faqs) || [];

    service.validateBlogFields(req, {
      requireCoverImage: requestedStatus !== "draft",
      requireTitle: true,
      requireContent: true,
    });
    if (requestedStatus === "scheduled" && !scheduledAt)
      return next(
        new AppError(
          "Scheduled date/time is required when status is scheduled",
          400,
        ),
      );
    if (requestedStatus === "scheduled" && scheduledAt <= new Date())
      return next(
        new AppError("Scheduled date/time must be in the future", 400),
      );

    const { uniqueSlug, readingTime } =
      await service.generateSlugAndReadingTime(customSlug, title, content);
    const metadata = service.normalizeBlogMetadata({
      excerpt,
      quickAnswer,
      metaTitle,
      metaDescription,
    });
    const normalizedTags = service.normalizeTags(tags);
    const resolvedTags = await service.ensureTagsExist(normalizedTags);
    const blogId = new mongoose.Types.ObjectId();
    const coverImageUrl = await service.saveCoverImage(req.file, blogId);

    const blog = await Blog.create({
      _id: blogId,
      title,
      slug: uniqueSlug,
      content,
      excerpt: metadata.excerpt,
      quickAnswer: metadata.quickAnswer,
      coverImageUrl,
      status: requestedStatus,
      tags: resolvedTags,
      faqs,
      metaTitle: metadata.metaTitle || title,
      metaDescription: metadata.metaDescription,
      author: req.user._id,
      publisher: requestedStatus === "published" ? req.user._id : null,
      readingTime,
      publishedAt: requestedStatus === "published" ? new Date() : null,
      scheduledAt: requestedStatus === "scheduled" ? scheduledAt : null,
    });

    await blog.populate(service.getBlogPopulation());
    res.status(201).json({
      status: "success",
      message: "Blog created successfully",
      data: blog,
    });
  });

  const updateBlogPost = catchAsync(async (req, res, next) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return next(new AppError("Blog not found", 404));

    service.validateBlogFields(req, {
      requireCoverImage: false,
      requireTitle: false,
      requireContent: false,
    });

    let normalizedTags =
      req.body.tags === undefined
        ? undefined
        : service.normalizeTags(req.body.tags);
    if (normalizedTags !== undefined)
      normalizedTags = await service.ensureTagsExist(normalizedTags);

    const faqs = service.parseFaqs(req.body.faqs);
    const hasContentUpdate = typeof req.body.content === "string";
    const hasStatusUpdate = typeof req.body.status === "string";
    const hasScheduledAtUpdate = Object.prototype.hasOwnProperty.call(
      req.body,
      "scheduledAt",
    );
    const hasSlugUpdate = typeof req.body.slug === "string";

    if (hasSlugUpdate && req.body.slug.trim() === "")
      return next(new AppError("Slug cannot be empty", 400));

    let updatedSlug = req.body.slug;
    if (hasSlugUpdate && req.body.slug.trim() !== blog.slug) {
      updatedSlug = await service.generateUniqueSlugFromInput(
        req.body.slug,
        blog._id,
      );
    } else if (hasSlugUpdate) {
      updatedSlug = blog.slug;
    }

    const updateData = {
      title: req.body.title,
      slug: updatedSlug,
      content: req.body.content,
      ...service.normalizeBlogMetadata(req.body),
      status: req.body.status,
      tags: normalizedTags,
      faqs,
      scheduledAt: hasScheduledAtUpdate
        ? service.parseScheduledAt(req.body.scheduledAt)
        : undefined,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    updateData.readingTime = service.getReadingTime(
      hasContentUpdate ? req.body.content : blog.content,
    );

    if (
      hasStatusUpdate &&
      req.body.status === "published" &&
      blog.status !== "published"
    ) {
      updateData.publishedAt = new Date();
      updateData.publisher = req.user._id;
      updateData.scheduledAt = null;
    }

    if (hasStatusUpdate && req.body.status === "draft") {
      updateData.publishedAt = null;
      updateData.publisher = null;
      updateData.scheduledAt = null;
    }

    if (hasStatusUpdate && req.body.status === "scheduled") {
      const finalScheduledAt = hasScheduledAtUpdate
        ? updateData.scheduledAt
        : blog.scheduledAt;
      if (!finalScheduledAt)
        return next(
          new AppError(
            "Scheduled date/time is required when status is scheduled",
            400,
          ),
        );
      if (finalScheduledAt <= new Date())
        return next(
          new AppError("Scheduled date/time must be in the future", 400),
        );
      updateData.publishedAt = null;
      updateData.publisher = null;
      updateData.scheduledAt = finalScheduledAt;
    }

    updateData.coverImageUrl = await service.saveCoverImage(
      req.file,
      blog._id,
      blog.coverImageUrl,
    );

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    ).populate(service.getBlogPopulation());
    res.status(200).json({
      status: "success",
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  });

  const deleteBlogPost = catchAsync(async (req, res, next) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return next(new AppError("Blog post not found", 404));
    await service
      .saveCoverImage(null, blog._id, blog.coverImageUrl)
      .catch(() => {});
    await Blog.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });
  });

  const duplicateBlogPost = catchAsync(async (req, res, next) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return next(new AppError("Blog post not found", 404));

    const blogObj = blog.toObject();
    delete blogObj._id;
    delete blogObj.createdAt;
    delete blogObj.updatedAt;
    delete blogObj.publishedAt;
    delete blogObj.scheduledAt;
    delete blogObj.author;
    delete blogObj.publisher;
    delete blogObj.__v;

    blogObj.title = `${blogObj.title} Copy`;
    blogObj.slug = await service.generateUniqueSlugFromInput(
      `${blogObj.slug}-copy`,
    );
    blogObj.status = "draft";
    blogObj.publishedAt = null;
    blogObj.publisher = null;
    blogObj.author = req.user._id;
    blogObj.scheduledAt = null;

    const duplicated = await Blog.create(blogObj);
    await duplicated.populate(service.getBlogPopulation());
    res.status(201).json({
      status: "success",
      message: "Blog post duplicated successfully",
      data: duplicated,
    });
  });

  const publishBlog = catchAsync(async (req, res) => {
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        status: "published",
        publishedAt: new Date(),
        publisher: req.user._id,
        scheduledAt: null,
      },
      { new: true, runValidators: true },
    ).populate(service.getBlogPopulation());
    res.status(200).json({
      status: "success",
      message: "Blog published successfully",
      data: updatedBlog,
    });
  });

  const generateCoverImage = catchAsync(async (req, res) => {
    const { title = "", excerpt = "" } = req.body;
    if (!title.trim()) throw new AppError("title is required", 400);

    const apiKey = process.env.RECRAFT_API_KEY;
    if (!apiKey) throw new AppError("RECRAFT_API_KEY is not configured on the server", 503);

    const skip = new Set([
      "a","an","the","and","or","but","in","on","at","to","for","of","with",
      "by","from","is","are","was","were","be","been","do","does","did",
      "have","has","had","will","would","can","could","should","may","might",
      "need","how","what","why","when","where","who","which","that","this",
      "these","those","your","my","our","their","its","not","no","nor","so",
      "yet","if","than","as","up","out","about","into","before","after",
      "between","each","more","most","other","some","such","only","too",
      "very","just","guide","complete","explained","tips","checklist","step",
      "steps","vs","comparison","best","top","get","know","actually",
      "practical","residents","expats","applicants",
    ]);
    const words = `${title} ${excerpt}`
      .replace(/[?:!,]/g, "")
      .replace(/\b\d{4}\b/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !skip.has(w.toLowerCase()));
    const subject = words.slice(0, 6).join(" ") || "travel";
    const prompt = `Professional travel photography, ${subject}, editorial style, soft natural light, wide shot`;

    const recraftRes = await fetch("https://external.api.recraft.ai/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "recraftv3", style: "realistic_image", size: "1820x1024" }),
    });
    if (!recraftRes.ok) {
      const err = await recraftRes.json().catch(() => ({}));
      throw new AppError(`Recraft error ${recraftRes.status}: ${JSON.stringify(err)}`, 502);
    }
    const data = await recraftRes.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) throw new AppError("Recraft returned no image URL", 502);

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new AppError("Failed to download generated image", 502);

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    res.set("Content-Type", "image/webp");
    res.set("Content-Disposition", 'inline; filename="cover.webp"');
    res.send(buffer);
  });

  return {
    getBlogPosts,
    getAdminBlogPosts,
    getBlogPostBySlug,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    duplicateBlogPost,
    publishBlog,
    generateCoverImage,
  };
}
