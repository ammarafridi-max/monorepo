import { catchAsync, AppError } from '@travel-suite/utils';

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

  const getById = catchAsync(async (req, res, next) => {
    const booking = await service.getBookingById(req.params.id);
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ status: 'success', data: booking });
  });

  const getBySessionId = catchAsync(async (req, res, next) => {
    const booking = await service.getBookingBySessionId(req.params.sessionId);
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ status: 'success', data: booking });
  });

  const checkout = catchAsync(async (req, res, next) => {
    const { vehicle, passenger, bookingId, successUrl, cancelUrl } = req.body;
    if (!vehicle || !passenger || !successUrl || !cancelUrl) {
      return next(new AppError('Missing required checkout data', 400));
    }
    const url = await service.createCheckout({ vehicle, passenger, bookingId, successUrl, cancelUrl });
    res.json({ status: 'success', data: { url } });
  });

  return { list, create, getById, getBySessionId, checkout, updateStatus };
}
