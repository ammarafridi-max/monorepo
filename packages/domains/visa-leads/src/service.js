import { parsePhoneNumber } from 'libphonenumber-js';
import { AppError } from '@travel-suite/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SOURCES = ['hero_cta', 'package_card', 'final_cta'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || '').trim());
}

function isValidPhone(phone) {
  try {
    const parsed = parsePhoneNumber(String(phone || '').trim());
    return parsed?.isValid() === true;
  } catch {
    return false;
  }
}

export function createVisaLeadService({ VisaLead, Visa, notificationsService }) {

  const submitLead = async ({
    firstName, lastName, nationality, email, phone,
    packageRequested, applicantCount, visaSlug, source,
    ipAddress, userAgent,
  }) => {

    if (!firstName?.trim()) throw new AppError('First name is required', 400);
    if (!lastName?.trim())  throw new AppError('Last name is required', 400);
    if (!nationality?.trim()) throw new AppError('Nationality is required', 400);
    if (!packageRequested?.trim()) throw new AppError('Package selection is required', 400);
    if (!visaSlug?.trim()) throw new AppError('Visa slug is required', 400);

    if (!email?.trim()) throw new AppError('Email is required', 400);
    if (!isValidEmail(email)) throw new AppError('Please provide a valid email address', 400);

    if (!phone?.trim()) throw new AppError('Phone number is required', 400);
    if (!isValidPhone(phone)) {
      throw new AppError('Please provide a valid international phone number (e.g. +971501234567)', 400);
    }

    const count = parseInt(applicantCount, 10);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new AppError('Applicant count must be between 1 and 20', 400);
    }

    if (!VALID_SOURCES.includes(source)) {
      throw new AppError(`Source must be one of: ${VALID_SOURCES.join(', ')}`, 400);
    }

    const visa = await Visa.findOne({ slug: visaSlug, status: 'published' }).lean();
    if (!visa) throw new AppError('Visa not found or not currently available', 404);

    const lead = await VisaLead.create({
      firstName:        firstName.trim(),
      lastName:         lastName.trim(),
      nationality:      nationality.trim(),
      email:            email.trim().toLowerCase(),
      phone:            phone.trim(),
      packageRequested: packageRequested.trim(),
      applicantCount:   count,
      visaSlug,
      visaCountryName:  visa.countryName,
      source,
      ipAddress,
      userAgent,
    });

    if (notificationsService?.sendVisaLeadToAdmin) {
      notificationsService.sendVisaLeadToAdmin({
        leadId:           lead._id.toString(),
        firstName:        lead.firstName,
        lastName:         lead.lastName,
        nationality:      lead.nationality,
        email:            lead.email,
        phone:            lead.phone,
        packageRequested: lead.packageRequested,
        applicantCount:   lead.applicantCount,
        visaCountryName:  lead.visaCountryName,
        source:           lead.source,
        submittedAt:      lead.createdAt,
      }).catch((err) => {
        console.error('[visa-leads] notification email failed', err?.message);
      });
    }

    return lead;
  };

  const getAdminLeads = async ({
    page, limit, status, visaSlug, nationality, assignedTo,
    dateFrom, dateTo, search,
  }) => {
    let currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize  = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const filter = {};

    if (status && status !== 'all') {
      if (!VALID_STATUSES.includes(status)) throw new AppError(`Invalid status filter`, 400);
      filter.status = status;
    }
    if (visaSlug && visaSlug !== 'all') filter.visaSlug = visaSlug;
    if (nationality && nationality !== 'all') {
      filter.nationality = new RegExp(escapeRegex(nationality), 'i');
    }
    if (assignedTo === 'unassigned') {
      filter.assignedTo = { $exists: false };
    } else if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = assignedTo;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { firstName: regex },
        { lastName:  regex },
        { email:     regex },
        { phone:     regex },
      ];
    }

    const total = await VisaLead.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const leads = await VisaLead.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate('assignedTo', 'name email')
      .lean();

    return {
      leads,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    };
  };

  const getLeadById = async (id) => {
    return VisaLead.findById(id)
      .populate('assignedTo', 'name email')
      .populate('notes.createdBy', 'name email')
      .populate('activityLog.performedBy', 'name email');
  };

  const updateStatus = async ({ id, status, performedBy }) => {
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }
    const lead = await VisaLead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const fromValue = lead.status;
    lead.status = status;
    lead.activityLog.push({
      action: 'status_changed',
      fromValue,
      toValue: status,
      performedBy,
      performedAt: new Date(),
    });
    await lead.save();
    return lead;
  };

  const assignLead = async ({ id, assignedTo, performedBy }) => {
    const lead = await VisaLead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const fromValue = lead.assignedTo?.toString() || 'unassigned';

    if (!assignedTo) {

      lead.assignedTo = undefined;
      lead.activityLog.push({
        action: 'assigned',
        fromValue,
        toValue: 'unassigned',
        performedBy,
        performedAt: new Date(),
      });
    } else {

      try {
        const AdminUser = VisaLead.db.model('admin-user');
        const adminUser = await AdminUser.findById(assignedTo).lean();
        if (!adminUser) throw new AppError('Admin user not found', 404);
        lead.activityLog.push({
          action: 'assigned',
          fromValue,
          toValue: adminUser.name || assignedTo,
          performedBy,
          performedAt: new Date(),
        });
      } catch (err) {
        if (err instanceof AppError) throw err;

        lead.activityLog.push({
          action: 'assigned',
          fromValue,
          toValue: assignedTo,
          performedBy,
          performedAt: new Date(),
        });
      }
      lead.assignedTo = assignedTo;
    }

    await lead.save();
    return lead;
  };

  const addNote = async ({ id, text, performedBy }) => {
    if (!text?.trim()) throw new AppError('Note text is required', 400);
    if (text.trim().length > 2000) throw new AppError('Note text must be 2000 characters or fewer', 400);

    const lead = await VisaLead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    lead.notes.push({
      text: text.trim(),
      createdBy: performedBy,
      createdAt: new Date(),
    });
    lead.activityLog.push({
      action: 'note_added',
      performedBy,
      performedAt: new Date(),
    });
    await lead.save();
    return lead;
  };

  const deleteLead = async (id) => {
    const lead = await VisaLead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    await VisaLead.findByIdAndDelete(id);
    return lead;
  };

  return {
    submitLead,
    getAdminLeads,
    getLeadById,
    updateStatus,
    assignLead,
    addNote,
    deleteLead,
  };
}
