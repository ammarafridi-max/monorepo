import mongoose from 'mongoose';
import { ACCOMMODATION_TYPES } from './checklistTemplate.schema.js';

const { Schema, Types: { ObjectId } } = mongoose;

// notes[] and activityLog[] copy the shape used in visaLead.schema.js.
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

// Reminder engine state:
//  ACTIVE    — the app is being chased on the normal schedule
//  PAUSED    — staff have muted reminders (customer travelling / asked to wait)
//  ESCALATED — the customer went quiet after 4 reminders; staff take over by phone
export const REMINDER_STATES = ['ACTIVE', 'PAUSED', 'ESCALATED'];

const visaApplicationSchema = new Schema(
  {
    applicationRef: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },

    user: { type: ObjectId, ref: 'User', required: true, index: true },
    // Optional back-reference set when an application is created from a captured lead.
    visaLead: { type: ObjectId, ref: 'visa-lead', default: null },

    destinationCountry: { type: String, required: true, trim: true, maxlength: 100 },
    packageName: { type: String, trim: true, maxlength: 100 },
    applicantCount: { type: Number, default: 1, min: 1, max: 20 },

    // Which ChecklistTemplate drives this application's rules. Only SCHENGEN is
    // seeded today; UK/US become available by seeding more templates (no code change).
    visaTypeKey: { type: String, uppercase: true, trim: true, default: 'SCHENGEN', index: true },
    // Shared across all applicants; drives HOTEL vs HOST document rules.
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

    // Plain strings/ids pasted by staff. There is intentionally NO cross-app API
    // call for these — a human copies the reference from dt365 / mdt / WIS.
    externalOrders: {
      dummyTicketRef: { type: String, trim: true, default: '' },
      hotelBookingRef: { type: String, trim: true, default: '' },
      insuranceSessionId: { type: String, trim: true, default: '' },
    },

    // Drives the "days since last customer action" column in the admin table.
    // Updated on any document upload or applicant-detail save by the customer.
    lastCustomerActionAt: { type: Date },

    // ---- completeness (recalculated on every document status change) --------
    // Both ignore NOT_APPLICABLE rows in the denominator; a satisfied-by row counts
    // complete when its source row is APPROVED.
    //  - customer: only source CUSTOMER rows. What the portal shows and what the
    //    reminder engine (Track A) uses — customers are never chased for staff docs.
    //  - file: all rows regardless of source. The full VFS file, shown to admins.
    customerCompletenessPercent: { type: Number, default: 0, min: 0, max: 100 },
    fileCompletenessPercent: { type: Number, default: 0, min: 0, max: 100 },

    // Staff-turn bookkeeping (recomputed with completeness):
    //  - customerCompletedAt: when the customer's own part first hit 100% (cleared if
    //    it drops back below 100). Drives "Your turn" queue sorting.
    //  - customerCompleteNotifiedAt: one-shot guard for the "file ready to prepare"
    //    staff email — set atomically, never reset (send once per application).
    //  - readyToSubmit: fileCompleteness 100 AND every non-optional row APPROVED/complete.
    customerCompletedAt: { type: Date, default: null },
    customerCompleteNotifiedAt: { type: Date, default: null },
    readyToSubmit: { type: Boolean, default: false, index: true },

    // Track A (incomplete application) counters.
    reminderCount: { type: Number, default: 0 },
    lastReminderSentAt: { type: Date },
    reminderState: { type: String, enum: REMINDER_STATES, default: 'ACTIVE', index: true },

    // Track B (rejected document) counters — independent of Track A.
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
