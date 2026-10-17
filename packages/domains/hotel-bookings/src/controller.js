export function createHotelBookingController({ service, pricingService, paidOrderBus }) {
  const searchOffers = async (req, res, next) => {
    try {
      const offers = await service.searchOffers(req.body);
      res.json({ status: 'success', results: offers.length, data: offers });
    } catch (err) {
      next(err);
    }
  };

  const suggestCities = async (req, res, next) => {
    try {
      const cities = await service.suggestCities(req.query.search);
      res.json({ status: 'success', results: cities.length, data: cities });
    } catch (err) {
      next(err);
    }
  };

  const listCountries = async (_req, res, next) => {
    try {
      const countries = await service.listCountries();
      res.json({ status: 'success', results: countries.length, data: countries });
    } catch (err) {
      next(err);
    }
  };

  const createReservationRequest = async (req, res, next) => {
    try {
      const reservation = await service.createReservationRequest(req.body);
      res.status(201).json({ status: 'success', data: reservation });
    } catch (err) {
      next(err);
    }
  };

  const createStripePaymentUrl = async (req, res, next) => {
    try {
      const session = await service.createStripePaymentUrl({
        ...req.body,
        clientIp: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ status: 'success', url: session.url });
    } catch (err) {
      next(err);
    }
  };

  const getReservationBySessionId = async (req, res, next) => {
    try {
      const reservation = await service.getReservationBySessionId(req.params.sessionId);
      if (!reservation) return res.status(404).json({ status: 'fail', message: 'Reservation not found' });
      res.json({ status: 'success', data: reservation });
    } catch (err) {
      next(err);
    }
  };

  const getPricingPublic = async (req, res, next) => {
    try {
      res.json({ status: 'success', data: await pricingService.getPricingPublic(req.query.currency) });
    } catch (err) {
      next(err);
    }
  };

  const getAllReservations = async (req, res, next) => {
    try {
      const isAgent = req.user?.role === 'agent';
      let result = await service.getAllReservations(req.query);
      if (isAgent) {
        result = {
          ...result,
          data: result.data.map((doc) => {
            const r = doc.toObject ? doc.toObject() : { ...doc };
            delete r.amountPaid;
            delete r.transactionId;
            return r;
          }),
        };
      }
      res.json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  };

  const getLatestPaidReservation = async (_req, res, next) => {
    try {
      const reservation = await service.getLatestPaidReservation();
      res.json({
        status: 'success',
        data: reservation ? { sessionId: reservation.sessionId, paidAt: reservation.paidAt } : null,
      });
    } catch (err) {
      next(err);
    }
  };

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

  const updateOrderStatus = async (req, res, next) => {
    try {
      const updated = await service.updateOrderStatus(req.params.sessionId, req.user?._id, req.body?.orderStatus);
      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  };

  const retryBooking = async (req, res, next) => {
    try {
      const booked = await service.bookWithSupplier(req.params.sessionId);
      if (!booked) return res.status(409).json({ status: 'fail', message: 'Reservation is not payable or already claimed' });
      res.json({ status: 'success', data: booked });
    } catch (err) {
      next(err);
    }
  };

  const cancelReservation = async (req, res, next) => {
    try {
      const force = req.body?.force === true && req.user?.role === 'admin';
      const cancelled = await service.cancelReservation(req.params.sessionId, { force });
      res.json({ status: 'success', data: cancelled });
    } catch (err) {
      next(err);
    }
  };

  const deleteReservation = async (req, res, next) => {
    try {
      await service.deleteReservation(req.params.sessionId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  const updatePricing = async (req, res, next) => {
    try {
      const updated = await pricingService.updatePricing({ ...req.body, updatedBy: req.user?._id });
      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  };

  const listPriceBooks = async (_req, res, next) => {
    try {
      res.json({ status: 'success', data: await pricingService.listPriceBooks() });
    } catch (err) {
      next(err);
    }
  };

  const deletePriceBook = async (req, res, next) => {
    try {
      res.json({ status: 'success', data: await pricingService.deletePriceBook(req.params.currency) });
    } catch (err) {
      next(err);
    }
  };

  return {
    searchOffers,
    suggestCities,
    listCountries,
    createReservationRequest,
    createStripePaymentUrl,
    getReservationBySessionId,
    getPricingPublic,
    getAllReservations,
    getLatestPaidReservation,
    streamEvents,
    updateOrderStatus,
    retryBooking,
    cancelReservation,
    deleteReservation,
    updatePricing,
    listPriceBooks,
    deletePriceBook,
  };
}
