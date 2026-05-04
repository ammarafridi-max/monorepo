import slugify from 'slugify';
import { AppError } from '@travel-suite/utils';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseJsonField(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { throw new AppError(`Invalid ${fieldName} format — must be valid JSON`, 400); }
  }
  throw new AppError(`Invalid ${fieldName} format`, 400);
}

function parseStringArray(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return [value]; }
  }
  return [];
}

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function createVisaService({ Visa, imageStorage }) {
  // ─── Slug helpers ────────────────────────────────────────────────────────────

  const generateBaseSlug = (input) => slugify(input, { lower: true, strict: true });

  const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
    let candidate = baseSlug;
    let counter = 2;
    while (true) {
      const query = { slug: candidate };
      if (excludeId) query._id = { $ne: excludeId };
      const existing = await Visa.findOne(query).lean();
      if (!existing) return candidate;
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  };

  // ─── Image helpers ───────────────────────────────────────────────────────────

  const saveHeroImage = async (file, visaId, existingUrl = null) => {
    if (!file) return existingUrl;
    if (!imageStorage) throw new AppError('Image storage is not configured', 500);
    if (existingUrl) {
      try { await imageStorage.deleteImage(existingUrl); } catch { /* non-fatal */ }
    }
    return imageStorage.saveImage(file.buffer, visaId);
  };

  const deleteVisaFolder = async (visaId) => {
    if (!imageStorage?.deleteFolder) return;
    try { await imageStorage.deleteFolder(`travl/visa/${visaId}`); } catch { /* non-fatal */ }
  };

  // ─── Field parsers ───────────────────────────────────────────────────────────

  const parseFields = (body) => ({
    qualifierItems:      parseStringArray(body.qualifierItems),
    packages:            parseJsonField(body.packages,            'packages'),
    processSteps:        parseJsonField(body.processSteps,        'processSteps'),
    requirementSections: parseJsonField(body.requirementSections, 'requirementSections'),
    pricingBreakdown:    parseJsonField(body.pricingBreakdown,    'pricingBreakdown'),
    whyUs:               parseJsonField(body.whyUs,               'whyUs'),
    testimonials:        parseJsonField(body.testimonials,        'testimonials'),
    faqs:                parseJsonField(body.faqs,                'faqs'),
  });

  // ─── Publish-time validation ─────────────────────────────────────────────────

  const validateForPublish = async (visa) => {
    if (!visa.slug || !isValidSlug(visa.slug)) {
      throw new AppError('Visa has an invalid slug — only lowercase letters, numbers and hyphens are allowed', 400);
    }

    const conflict = await Visa.findOne({ slug: visa.slug, _id: { $ne: visa._id } }).lean();
    if (conflict) throw new AppError(`Slug "${visa.slug}" is already taken by another visa`, 409);

    if (!visa.packages || visa.packages.length < 1 || visa.packages.length > 3) {
      throw new AppError('A visa must have between 1 and 3 packages to be published', 400);
    }
    if (!visa.processSteps || visa.processSteps.length < 1 || visa.processSteps.length > 7) {
      throw new AppError('A visa must have between 1 and 7 process steps to be published', 400);
    }
    if (!visa.requirementSections || visa.requirementSections.length < 1 || visa.requirementSections.length > 10) {
      throw new AppError('A visa must have between 1 and 10 requirement sections to be published', 400);
    }
  };

  // ─── Query helpers ───────────────────────────────────────────────────────────

  const getPublicVisas = async () => {
    return Visa.find({ status: 'published' }).sort({ countryName: 1 }).lean();
  };

  const getPublicVisaBySlug = async (slug) => {
    return Visa.findOne({ slug, status: 'published' }).lean();
  };

  const getAdminVisas = async ({ page, limit, status, search }) => {
    let currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize  = Math.max(1, parseInt(limit, 10) || 20);
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ countryName: regex }, { slug: regex }];
    }

    const total = await Visa.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const visas = await Visa.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return {
      visas,
      pagination: { page: currentPage, limit: pageSize, total, totalPages, hasNextPage: currentPage < totalPages, hasPrevPage: currentPage > 1 },
    };
  };

  const getVisaById = async (id) => {
    return Visa.findById(id);
  };

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const createVisa = async ({ body, file, userId }) => {
    if (!body.countryName) throw new AppError('Country name is required', 400);

    const rawSlug = body.slug
      ? slugify(body.slug, { lower: true, strict: true })
      : generateBaseSlug(body.countryName);

    const uniqueSlug = await ensureUniqueSlug(rawSlug);

    const parsed = parseFields(body);

    // Create the document first (without image) to get the _id
    const visa = await Visa.create({
      countryName:         body.countryName,
      slug:                uniqueSlug,
      status:              'draft',
      heroHeadline:        body.heroHeadline,
      heroSubheadline:     body.heroSubheadline,
      heroCtaText:         body.heroCtaText,
      finalCtaHeadline:    body.finalCtaHeadline,
      finalCtaText:        body.finalCtaText,
      metaTitle:           body.metaTitle,
      metaDescription:     body.metaDescription,
      ...parsed,
    });

    // Upload image using the real _id as folder
    if (file) {
      const heroImageUrl = await saveHeroImage(file, visa._id);
      visa.heroImageUrl = heroImageUrl;
      await visa.save();
    }

    return visa;
  };

  const updateVisa = async ({ id, body, file }) => {
    const visa = await Visa.findById(id);
    if (!visa) throw new AppError('Visa not found', 404);

    const parsed = parseFields(body);

    // Handle slug update
    if (body.slug !== undefined) {
      const rawSlug = slugify(String(body.slug || '').trim(), { lower: true, strict: true });
      if (!rawSlug) throw new AppError('Slug cannot be empty', 400);
      visa.slug = await ensureUniqueSlug(rawSlug, visa._id);
    }

    const scalarFields = ['countryName', 'heroHeadline', 'heroSubheadline', 'heroCtaText', 'finalCtaHeadline', 'finalCtaText', 'metaTitle', 'metaDescription'];
    for (const field of scalarFields) {
      if (body[field] !== undefined) visa[field] = body[field];
    }

    const arrayFields = ['qualifierItems', 'packages', 'processSteps', 'requirementSections', 'pricingBreakdown', 'whyUs', 'testimonials', 'faqs'];
    for (const field of arrayFields) {
      if (parsed[field] !== undefined) visa[field] = parsed[field];
    }

    if (file) {
      visa.heroImageUrl = await saveHeroImage(file, visa._id, visa.heroImageUrl);
    }

    await visa.save({ runValidators: true });
    return visa;
  };

  const deleteVisa = async (id) => {
    const visa = await Visa.findById(id);
    if (!visa) throw new AppError('Visa not found', 404);
    await Visa.findByIdAndDelete(id);
    await deleteVisaFolder(id);
    return visa;
  };

  const publishVisa = async (id) => {
    const visa = await Visa.findById(id);
    if (!visa) throw new AppError('Visa not found', 404);
    await validateForPublish(visa);
    visa.status = 'published';
    visa.publishedAt = new Date();
    await visa.save();
    return visa;
  };

  const unpublishVisa = async (id) => {
    const visa = await Visa.findById(id);
    if (!visa) throw new AppError('Visa not found', 404);
    visa.status = 'draft';
    await visa.save();
    return visa;
  };

  const duplicateVisa = async (id) => {
    const visa = await Visa.findById(id);
    if (!visa) throw new AppError('Visa not found', 404);

    const obj = visa.toObject();
    delete obj._id;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj.publishedAt;
    delete obj.__v;

    const baseSlug = await generateBaseSlug(`${obj.countryName} copy`);
    obj.slug = await ensureUniqueSlug(baseSlug);
    obj.countryName = `${obj.countryName} Copy`;
    obj.status = 'draft';
    obj.publishedAt = null;
    // Do NOT copy the hero image — leave heroImageUrl empty
    obj.heroImageUrl = null;

    const duplicated = await Visa.create(obj);
    return duplicated;
  };

  return {
    getPublicVisas,
    getPublicVisaBySlug,
    getAdminVisas,
    getVisaById,
    createVisa,
    updateVisa,
    deleteVisa,
    publishVisa,
    unpublishVisa,
    duplicateVisa,
  };
}
