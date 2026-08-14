import slugify from 'slugify';
import { AppError } from '@travel-suite/utils';
import { resolveVisaForResidence } from './resolveForResidence.js';

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

export const SECTION_GUIDE_KEYS = ['packages', 'process', 'requirements', 'pricing', 'faqs'];

const isObjectId = (v) => /^[a-f0-9]{24}$/i.test(String(v));

function parseSectionGuides(value) {
  if (value === undefined) return undefined;
  let raw = value;
  if (typeof raw === 'string') {
    if (raw === '') return {};
    try { raw = JSON.parse(raw); } catch { throw new AppError('Invalid sectionGuides format — must be valid JSON', 400); }
  }
  if (raw === null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new AppError('Invalid sectionGuides format', 400);

  const out = {};
  for (const key of SECTION_GUIDE_KEYS) {
    const id = raw[key];
    out[key] = id && isObjectId(id) ? String(id) : null;
  }
  return out;
}

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function createVisaService({ Visa, VisaOverlay, imageStorage }) {

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

  const saveHeroImage = async (file, visaId, existingUrl = null) => {
    if (!file) return existingUrl;
    if (!imageStorage) throw new AppError('Image storage is not configured', 500);
    if (existingUrl) {
      try { await imageStorage.deleteImage(existingUrl); } catch { }
    }
    return imageStorage.saveImage(file.buffer, visaId);
  };

  const deleteVisaFolder = async (visaId) => {
    // deleteSubfolder scopes to the running brand's storage folder; deleteFolder does not.
    if (!imageStorage?.deleteSubfolder) return;
    try { await imageStorage.deleteSubfolder(visaId); } catch { }
  };

  const parseFields = (body) => ({
    qualifierItems:      parseStringArray(body.qualifierItems),
    packages:            parseJsonField(body.packages,            'packages'),
    processSteps:        parseJsonField(body.processSteps,        'processSteps'),
    requirementSections: parseJsonField(body.requirementSections, 'requirementSections'),
    pricingBreakdown:    parseJsonField(body.pricingBreakdown,    'pricingBreakdown'),
    whyUs:               parseJsonField(body.whyUs,               'whyUs'),
    testimonials:        parseJsonField(body.testimonials,        'testimonials'),
    faqs:                parseJsonField(body.faqs,                'faqs'),
    sectionGuides:       parseSectionGuides(body.sectionGuides),
  });

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

  const getPublicVisas = async () => {
    return Visa.find({ status: 'published' }).sort({ countryName: 1 }).lean();
  };

  const guidePopulate = SECTION_GUIDE_KEYS.map((key) => ({
    path: `sectionGuides.${key}`,
    select: 'title slug status',
  }));

  const getPublicVisaBySlugForResidence = async (slug, residence) => {
    const base = await getPublicVisaBySlug(slug);
    if (!base) return null;
    if (!residence || !VisaOverlay) return base;
    const overlay = await VisaOverlay.findOne({
      visaSlug: slug,
      residence: String(residence).toUpperCase(),
      isPublished: true,
    }).lean();
    return resolveVisaForResidence(base, overlay);
  };

  const getPublicVisasForResidence = async (residence) => {
    const visas = await getPublicVisas();
    if (!residence || !VisaOverlay) return visas;
    const res = String(residence).toUpperCase();
    const overlays = await VisaOverlay.find({ residence: res, isPublished: true }).lean();
    const bySlug = new Map(overlays.map((o) => [o.visaSlug, o]));
    return visas
      .filter((v) => bySlug.has(v.slug))
      .map((v) => resolveVisaForResidence(v, bySlug.get(v.slug)));
  };

  const listOverlays = (filter = {}) => VisaOverlay.find(filter).sort({ residence: 1, visaSlug: 1 }).lean();
  const getOverlay = (residence, visaSlug) =>
    VisaOverlay.findOne({ residence: String(residence).toUpperCase(), visaSlug }).lean();
  const upsertOverlay = async (payload) => {
    const residence = String(payload.residence || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(residence)) throw new AppError('residence must be a 2-letter country code', 400);
    if (!payload.visaSlug) throw new AppError('visaSlug is required', 400);
    if (!payload.residenceSlug) throw new AppError('residenceSlug is required (the URL segment, e.g. "uae")', 400);
    const existing = await VisaOverlay.findOne({ residence, visaSlug: payload.visaSlug });
    const doc = existing || new VisaOverlay({ residence, visaSlug: payload.visaSlug });

    // null means "inherit": unset the path rather than storing an empty value.
    for (const [key, value] of Object.entries({ ...payload, residence })) {
      if (value === null) doc.set(key, undefined);
      else doc.set(key, value);
    }

    await doc.save();
    return doc.toObject();
  };
  const deleteOverlay = async (residence, visaSlug) => {
    const r = await VisaOverlay.deleteOne({ residence: String(residence).toUpperCase(), visaSlug });
    if (!r.deletedCount) throw new AppError('No overlay for that country and visa', 404);
    return true;
  };

  const getPublicVisaBySlug = async (slug) => {
    try {
      return await Visa.findOne({ slug, status: 'published' }).populate(guidePopulate).lean();
    } catch (err) {
      if (err?.name === 'MissingSchemaError') {
        return Visa.findOne({ slug, status: 'published' }).lean();
      }
      throw err;
    }
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

  const createVisa = async ({ body, file, userId }) => {
    if (!body.countryName) throw new AppError('Country name is required', 400);

    const rawSlug = body.slug
      ? slugify(body.slug, { lower: true, strict: true })
      : generateBaseSlug(body.countryName);

    const uniqueSlug = await ensureUniqueSlug(rawSlug);

    const parsed = parseFields(body);

    const visa = await Visa.create({
      countryName:         body.countryName,
      slug:                uniqueSlug,
      status:              'draft',
      excerpt:             body.excerpt,
      heroHeadline:        body.heroHeadline,
      heroSubheadline:     body.heroSubheadline,
      heroCtaText:         body.heroCtaText,
      finalCtaHeadline:    body.finalCtaHeadline,
      finalCtaText:        body.finalCtaText,
      metaTitle:           body.metaTitle,
      metaDescription:     body.metaDescription,
      ...parsed,
    });

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

    if (body.slug !== undefined) {
      const rawSlug = slugify(String(body.slug || '').trim(), { lower: true, strict: true });
      if (!rawSlug) throw new AppError('Slug cannot be empty', 400);
      visa.slug = await ensureUniqueSlug(rawSlug, visa._id);
    }

    const scalarFields = ['countryName', 'excerpt', 'heroHeadline', 'heroSubheadline', 'heroCtaText', 'finalCtaHeadline', 'finalCtaText', 'metaTitle', 'metaDescription'];
    for (const field of scalarFields) {
      if (body[field] !== undefined) visa[field] = body[field];
    }

    const arrayFields = ['qualifierItems', 'packages', 'processSteps', 'requirementSections', 'pricingBreakdown', 'whyUs', 'testimonials', 'faqs'];
    for (const field of arrayFields) {
      if (parsed[field] !== undefined) visa[field] = parsed[field];
    }

    if (parsed.sectionGuides !== undefined) visa.sectionGuides = parsed.sectionGuides;

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
    obj.heroImageUrl = null;

    const duplicated = await Visa.create(obj);
    return duplicated;
  };

  return {
    getPublicVisas,
    getPublicVisaBySlug,
    getPublicVisaBySlugForResidence,
    getPublicVisasForResidence,
    listOverlays,
    getOverlay,
    upsertOverlay,
    deleteOverlay,
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
