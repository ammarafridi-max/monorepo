export function createItineraryController({ service }) {
  const createOrder = async (req, res, next) => {
    try {
      const order = await service.createOrder(req.body, req.ip);
      const meta = await service.getOrderMeta(order.sessionId);
      res.status(201).json({ status: 'success', data: meta });
    } catch (err) {
      next(err);
    }
  };

  const regenerate = async (req, res, next) => {
    try {
      await service.regenerate(req.params.sessionId, req.ip);
      const meta = await service.getOrderMeta(req.params.sessionId);
      res.json({ status: 'success', data: meta });
    } catch (err) {
      next(err);
    }
  };

  const getOrder = async (req, res, next) => {
    try {
      const meta = await service.getOrderMeta(req.params.sessionId);
      if (!meta) return res.status(404).json({ status: 'fail', message: 'Itinerary not found' });
      res.json({ status: 'success', data: meta });
    } catch (err) {
      next(err);
    }
  };

  // Watermarked flat image — the only itinerary content a client can read
  // before payment. Never returns the JSON or clean text.
  const getPreview = async (req, res, next) => {
    try {
      const image = await service.getPreviewImage(req.params.sessionId);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      // helmet defaults CORP to same-origin; the preview <img> is embedded from
      // the frontend origin, so allow cross-origin embedding (same as /airlines).
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.send(image);
    } catch (err) {
      next(err);
    }
  };

  const createCheckout = async (req, res, next) => {
    try {
      const session = await service.createStripeCheckout(req.params.sessionId);
      res.json({ status: 'success', data: session.url });
    } catch (err) {
      next(err);
    }
  };

  // Clean, watermark-free, print-ready PDF — gated behind payment in the service.
  const getDocument = async (req, res, next) => {
    try {
      const pdf = await service.getCleanPdf(req.params.sessionId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="itinerary-${req.params.sessionId}.pdf"`);
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.send(pdf);
    } catch (err) {
      next(err);
    }
  };

  const edit = async (req, res, next) => {
    try {
      await service.editAfterPayment(req.params.sessionId, req.body, req.ip);
      const meta = await service.getOrderMeta(req.params.sessionId);
      res.json({ status: 'success', data: meta });
    } catch (err) {
      next(err);
    }
  };

  // Conversational AI edit. Returns { reply, messages, meta, applied } — never
  // the clean itinerary content (the reply is a short summary).
  const chat = async (req, res, next) => {
    try {
      const result = await service.chatEdit(
        { sessionId: req.params.sessionId, message: req.body?.message },
        req.ip,
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  const getChat = async (req, res, next) => {
    try {
      const messages = await service.getChatMessages(req.params.sessionId);
      res.json({ status: 'success', data: messages });
    } catch (err) {
      next(err);
    }
  };

  // Reads uploaded supporting documents and returns segments + reservation flags
  // to prefill the form (no order created).
  const parseDocuments = async (req, res, next) => {
    try {
      const result = await service.parseDocuments(req.files);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  return { createOrder, regenerate, getOrder, getPreview, createCheckout, getDocument, edit, chat, getChat, parseDocuments };
}
