export function createTicketController({ service, paidOrderBus }) {
  const getAllTickets = async (req, res, next) => {
    try {
      const isAgent = req.user?.role === 'agent';
      // Agents may only see the last 4 hours — unless they are:
      //   (a) filtering by delivery date (the "Today's Deliveries" page), or
      //   (b) running a text search (they may need to pull up an older ticket
      //       a customer just called about).
      // Both cases opt out of the 4-hour window while still stripping payment
      // amounts from the response (see below).
      const hasSearch = typeof req.query.search === 'string' && req.query.search.trim().length > 0;
      const agentNeedsCreatedAtOverride = isAgent && !req.query.deliveryDate && !hasSearch;
      const query = agentNeedsCreatedAtOverride ? { ...req.query, createdAt: '4_hours' } : req.query;
      let result = await service.getAllTickets(query);

      // Strip payment amounts from agent responses
      if (isAgent) {
        result = {
          ...result,
          data: result.data.map((ticket) => {
            const t = ticket.toObject ? ticket.toObject() : { ...ticket };
            delete t.amountPaid;
            delete t.transactionId;
            return t;
          }),
        };
      }

      res.json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  };

  // SSE stream: holds the connection open and pushes a `paid-order` event
  // whenever a payment is confirmed on this instance. Sends a comment line
  // every 25s to keep proxies (Fly.io edge) from idling out the connection.
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

    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { void 0; }
    }, 25_000);

    const unsubscribe = paidOrderBus.subscribe(res);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  };

  const sendReservation = async (req, res, next) => {
    try {
      const updated = await service.sendReservation({
        sessionId: req.params.sessionId,
        agentId: req.user?._id,
        subject: req.body?.subject,
        body: req.body?.body,
        bodyHtml: req.body?.bodyHtml,
        file: req.file,
      });
      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  };

  const getLatestPaidTicket = async (_req, res, next) => {
    try {
      const ticket = await service.getLatestPaidTicket();
      res.json({
        status: 'success',
        data: ticket
          ? { sessionId: ticket.sessionId, paidAt: ticket.paidAt || ticket.updatedAt }
          : null,
      });
    } catch (err) {
      next(err);
    }
  };

  const getTicketBySessionId = async (req, res, next) => {
    try {
      const ticket = await service.getTicketBySessionId(req.params.sessionId);
      if (!ticket) return res.status(404).json({ status: 'fail', message: 'Ticket not found' });
      res.json({ status: 'success', data: ticket });
    } catch (err) {
      next(err);
    }
  };

  const createTicketRequest = async (req, res, next) => {
    try {
      const ticket = await service.createTicketRequest(req.body);
      res.status(201).json({ status: 'success', data: ticket });
    } catch (err) {
      next(err);
    }
  };

  const createStripePaymentUrl = async (req, res, next) => {
    try {
      const session = await service.createStripePaymentUrl(req.body);
      res.json({ status: 'success', data: session.url });
    } catch (err) {
      next(err);
    }
  };

  const updateOrderStatus = async (req, res, next) => {
    try {
      const ticket = await service.updateOrderStatus(req.params.sessionId, req.user._id, req.body.orderStatus);
      res.json({ status: 'success', data: ticket });
    } catch (err) {
      next(err);
    }
  };

  const deleteTicket = async (req, res, next) => {
    try {
      await service.deleteTicket(req.params.sessionId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  const refundByTransactionId = async (req, res, next) => {
    try {
      const refund = await service.refundByTransactionId(req.params.transactionId);
      res.json({ status: 'success', data: refund });
    } catch (err) {
      next(err);
    }
  };

  const createPayPalOrder = async (req, res, next) => {
    try {
      const result = await service.createPayPalOrder(req.body);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  const capturePayPalOrder = async (req, res, next) => {
    try {
      const ticket = await service.capturePayPalOrder(req.body);
      res.json({ status: 'success', data: ticket });
    } catch (err) {
      next(err);
    }
  };

  return { getAllTickets, getLatestPaidTicket, streamEvents, getTicketBySessionId, createTicketRequest, createStripePaymentUrl, createPayPalOrder, capturePayPalOrder, updateOrderStatus, sendReservation, deleteTicket, refundByTransactionId };
}
