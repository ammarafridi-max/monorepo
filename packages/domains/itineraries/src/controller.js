import { AppError } from '@travel-suite/utils';

export function createItineraryController({ service }) {
  const createOrder = async (req, res, next) => {
    try {
      const payload = typeof req.body?.data === 'string' ? JSON.parse(req.body.data) : req.body;
      const order = await service.createOrder(payload, req.ip, req.files);
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

  const listOrders = async (req, res, next) => {
    try {
      const { data, pagination } = await service.listOrders(req.query);
      res.json({ status: 'success', data, pagination });
    } catch (err) {
      next(err);
    }
  };

  const getOrderDetail = async (req, res, next) => {
    try {
      const order = await service.getOrderDetail(req.params.sessionId);
      if (!order) return res.status(404).json({ status: 'fail', message: 'Itinerary not found' });
      res.json({ status: 'success', data: order });
    } catch (err) {
      next(err);
    }
  };

  const deleteOrder = async (req, res, next) => {
    try {
      await service.deleteOrder(req.params.sessionId);
      res.json({ status: 'success' });
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

  const getPreview = async (req, res, next) => {
    try {
      const url = await service.getPreviewUrl(req.params.sessionId);
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.redirect(302, url);
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

  // Proxied, not redirected, so the payment gate cannot be bypassed with the public Cloudinary URL.
  const getDocument = async (req, res, next) => {
    try {
      const url = await service.getCleanPdfUrl(req.params.sessionId);
      const upstream = await fetch(url);
      if (!upstream.ok) throw new AppError('Could not retrieve the document', 502);
      const pdf = Buffer.from(await upstream.arrayBuffer());
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

  const parseDocuments = async (req, res, next) => {
    try {
      const result = await service.parseDocuments(req.files);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  return { createOrder, regenerate, listOrders, getOrderDetail, deleteOrder, getOrder, getPreview, createCheckout, getDocument, edit, chat, getChat, parseDocuments };
}
