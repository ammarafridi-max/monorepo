import { catchAsync, AppError } from '@travel-suite/utils';

export function createBookingController({ service }) {
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

  return { create, getById };
}
