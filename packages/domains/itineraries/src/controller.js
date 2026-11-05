import { AppError, catchAsync } from '@travel-suite/utils';

export function createItineraryController({ service }) {
  const createOrder = catchAsync(async (req, res) => {
    const payload = typeof req.body?.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const order = await service.createOrder(payload, req.ip, req.files);
    const meta = await service.getOrderMeta(order.sessionId);
    res.status(201).json({ status: 'success', data: meta });
  });

  const regenerate = catchAsync(async (req, res) => {
    await service.regenerate(req.params.sessionId, req.ip);
    const meta = await service.getOrderMeta(req.params.sessionId);
    res.json({ status: 'success', data: meta });
  });

  const listOrders = catchAsync(async (req, res) => {
    const { data, pagination } = await service.listOrders(req.query);
    res.json({ status: 'success', data, pagination });
  });

  const getOrderDetail = catchAsync(async (req, res) => {
    const order = await service.getOrderDetail(req.params.sessionId);
    if (!order) return res.status(404).json({ status: 'fail', message: 'Itinerary not found' });
    res.json({ status: 'success', data: order });
  });

  const deleteOrder = catchAsync(async (req, res) => {
    await service.deleteOrder(req.params.sessionId);
    res.json({ status: 'success' });
  });

  const getOrder = catchAsync(async (req, res) => {
    const meta = await service.getOrderMeta(req.params.sessionId);
    if (!meta) return res.status(404).json({ status: 'fail', message: 'Itinerary not found' });
    res.json({ status: 'success', data: meta });
  });

  const getPreview = catchAsync(async (req, res) => {
    const url = await service.getPreviewUrl(req.params.sessionId);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.redirect(302, url);
  });

  const createCheckout = catchAsync(async (req, res) => {
    const session = await service.createStripeCheckout(req.params.sessionId);
    res.json({ status: 'success', data: session.url });
  });

  const getDocument = catchAsync(async (req, res) => {
    const url = await service.getCleanPdfUrl(req.params.sessionId);
    const upstream = await fetch(url);
    if (!upstream.ok) throw new AppError('Could not retrieve the document', 502);
    const pdf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="itinerary-${req.params.sessionId}.pdf"`);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(pdf);
  });

  const edit = catchAsync(async (req, res) => {
    await service.editAfterPayment(req.params.sessionId, req.body, req.ip);
    const meta = await service.getOrderMeta(req.params.sessionId);
    res.json({ status: 'success', data: meta });
  });

  const chat = catchAsync(async (req, res) => {
    const result = await service.chatEdit(
      { sessionId: req.params.sessionId, message: req.body?.message },
      req.ip,
    );
    res.json({ status: 'success', data: result });
  });

  const getChat = catchAsync(async (req, res) => {
    const messages = await service.getChatMessages(req.params.sessionId);
    res.json({ status: 'success', data: messages });
  });

  const parseDocuments = catchAsync(async (req, res) => {
    const result = await service.parseDocuments(req.files);
    res.json({ status: 'success', data: result });
  });

  return { createOrder, regenerate, listOrders, getOrderDetail, deleteOrder, getOrder, getPreview, createCheckout, getDocument, edit, chat, getChat, parseDocuments };
}
