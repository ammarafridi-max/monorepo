/**
 * Booking payment-confirmation emails (ported from the standalone backend's
 * notification.service.js). Returns the handler pair consumed by the
 * limo-bookings Stripe webhook handler.
 *
 * @param {{ sendEmail: Function, config: { contactEmail: string, adminUrl: string } }} deps
 */
export function createBookingNotifications({ sendEmail, config }) {
  const sendPaymentConfirmationEmailAdmin = async ({ booking }) => {
    const bookingRef = booking?.bookingRef;
    const name = `${booking?.bookingDetails?.firstName} ${booking?.bookingDetails?.lastName}`;
    const subject = `Payment received from ${name} - ${bookingRef}`;
    const amount = `${booking?.payment?.currency?.toUpperCase()} ${booking?.payment?.amount}`;
    const url = `${config.adminUrl}/bookings/${booking?._id}`;
    const textContent = `Hi Admin, \n\nA new payment of ${amount} has been received from ${name} with booking reference ${bookingRef}. More details can be found on ${url}.`;

    await sendEmail({ email: config.contactEmail, name: "Emirates Limo", subject, textContent });
  };

  const sendPaymentConfirmationEmailCustomer = async ({ booking }) => {
    const bookingRef = booking?.bookingRef;
    const email = booking?.bookingDetails?.email;
    const currency = booking?.payment?.currency?.toUpperCase();
    const amount = booking?.payment?.amount;
    const name = booking?.bookingDetails?.firstName;
    const hourlyRide = booking?.tripType === "hourly";
    const vehicleName = `${booking?.vehicle?.brand} ${booking?.vehicle?.model}`;
    const pickup = `${booking?.pickup?.name} - ${booking?.pickup?.address}`;
    const dropoff = !hourlyRide ? `${booking?.dropoff?.name} - ${booking?.dropoff?.address}` : "NA";
    const hoursBooked = booking?.hoursBooked;
    const pickupDate = booking?.pickupDate;
    const pickupTime = booking?.pickupTime;
    const phoneNumber = booking?.bookingDetails?.phoneNumber?.number
      ? `${booking?.bookingDetails?.phoneNumber?.code}-${booking?.bookingDetails?.phoneNumber?.number}`
      : "Not provided";
    const isAirportTransfer = booking?.pickup?.type === "airport" || booking?.dropoff?.type === "airport";

    const subject = `Limo Booking Confirmation - ${bookingRef}`;
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Limo Booking Confirmation - ${bookingRef}</title>
      <style>
        * { box-sizing: border-box; padding: 0; margin: 0; }
        body { font-family: 'Arial', sans-serif; }
        main { width: 600px; margin: 0 auto; border: 1px solid lightgray; padding: 20px }
        div, a, p, span, li { font-size: 15px; line-height: 24px; }
        a { color: black; text-decoration: none; display: block; }
        p { margin-bottom: 20px; }
        p.large { font-size: 18px }
        ul { margin: 0 0 15px 0; padding: 0; }
        li { list-style-type: none; margin: 0; padding: 0; }
        .bold { font-weight: 600; }
        .contact-links { margin-bottom: 20px; }
        .footer span { display: block; }
        @media screen and (max-width: 991px) { main { width: 100% } }
      </style>
    </head>
    <body>
      <main>
        <p class="salutation">Hi ${name},</p>
        <p>Thank you for booking your ${isAirportTransfer ? "airport transfer" : "chauffeur"} with us. Your payment of ${currency} ${amount} has been successfully processed and your booking is now confirmed.</p>

        <p class="bold large">Your Booking Details</p>
        <ul>
          <li>Booking Reference: <span>${bookingRef}</span></li>
          <li>Vehicle: <span>${vehicleName}</span></li>
          <li>Pickup Location: <span>${pickup}</span></li>
          ${hourlyRide ? `<li>Hours Booked: <span>${hoursBooked}</span></li>` : `<li>Dropoff location: <span>${dropoff}</span></li>`}
          <li>Pickup Date: <span>${pickupDate}</span></li>
          <li>Pickup Time: <span>${pickupTime}</span></li>
          <li>Phone Number: <span>${phoneNumber}</span></li>
        </ul>

        <p class="bold large">What happens next?</p>
        <p>Your chauffeur will be assigned 1 day before your trip and they'll contact you prior to your ${isAirportTransfer ? "flight time" : "pickup time"}. Our chauffeur will ${isAirportTransfer ? "track your flight and wait 60 minutes at the arrival area" : "wait 20 minutes outside the pickup address"} free of charge.</p>
        <p>If you need to make any changes or request additional services (extra stops, child seat, special requests), simply reply to this email or contact us using the details below.</p>

        <p class="bold large">Contact Us</p>
        <div class="contact-links">
          <a href="tel:971506045355"><span>Call Us: </span>+971 50 604 5355</a>
          <a href="mailto:${config.contactEmail}"><span>Email Us: </span>${config.contactEmail}</a>
          <a href="http://www.emirateslimo.com"><span>Our Website: </span>www.emirateslimo.com</a>
        </div>
        <p>Thank you for traveling with Emirates Limo. We look forward to providing you with a first-class, stress-free experience.</p>
        <div class="footer">
          <span>Warm regards,</span>
          <span>Emirates Limo Team</span>
          <span>www.emirateslimo.com</span>
        </div>
      </main>
    </body>
    </html>
  `;

    await sendEmail({ email, name, subject, htmlContent });
  };

  return { sendPaymentConfirmationEmailAdmin, sendPaymentConfirmationEmailCustomer };
}
