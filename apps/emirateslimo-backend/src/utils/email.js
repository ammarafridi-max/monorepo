import { createBrandMailer } from "@travel-suite/backend-app/email";
import config from "./config.js";

export const { sendEmail } = createBrandMailer({
  config,
  senderEmail: config.contactEmail,
});
