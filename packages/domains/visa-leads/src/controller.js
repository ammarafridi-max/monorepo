import { catchAsync, AppError } from '@travel-suite/utils';

export function createVisaLeadController({ service }) {

  const submitLead = catchAsync(async (req, res) => {

    if (req.body.website) {
      return res.status(201).json({ status: 'success', data: { id: null } });
    }

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    const userAgent = req.get('user-agent') || '';

    const lead = await service.submitLead({
      firstName:        req.body.firstName,
      lastName:         req.body.lastName,
      nationality:      req.body.nationality,
      email:            req.body.email,
      phone:            req.body.phone,
      packageRequested: req.body.packageRequested,
      applicantCount:   req.body.applicantCount,
      visaSlug:         req.body.visaSlug,
      source:           req.body.source,
      ipAddress,
      userAgent,
    });

    res.status(201).json({ status: 'success', data: { id: lead._id } });
  });

  const getAdminLeads = catchAsync(async (req, res) => {
    const {
      page = 1, limit = 20, status, visaSlug, nationality,
      assignedTo, dateFrom, dateTo, search,
    } = req.query;

    const result = await service.getAdminLeads({
      page, limit, status, visaSlug, nationality, assignedTo, dateFrom, dateTo, search,
    });

    res.status(200).json({
      status: 'success',
      results: result.leads.length,
      data: result,
    });
  });

  const getLeadById = catchAsync(async (req, res, next) => {
    const lead = await service.getLeadById(req.params.id);
    if (!lead) return next(new AppError('Lead not found', 404));
    res.status(200).json({ status: 'success', data: lead });
  });

  const updateStatus = catchAsync(async (req, res) => {
    const lead = await service.updateStatus({
      id:          req.params.id,
      status:      req.body.status,
      performedBy: req.user._id,
    });
    res.status(200).json({ status: 'success', message: 'Status updated', data: lead });
  });

  const assignLead = catchAsync(async (req, res) => {
    const lead = await service.assignLead({
      id:          req.params.id,
      assignedTo:  req.body.assignedTo,
      performedBy: req.user._id,
    });
    res.status(200).json({ status: 'success', message: 'Lead assigned', data: lead });
  });

  const addNote = catchAsync(async (req, res) => {
    const lead = await service.addNote({
      id:          req.params.id,
      text:        req.body.text,
      performedBy: req.user._id,
    });
    res.status(200).json({ status: 'success', message: 'Note added', data: lead });
  });

  const deleteLead = catchAsync(async (req, res) => {
    await service.deleteLead(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  });

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
