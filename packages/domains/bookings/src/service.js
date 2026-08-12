import { AppError } from '@travel-suite/utils';
import { resolveVehicle } from './catalog.js';

function generateBookingRef() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createBookingService({ Booking, stripe }) {
  async function listBookings({ page = 1, limit = 20, status } = {}) {
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
    ]);
    return { bookings, total, page, limit };
  }

  async function createBooking({ trip, vehicle, passenger }) {
    // Never persist a client-supplied price. Resolve the vehicle (and its price)
    // from the server-side catalogue so the stored record is trustworthy.
    const resolved = resolveVehicle(vehicle);
    if (!resolved) throw new AppError('Unknown vehicle selection', 400);
    const trustedVehicle = {
      ...vehicle,
      name: resolved.name,
      class: resolved.class,
      price: resolved.price,
    };
    const booking = await Booking.create({ trip, vehicle: trustedVehicle, passenger });
    return booking;
  }

  async function getBookingById(id) {
    return await Booking.findById(id);
  }

  async function getBookingBySessionId(sessionId) {
    return await Booking.findOne({ stripeSessionId: sessionId });
  }

  async function updateBookingStatus(id, status) {
    return await Booking.findByIdAndUpdate(id, { status }, { new: true });
  }

  async function createCheckout({ vehicle, passenger, bookingId, successUrl, cancelUrl }) {
    // Authoritative price comes from the server-side catalogue, keyed by the
    // vehicle id — the client-supplied `vehicle.price` is ignored so a caller can't
    // pay an amount of their choosing.
    const resolved = resolveVehicle(vehicle);
    if (!resolved) throw new AppError('Unknown vehicle selection', 400);

    // Confirm the booking exists before anything payable is created. A session
    // for an unknown id would take the customer's money and leave the webhook
    // with no record to mark paid.
    const booking = await Booking.findById(bookingId).catch(() => null);
    if (!booking) throw new AppError('Booking not found', 404);

    const { amount, currency } = resolved.price;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: passenger.email,
      invoice_creation: { enabled: true },
      metadata: { productType: 'booking', bookingId: String(bookingId) },
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(Number(amount) * 100),
            product_data: { name: `Airport Transfer — ${resolved.name}` },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Keep any reference already issued, so a customer who abandons checkout
    // and comes back does not end up with a second reference for one booking.
    await Booking.findByIdAndUpdate(bookingId, {
      stripeSessionId: session.id,
      bookingRef: booking.bookingRef || generateBookingRef(),
    });

    return session.url;
  }

  return { listBookings, createBooking, getBookingById, getBookingBySessionId, updateBookingStatus, createCheckout };
}
