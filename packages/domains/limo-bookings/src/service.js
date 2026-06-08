import { randomBytes } from 'crypto';
import { AppError } from '@travel-suite/utils';

function resolveServiceName(booking) {
  if (booking?.tripType === 'hourly') return 'Chauffeur Service';
  if (booking?.pickup?.type === 'airport' || booking?.dropoff?.type === 'airport') return 'Airport Transfer';
  return 'Chauffeur Service';
}

/**
 * @param Booking      Mongoose model
 * @param stripe       Stripe client (from @travel-suite/payments createStripeClient)
 * @param frontendUrl  Public site origin (replaces source EL_FRONTEND), e.g. https://www.emirateslimo.com
 * @param pricing      Pricing service exposing getVehiclesForTrip
 */
export function createBookingService({ Booking, stripe, frontendUrl, pricing }) {
  const getVehiclesForTrip = (query) => pricing.getVehiclesForTrip(query);

  const getBookings = async ({ page = 1, limit = 20 } = {}) => {
    const currentPage = Number(page) * 1 || 1;
    const perPage = Number(limit) * 1 || 20;
    const skip = (currentPage - 1) * perPage;
    const bookings = await Booking.find().sort({ createdAt: -1 }).skip(skip).limit(perPage);
    return { bookings, page: currentPage };
  };

  const getBookingById = async (id) => {
    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Booking not found', 404);
    return booking;
  };

  const getBookingByReference = async (ref) => {
    const booking = await Booking.findOne({ bookingRef: ref });
    if (!booking) throw new AppError('Booking not found', 404);
    return booking;
  };

  const createBooking = async (data) => {
    let bookingRef;
    let isUnique = false;
    while (!isUnique) {
      bookingRef = randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
      isUnique = !(await Booking.exists({ bookingRef }));
    }
    return Booking.create({ ...data, bookingRef });
  };

  const updateBooking = async (id, payload) => {
    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Booking not found', 404);
    Object.assign(booking, payload);
    await booking.save();
    return booking;
  };

  const deleteBooking = async (id) => {
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) throw new AppError('Booking not found', 404);
  };

  const createCheckoutSession = async (booking) => {
    return stripe.checkout.sessions.create({
      customer_email: booking?.bookingDetails?.email,
      success_url: `${frontendUrl}/payment?id=${booking?._id}`,
      cancel_url: `${frontendUrl}/book/booking-details`,
      line_items: [
        {
          price_data: {
            currency: (booking?.orderSummary?.currency || 'AED').toLowerCase(),
            product_data: { name: resolveServiceName(booking) },
            unit_amount: booking?.orderSummary?.total * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        bookingId: booking._id.toString(),
        bookingRef: booking.bookingRef,
        sessionId: booking._id.toString(),
        productType: 'booking',
      },
      invoice_creation: { enabled: true },
      allow_promotion_codes: true,
    });
  };

  const getPaymentLink = async (id) => {
    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.payment.status === 'paid') throw new AppError('This booking has already been paid.', 400);

    const session = await createCheckoutSession(booking);

    booking.payment.transactionId = session.id;
    booking.payment.status = 'pending';
    await booking.save();

    return session.url;
  };

  const refundByTransactionId = async (transactionId) => {
    const booking = await Booking.findOne({ 'payment.transactionId': transactionId });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.payment.status !== 'paid') throw new AppError('Payment not completed', 400);

    const session = await stripe.checkout.sessions.retrieve(transactionId);
    if (!session.payment_intent) throw new AppError('PaymentIntent not found', 400);

    const refund = await stripe.refunds.create({ payment_intent: session.payment_intent });

    booking.payment.status = 'refunded';
    booking.status = 'cancelled';
    await booking.save();

    return refund;
  };

  return {
    getVehiclesForTrip,
    getBookings,
    getBookingById,
    getBookingByReference,
    createBooking,
    updateBooking,
    deleteBooking,
    getPaymentLink,
    refundByTransactionId,
  };
}
