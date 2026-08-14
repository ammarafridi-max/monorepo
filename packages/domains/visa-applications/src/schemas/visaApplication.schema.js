import mongoose from 'mongoose';
import { ACCOMMODATION_TYPES } from './checklistTemplate.schema.js';

const { Schema, Types: { ObjectId } } = mongoose;

const noteSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 2000 },
    createdBy: { type: ObjectId, ref: 'admin-user', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const activityLogSchema = new Schema(
  {
    action: { type: String, required: true },
    fromValue: { type: String },
    toValue: { type: String },
    performedBy: { type: ObjectId, ref: 'admin-user' },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

export const APPLICATION_STATUSES = [
  'DRAFT',
  'INFO_PENDING',
  'INFO_COMPLETE',
  'DOCS_READY',
  'APPOINTMENT_BOOKED',
  'SUBMITTED',
  'DELIVERED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
];

export const APPOINTMENT_STATUSES = ['NOT_BOOKED', 'BOOKED', 'ATTENDED', 'RESCHEDULED', 'MISSED'];

export const REMINDER_STATES = ['ACTIVE', 'PAUSED', 'ESCALATED'];

const visaApplicationSchema = new Schema(
  {
    applicationRef: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },

    user: { type: ObjectId, ref: 'User', required: true, index: true },
    visaLead: { type: ObjectId, ref: 'visa-lead', default: null },

    destinationCountry: { type: String, required: true, trim: true, maxlength: 100 },
    packageName: { type: String, trim: true, maxlength: 100 },
    applicantCount: { type: Number, default: 1, min: 1, max: 20 },

    visaTypeKey: { type: String, uppercase: true, trim: true, default: 'SCHENGEN', index: true },
    accommodationType: { type: String, enum: ACCOMMODATION_TYPES, default: 'HOTEL' },

    intendedTravelDates: {
      from: { type: Date },
      to: { type: Date },
    },

    vfsCenter: { type: String, trim: true, maxlength: 120 },
    appointmentDate: { type: Date },
    appointmentStatus: { type: String, enum: APPOINTMENT_STATUSES, default: 'NOT_BOOKED' },

    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'DRAFT',
      required: true,
      index: true,
    },

    assignedTo: { type: ObjectId, ref: 'admin-user', index: true },

    externalOrders: {
      dummyTicketRef: { type: String, trim: true, default: '' },
      hotelBookingRef: { type: String, trim: true, default: '' },
      insuranceSessionId: { type: String, trim: true, default: '' },
    },

    lastCustomerActionAt: { type: Date },

    customerCompletenessPercent: { type: Number, default: 0, min: 0, max: 100 },
    fileCompletenessPercent: { type: Number, default: 0, min: 0, max: 100 },

    customerCompletedAt: { type: Date, default: null },
    customerCompleteNotifiedAt: { type: Date, default: null },
    readyToSubmit: { type: Boolean, default: false, index: true },

    reminderCount: { type: Number, default: 0 },
    lastReminderSentAt: { type: Date },
    reminderState: { type: String, enum: REMINDER_STATES, default: 'ACTIVE', index: true },

    rejectionReminderCount: { type: Number, default: 0 },
    lastRejectionReminderAt: { type: Date },

    notes: [noteSchema],
    activityLog: [activityLogSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

visaApplicationSchema.pre('save', function () {
  if (this.isNew) {
    this.activityLog.push({ action: 'created', performedAt: new Date() });
  }
});

export default visaApplicationSchema;
