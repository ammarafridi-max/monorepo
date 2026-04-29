export function createTicketController({ service }) {
  const getAllTickets = async (req, res, next) => {
    try {
      const isAgent = req.user?.role === 'agent';
      // Agents may only see the last 4 hours — override any createdAt param they send
      const query = isAgent ? { ...req.query, createdAt: '4_hours' } : req.query;
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

  return { getAllTickets, getTicketBySessionId, createTicketRequest, createStripePaymentUrl, updateOrderStatus, deleteTicket, refundByTransactionId };
}
