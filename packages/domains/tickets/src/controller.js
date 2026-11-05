import { catchAsync } from '@travel-suite/utils';

const PUBLIC_TICKET_FIELDS = [
  'sessionId', 'type', 'from', 'to', 'departureDate', 'returnDate', 'quantity',
  'passengers', 'leadPassenger', 'email', 'phoneNumber', 'message',
  'ticketValidity', 'ticketDelivery', 'flightDetails', 'paymentStatus',
  'amountPaid', 'currency', 'createdAt',
];

const AGENT_HIDDEN_FIELDS = ['amountPaid', 'amountPaidBase', 'transactionId', 'affiliateCommission', 'affiliateCommissionPercent'];

function toTicketView(ticket, role) {
  const plain = ticket.toObject ? ticket.toObject() : { ...ticket };

  if (role === 'admin') return plain;

  if (role === 'agent') {
    AGENT_HIDDEN_FIELDS.forEach((field) => delete plain[field]);
    return plain;
  }

  return Object.fromEntries(
    PUBLIC_TICKET_FIELDS.filter((field) => plain[field] !== undefined).map((field) => [field, plain[field]]),
  );
}

export function createTicketController({ service, paidOrderBus, audienceService }) {
  const getAllTickets = catchAsync(async (req, res) => {
    const isAgent = req.user?.role === 'agent';
    const hasSearch = typeof req.query.search === 'string' && req.query.search.trim().length > 0;
    const agentNeedsRecencyOverride = isAgent && !req.query.deliveryDate && !hasSearch;
    const query = agentNeedsRecencyOverride ? { ...req.query, createdAt: '4_hours' } : req.query;
    let result = await service.getAllTickets(query);

    if (isAgent) {
      result = {
        ...result,
        data: result.data.map((ticket) => toTicketView(ticket, 'agent')),
      };
    }

    res.json({ status: 'success', ...result });
  });

  const getTicketStats = catchAsync(async (req, res) => {
    const isAgent = req.user?.role === 'agent';
    const query = isAgent && !req.query.createdAt ? { ...req.query, createdAt: '4_hours' } : req.query;
    const stats = await service.getTicketStats(query);
    if (isAgent) delete stats.revenue;
    res.json({ status: 'success', data: stats });
  });

  const streamEvents = async (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();
    res.write('retry: 5000\n\n');
    res.write(': connected\n\n');
    res.flush?.();

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
        res.flush?.();
      } catch { void 0; }
    }, 25_000);

    const unsubscribe = paidOrderBus.subscribe(res);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  };

  const sendReservation = catchAsync(async (req, res) => {
    const updated = await service.sendReservation({
      sessionId: req.params.sessionId,
      agentId: req.user?._id,
      agentName: req.user?.name,
      subject: req.body?.subject,
      body: req.body?.body,
      bodyHtml: req.body?.bodyHtml,
      file: req.file,
    });
    res.json({ status: 'success', data: updated });
  });

  const getLatestPaidTicket = catchAsync(async (_req, res) => {
    const ticket = await service.getLatestPaidTicket();
    res.json({
      status: 'success',
      data: ticket
        ? { sessionId: ticket.sessionId, paidAt: ticket.paidAt }
        : null,
    });
  });

  const getTicketBySessionId = catchAsync(async (req, res) => {
    const ticket = await service.getTicketBySessionId(req.params.sessionId);
    if (!ticket) return res.status(404).json({ status: 'fail', message: 'Ticket not found' });
    res.json({ status: 'success', data: toTicketView(ticket, req.user?.role) });
  });

  const getReservationFile = catchAsync(async (req, res) => {
    const url = await service.getReservationDownloadUrl(req.params.sessionId);
    res.redirect(302, url);
  });

  const getTicketQuote = catchAsync(async (req, res) => {
    const quote = await service.getTicketQuote(req.params.sessionId, req.query.currency);
    res.json({ status: 'success', data: quote });
  });

  const exportAudiences = catchAsync(async (req, res) => {
    const result = await audienceService.exportAudiences({});
    res.json({ status: 'success', data: result });
  });

  const createTicketRequest = catchAsync(async (req, res) => {
    const ticket = await service.createTicketRequest(req.body);
    res.status(201).json({ status: 'success', data: ticket });
  });

  const updateTicketRequest = catchAsync(async (req, res) => {
    const ticket = await service.updateTicketRequest(req.params.sessionId, req.body);
    res.json({ status: 'success', data: ticket });
  });

  const createStripePaymentUrl = catchAsync(async (req, res) => {
    const session = await service.createStripePaymentUrl({
      ...req.body,
      clientIp: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ status: 'success', data: session.url });
  });

  const updateOrderStatus = catchAsync(async (req, res) => {
    const ticket = await service.updateOrderStatus(
      req.params.sessionId,
      req.user._id,
      req.body.orderStatus,
      { id: req.user._id, name: req.user.name },
    );
    res.json({ status: 'success', data: ticket });
  });

  const updateDelivery = catchAsync(async (req, res) => {
    const ticket = await service.updateDeliveryDate(
      req.params.sessionId,
      req.user._id,
      { deliveryDate: req.body?.deliveryDate, immediate: req.body?.immediate },
      { id: req.user._id, name: req.user.name },
    );
    res.json({ status: 'success', data: ticket });
  });

  const deleteTicket = catchAsync(async (req, res) => {
    await service.deleteTicket(req.params.sessionId);
    res.status(204).send();
  });

  const refundByTransactionId = catchAsync(async (req, res) => {
    const refund = await service.refundByTransactionId(req.params.transactionId, {
      id: req.user?._id,
      name: req.user?.name,
    });
    res.json({ status: 'success', data: refund });
  });

  const createPayPalOrder = catchAsync(async (req, res) => {
    const result = await service.createPayPalOrder(req.body);
    res.json({ status: 'success', data: result });
  });

  const capturePayPalOrder = catchAsync(async (req, res) => {
    const ticket = await service.capturePayPalOrder(req.body);
    res.json({ status: 'success', data: ticket });
  });

  return { exportAudiences, getAllTickets, getTicketStats, getLatestPaidTicket, streamEvents, getTicketBySessionId, getTicketQuote, getReservationFile, createTicketRequest, updateTicketRequest, createStripePaymentUrl, createPayPalOrder, capturePayPalOrder, updateOrderStatus, updateDelivery, sendReservation, deleteTicket, refundByTransactionId };
}
