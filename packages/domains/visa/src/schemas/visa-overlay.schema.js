import mongoose from 'mongoose';

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
    residence:     { type: String, required: true, uppercase: true, trim: true, index: true },
    residenceName: { type: String, required: true, trim: true },
    residenceSlug: { type: String, required: true, lowercase: true, trim: true, index: true },

    visaSlug: { type: String, required: true, lowercase: true, trim: true, index: true },

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

    visaCentre: {
      name:    { type: String, trim: true },
      city:    { type: String, trim: true },
      address: { type: String, trim: true },
      note:    { type: String, trim: true },
    },

    processingTime: { type: String, trim: true },

    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

VisaOverlaySchema.index({ residence: 1, visaSlug: 1 }, { unique: true });
VisaOverlaySchema.index({ residenceSlug: 1, visaSlug: 1 });

export default VisaOverlaySchema;
