import mongoose from 'mongoose';

/**
 * Residence overlay — the country-specific half of a visa page.
 *
 * A visa page is two things mixed together: what is true of the visa (a
 * Schengen visa lets you visit 29 countries; your passport needs 3 months
 * validity) and what is true of applying *from somewhere* (Emirates ID vs
 * Iqama, AED vs SAR, VFS Dubai vs VFS Riyadh).
 *
 * The base Visa document holds the first. This holds the second, one per
 * (residence, visa) pair. At render time the overlay is laid over the base.
 *
 * Anything left empty here inherits from the base. That is the whole point: a
 * second country costs a handful of fields, not a duplicated page, and the
 * shared half physically cannot drift because there is only one copy of it.
 *
 * Lists replace rather than merge — see resolveVisaForResidence for why.
 */

const overlayPackageSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    currency:    { type: String, required: true, trim: true },
    timeline:    { type: String, trim: true },
    description: { type: String, trim: true },
    features:    { type: [String], default: [] },
    exclusions:  { type: [String], default: [] },
    icon:        { type: String, trim: true },
    isHighlighted: { type: Boolean, default: false },
  },
  { _id: false },
);

const overlayPricingSchema = new mongoose.Schema(
  {
    item:     { type: String, required: true, trim: true },
    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true },
    paidTo:   { type: String, trim: true },
    note:     { type: String, trim: true },
  },
  { _id: false },
);

/**
 * Matched to a base section by `title`. Only the sections named here are
 * overridden; the rest of the base checklist is inherited untouched. This is
 * the one place a partial override is worth the complexity, because a
 * requirements list is usually mostly shared with two or three local lines.
 */
const overlayRequirementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    intro: { type: String, trim: true },
    items: {
      type: [String],
      default: undefined,
      validate: { validator: (v) => !v || v.length <= 15, message: 'At most 15 items' },
    },
  },
  { _id: false },
);

/** The "how it works" strip. Filing steps genuinely differ by country: a
 *  biometrics appointment in Dubai is not the same errand as one in Riyadh. */
const overlayProcessStepSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon:        { type: String, trim: true },
  },
  { _id: false },
);

const overlayTestimonialSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    nationality: { type: String, trim: true, maxlength: 100 },
    visaType:    { type: String, trim: true, maxlength: 100 },
    quote:       { type: String, required: true, trim: true, maxlength: 600 },
    rating:      { type: Number, default: 5, min: 1, max: 5 },
    imageUrl:    { type: String, trim: true },
    initials:    { type: String, trim: true, maxlength: 4 },
    isFeatured:  { type: Boolean, default: false },
  },
  { _id: false },
);

const overlayFaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer:   { type: String, required: true, trim: true },
  },
  { _id: false },
);

/** Trust signals are local — "licensed Dubai office" means nothing in Riyadh. */
const overlayWhyUsSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon:        { type: String, trim: true },
  },
  { _id: false },
);

const VisaOverlaySchema = new mongoose.Schema(
  {
    /** ISO 3166-1 alpha-2 of where the applicant lives, e.g. AE, SA. */
    residence:     { type: String, required: true, uppercase: true, trim: true, index: true },
    residenceName: { type: String, required: true, trim: true },
    /** URL segment for this residence, e.g. "uae", "ksa". */
    residenceSlug: { type: String, required: true, lowercase: true, trim: true, index: true },

    /** Slug of the base Visa this overlays. */
    visaSlug: { type: String, required: true, lowercase: true, trim: true, index: true },

    // ---- overrides. Undefined means "inherit from the base". ----
    metaTitle:        { type: String, trim: true },
    metaDescription:  { type: String, trim: true, maxlength: 200 },
    heroHeadline:     { type: String, trim: true },
    heroSubheadline:  { type: String, trim: true },
    excerpt:          { type: String, trim: true, maxlength: 200 },

    packages:            { type: [overlayPackageSchema],     default: undefined },
    processSteps:        { type: [overlayProcessStepSchema], default: undefined },
    pricingBreakdown:    { type: [overlayPricingSchema],     default: undefined },
    requirementSections: { type: [overlayRequirementSchema], default: undefined },
    faqs:                { type: [overlayFaqSchema],         default: undefined },
    testimonials:        { type: [overlayTestimonialSchema], default: undefined },
    whyUs:               { type: [overlayWhyUsSchema],        default: undefined },

    /** Where applicants actually go. The most commonly asked local question. */
    visaCentre: {
      name:    { type: String, trim: true },
      city:    { type: String, trim: true },
      address: { type: String, trim: true },
      note:    { type: String, trim: true },
    },

    /** Local processing estimate, when it differs from the base. */
    processingTime: { type: String, trim: true },

    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// One overlay per country per visa.
VisaOverlaySchema.index({ residence: 1, visaSlug: 1 }, { unique: true });
VisaOverlaySchema.index({ residenceSlug: 1, visaSlug: 1 });

export default VisaOverlaySchema;
