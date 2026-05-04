import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    currency:    { type: String, required: true, trim: true, default: 'AED' },
    timeline:    { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    features:    { type: [String], default: [] },
    exclusions:  { type: [String], default: [] },
    icon:        { type: String, trim: true },
    isHighlighted: { type: Boolean, default: false },
  },
  { _id: false },
);

const processStepSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon:        { type: String, trim: true },
  },
  { _id: false },
);

const requirementSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    intro: { type: String, trim: true },
    items: { type: [String], default: [], validate: { validator: (v) => v.length <= 15, message: 'A requirement section can have at most 15 items' } },
  },
  { _id: false },
);

const pricingBreakdownSchema = new mongoose.Schema(
  {
    item:     { type: String, required: true, trim: true },
    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: 'AED' },
    paidTo:   { type: String, trim: true },
    note:     { type: String, trim: true },
  },
  { _id: false },
);

const whyUsSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon:        { type: String, trim: true },
  },
  { _id: false },
);

const testimonialSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    nationality: { type: String, trim: true, maxlength: 100 },
    visaType:    { type: String, trim: true, maxlength: 100 }, // e.g. "Schengen visa", "UK Standard Visitor"
    quote:       { type: String, required: true, trim: true, maxlength: 600 },
    rating:      { type: Number, default: 5, min: 1, max: 5 },
    imageUrl:    { type: String, trim: true }, // Optional Cloudinary URL for customer photo
    initials:    { type: String, trim: true, maxlength: 4 }, // Fallback when no photo, e.g. "AR"
    isFeatured:  { type: Boolean, default: false }, // Whether to show in the trust section
  },
  { _id: false },
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer:   { type: String, required: true, trim: true },
  },
  { _id: false },
);

const VisaSchema = new mongoose.Schema(
  {
    countryName: { type: String, required: [true, 'Country name is required'], trim: true },
    slug:        { type: String, required: [true, 'Slug is required'], unique: true, lowercase: true, trim: true, index: true },
    status:      { type: String, enum: ['draft', 'published'], default: 'draft', index: true },

    heroImageUrl:      { type: String },
    heroHeadline:      { type: String, trim: true },
    heroSubheadline:   { type: String, trim: true },
    heroCtaText:       { type: String, trim: true },

    qualifierItems: { type: [String], default: [] },

    packages: {
      type: [packageSchema],
      default: [],
      validate: { validator: (v) => v.length <= 3, message: 'A visa can have at most 3 packages' },
    },

    processSteps: {
      type: [processStepSchema],
      default: [],
      validate: { validator: (v) => v.length <= 7, message: 'A visa can have at most 7 process steps' },
    },

    requirementSections: {
      type: [requirementSectionSchema],
      default: [],
      validate: { validator: (v) => v.length <= 10, message: 'A visa can have at most 10 requirement sections' },
    },

    pricingBreakdown: {
      type: [pricingBreakdownSchema],
      default: [],
      validate: { validator: (v) => v.length <= 15, message: 'Pricing breakdown can have at most 15 items' },
    },

    whyUs: {
      type: [whyUsSchema],
      default: [],
      validate: { validator: (v) => v.length <= 6, message: 'Why Us can have at most 6 items' },
    },

    testimonials: {
      type: [testimonialSchema],
      default: [],
      validate: { validator: (v) => v.length <= 10, message: 'A visa can have at most 10 testimonials' },
    },

    faqs: {
      type: [faqSchema],
      default: [],
      validate: { validator: (v) => v.length <= 30, message: 'A visa can have at most 30 FAQs' },
    },

    finalCtaHeadline: { type: String, trim: true },
    finalCtaText:     { type: String, trim: true },

    metaTitle:       { type: String, trim: true },
    metaDescription: { type: String, trim: true, maxlength: 160 },

    publishedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

VisaSchema.index({ createdAt: -1 });

export default VisaSchema;
