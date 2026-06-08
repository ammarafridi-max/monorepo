import { catchAsync } from '@travel-suite/utils';

export function createBookingController({ service }) {
  const getVehicles = catchAsync(async (req, res) => {
    const vehicles = await service.getVehiclesForTrip(req.query);
    res.status(200).json({ status: 'success', results: vehicles.length, data: { vehicles } });
  });

  const getBookings = catchAsync(async (req, res) => {
    const { bookings, page } = await service.getBookings(req.query);
    res.status(200).json({ status: 'success', results: bookings.length, page, data: bookings });
  });

  const getBookingById = catchAsync(async (req, res) => {
    const booking = await service.getBookingById(req.params.id);
    res.status(200).json({ status: 'success', data: booking });
  });

  const getBookingByReference = catchAsync(async (req, res) => {
    const booking = await service.getBookingByReference(req.params.ref);
    res.status(200).json({ status: 'success', data: booking });
  });

  const createBooking = catchAsync(async (req, res) => {
    const booking = await service.createBooking(req.validatedBody);
    res.status(201).json({ status: 'success', data: booking });
  });

  const updateBooking = catchAsync(async (req, res) => {
    const booking = await service.updateBooking(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: booking });
  });

  const deleteBooking = catchAsync(async (req, res) => {
    await service.deleteBooking(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  });

  const getPaymentLink = catchAsync(async (req, res) => {
    const url = await service.getPaymentLink(req.params.id);
    res.status(200).json({ status: 'success', data: url });
  });

  const refundStripePayment = catchAsync(async (req, res) => {
    const refund = await service.refundByTransactionId(req.params.transactionId);
    res.status(200).json({ status: 'success', message: 'Payment refunded successfully', data: refund });
  });

  return {
    getVehicles,
    getBookings,
    getBookingById,
    getBookingByReference,
    createBooking,
    updateBooking,
    deleteBooking,
    getPaymentLink,
    refundStripePayment,
  };
}
