import { createInsuranceEmails } from "@travel-suite/backend-app/insurance-emails";
import { sendEmail } from "../utils/email.js";
import config from "../utils/config.js";

const { policyIssuedEmail, insurancePaymentCompletionEmail } = createInsuranceEmails({
  config,
  sendEmail,
  footerNote: "Underwritten by AXA.",
  upsells: [
    {
      title: "Book a Dummy Ticket",
      brand: "My Dummy Ticket",
      description: "A verifiable flight reservation with a real PNR for your visa file.",
      price: "AED 49",
      ctaLabel: "Book now",
      href: "https://www.mydummyticket.ae",
    },
    {
      title: "Get Visa Assistance",
      brand: "VisaWadi",
      description: "Schengen, UK, US and Saudi visas, handled end to end.",
      price: "AED 299",
      ctaLabel: "Get assistance",
      href: "https://www.visawadi.com/uae",
    },
  ],
});

export { policyIssuedEmail, insurancePaymentCompletionEmail };
