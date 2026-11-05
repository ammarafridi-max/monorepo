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
      brand: "The Dummy Ticket AE",
      description: "A verifiable flight reservation with a real PNR for your visa file.",
      price: "AED 49",
      ctaLabel: "Book now",
      href: "https://www.thedummyticket.ae",
    },
  ],
});

export { policyIssuedEmail, insurancePaymentCompletionEmail };
