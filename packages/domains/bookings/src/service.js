export function createBookingService({ Booking }) {
  async function createBooking({ trip, vehicle, passenger }) {
    const booking = await Booking.create({ trip, vehicle, passenger });
    return booking;
  }

  async function getBookingById(id) {
    return await Booking.findById(id);
  }

  async function updateBookingStatus(id, status) {
    return await Booking.findByIdAndUpdate(id, { status }, { new: true });
  }

  return { createBooking, getBookingById, updateBookingStatus };
}
