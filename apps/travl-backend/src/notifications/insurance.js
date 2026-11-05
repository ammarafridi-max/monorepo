import { createInsuranceEmails } from "@travel-suite/backend-app/insurance-emails";
import { sendEmail } from "../utils/email.js";
import config from "../utils/config.js";

const {
  policyIssuedEmail,
  insurancePaymentCompletionEmail,
  insurancePaymentReminderEmail,
} = createInsuranceEmails({
  config,
  sendEmail,
  theme: { primaryColor: "#0d6a66", linkColor: "#0d6a66" },
  claimsPath: "/claims",
  footerNote: "Underwritten by AXA. Travl Technologies LLC.",
  upsells: [
    {
      title: "Get Visa Assistance",
      brand: "VisaWadi",
      description: "Schengen, UK, US and Saudi visas, handled end to end.",
      price: "AED 299",
      ctaLabel: "Get assistance",
      href: "https://www.visawadi.com/uae",
    },
    {
      title: "Book a Dummy Ticket",
      brand: "Dummy Ticket 365",
      description: "A verifiable flight reservation with a real PNR for your visa file.",
      price: "USD 13",
      ctaLabel: "Book now",
      href: "https://www.dummyticket365.com",
    },
  ],
});

export { policyIssuedEmail, insurancePaymentCompletionEmail, insurancePaymentReminderEmail };
