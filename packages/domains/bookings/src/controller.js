import { catchAsync, AppError } from '@travel-suite/utils';

/**
 * Strip the contact details from a booking for an anonymous caller.
 *
 * The two GET routes have to stay open — they back the page a customer lands
 * on after paying, and that customer is not logged in. But a booking id or a
 * Stripe session id on its own should not hand over a stranger's surname,
 * email and phone number, so the anonymous view keeps only what the receipt
 * actually renders: the journey, the vehicle, the reference, and the first
 * name and flight number it shows back to the traveller.
 *
 * `stripeSessionId` goes too — an internal payment reference with no purpose
 * on the page.
 */
function redactForPublic(booking) {
  if (!booking) return booking;
  const b = typeof booking.toObject === 'function' ? booking.toObject() : { ...booking };
  const { firstName, flightNumber } = b.passenger || {};

  return {
    ...b,
    passenger: { firstName, flightNumber },
    stripeSessionId: undefined,
  };
}

export function createBookingController({ service }) {
  const list = catchAsync(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const status = req.query.status || undefined;
    const result = await service.listBookings({ page, limit, status });
    res.json({ status: 'success', data: result });
  });

  const updateStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    const allowed = ['pending_payment', 'paid', 'confirmed', 'completed', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return next(new AppError('Invalid status value', 400));
    }
    const booking = await service.updateBookingStatus(req.params.id, status);
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ status: 'success', data: booking });
  });

  const create = catchAsync(async (req, res, next) => {
    const { trip, vehicle, passenger } = req.body;
    if (!trip || !vehicle || !passenger) {
      return next(new AppError('Missing required booking data', 400));
    }
    const booking = await service.createBooking({ trip, vehicle, passenger });
    res.status(201).json({ status: 'success', data: booking });
  });

  // `req.user` is set by the soft `identify` middleware — staff see the whole
  // record, everyone else sees the receipt view.
  const getById = catchAsync(async (req, res, next) => {
    const booking = await service.getBookingById(req.params.id);
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ status: 'success', data: req.user ? booking : redactForPublic(booking) });
  });

  const getBySessionId = catchAsync(async (req, res, next) => {
    const booking = await service.getBookingBySessionId(req.params.sessionId);
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ status: 'success', data: req.user ? booking : redactForPublic(booking) });
  });

  const checkout = catchAsync(async (req, res, next) => {
    const { vehicle, passenger, bookingId, successUrl, cancelUrl } = req.body;
    if (!vehicle || !passenger || !successUrl || !cancelUrl) {
      return next(new AppError('Missing required checkout data', 400));
    }
    // Without a bookingId the payment succeeds and the webhook has nothing to
    // attach it to, so the customer is charged with no booking on record.
    if (!bookingId) {
      return next(new AppError('bookingId is required to start a checkout', 400));
    }
    const url = await service.createCheckout({ vehicle, passenger, bookingId, successUrl, cancelUrl });
    res.json({ status: 'success', data: { url } });
  });

  return { list, create, getById, getBySessionId, checkout, updateStatus };
}
