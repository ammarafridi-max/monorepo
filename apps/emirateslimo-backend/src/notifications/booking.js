import { createNotificationsService } from "@travel-suite/notifications";
import { logger } from "@travel-suite/utils";
import config from "../utils/config.js";

export const createLimoNotifications = ({ sendEmail }) =>
  createNotificationsService({
    sendEmail,
    logger,
    brand: {
      name: "Emirates Limo",
      teamName: "Emirates Limo Team",
      adminEmail: config.contactEmail,
      website: "https://www.emirateslimo.com",
      paymentsSenderName: "Emirates Limo Payments",
      deliverySenderName: "Emirates Limo",
      customerSenderName: "Emirates Limo",
      driverDetailsNote: "Your chauffeur's name and contact number are emailed the day before pickup.",
      theme: {
        primaryColor: "#000000",
        accentColor: "#f97316",
        linkColor: "#c2410c",
      },
    },
  });

// Maps a limo booking onto the shared booking email templates. The limo-bookings
// webhook records each result on the booking, so both handlers return { ok }.
export function bookingNotifications(notifications) {
  const toEmailData = (booking) => {
    const hourly = booking?.tripType === "hourly";
    return {
      email: booking?.bookingDetails?.email,
      firstName: booking?.bookingDetails?.firstName,
      lastName: booking?.bookingDetails?.lastName,
      countryCode: booking?.bookingDetails?.phoneNumber?.code || null,
      phone: booking?.bookingDetails?.phoneNumber?.number || null,
      flightNumber: booking?.bookingDetails?.flightNumber || null,
      specialRequests: booking?.bookingDetails?.message || null,
      bookingRef: booking?.bookingRef,
      bookingId: booking?._id,
      serviceName: hourly ? "Hourly Chauffeur" : "Chauffeur Transfer",
      pickup: [booking?.pickup?.name, booking?.pickup?.address].filter(Boolean).join(" - "),
      dropoff: hourly
        ? `Hourly hire, ${booking?.hoursBooked} hour${booking?.hoursBooked === 1 ? "" : "s"}`
        : [booking?.dropoff?.name, booking?.dropoff?.address].filter(Boolean).join(" - "),
      date: booking?.pickupDate,
      time: booking?.pickupTime,
      vehicleName: [booking?.vehicle?.brand, booking?.vehicle?.model].filter(Boolean).join(" "),
      vehicleClass: booking?.vehicle?.class,
      price: { amount: booking?.payment?.amount, currency: booking?.payment?.currency },
    };
  };

  const wrap = (send) => async ({ booking }) => {
    const ok = await send(toEmailData(booking));
    return ok ? { ok: true } : { ok: false, error: "Email send reported failure" };
  };

  return {
    sendPaymentConfirmationEmailAdmin: wrap(notifications.sendBookingPaymentToAdmin),
    sendPaymentConfirmationEmailCustomer: wrap(notifications.sendBookingConfirmationToCustomer),
  };
}
