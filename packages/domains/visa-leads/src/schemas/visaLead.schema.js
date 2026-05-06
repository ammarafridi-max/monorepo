import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const noteSchema = new Schema(
  {
    text:      { type: String, required: true, maxlength: 2000 },
    createdBy: { type: ObjectId, ref: 'admin-user', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const activityLogSchema = new Schema(
  {
    action:      { type: String, required: true },
    fromValue:   { type: String },
    toValue:     { type: String },
    performedBy: { type: ObjectId, ref: 'admin-user' },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const visaLeadSchema = new Schema(
  {

    firstName:        { type: String, required: true, trim: true, maxlength: 50 },
    lastName:         { type: String, required: true, trim: true, maxlength: 50 },
    nationality:      { type: String, required: true, maxlength: 100 },
    email:            { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone:            { type: String, required: true, trim: true, maxlength: 30 },
    packageRequested: { type: String, required: true, maxlength: 100 },
    applicantCount:   { type: Number, required: true, min: 1, max: 20 },

    visaSlug:        { type: String, required: true, index: true },
    visaCountryName: { type: String, required: true },
    source:          {
      type: String,
      enum: ['hero_cta', 'package_card', 'final_cta'],
      required: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String },

    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      default: 'new',
      required: true,
      index: true,
    },
    assignedTo: { type: ObjectId, ref: 'admin-user', index: true },
    notes:       [noteSchema],
    activityLog: [activityLogSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

visaLeadSchema.pre('save', async function () {
  if (this.isNew) {
    this.activityLog.push({
      action: 'created',
      performedAt: new Date(),
    });
  }
});

export default visaLeadSchema;
