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
    const booking = await Booking.create({ trip, vehicle, passenger });
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
    const { amount, currency } = vehicle.price;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: passenger.email,
      invoice_creation: { enabled: true },
      metadata: { productType: 'booking', ...(bookingId ? { bookingId: String(bookingId) } : {}) },
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(Number(amount) * 100),
            product_data: { name: `Airport Transfer — ${vehicle.name}` },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (bookingId) {
      const bookingRef = generateBookingRef();
      await Booking.findByIdAndUpdate(bookingId, {
        stripeSessionId: session.id,
        bookingRef,
      });
    }

    return session.url;
  }

  return { listBookings, createBooking, getBookingById, getBookingBySessionId, updateBookingStatus, createCheckout };
}
