import { logger } from "@travel-suite/utils";
import config from "./config.js";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_SENDER = { name: "Emirates Limo", email: config.contactEmail };

const getHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "api-key": config.brevoApiKey,
});

/**
 * Sends one transactional email.
 *
 * Returns a result instead of throwing, and returns the SAME result shape in
 * every environment. It used to throw in development and return false in
 * production, which meant the one failure path that matters (a paid booking
 * whose confirmation never sent) behaved differently in the environment where
 * you would actually test it. Callers must inspect `ok`; the caller decides
 * what a failed send means, this function never decides for them.
 *
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendEmail({
  email,
  name,
  subject,
  htmlContent,
  textContent,
}) {
  try {
    if (!config.brevoApiKey) {
      logger.warn("Email skipped because BREVO_API_KEY is missing", {
        email,
        subject,
      });
      return { ok: false, error: "BREVO_API_KEY is not configured" };
    }

    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        sender: BREVO_SENDER,
        to: [{ email, name }],
        subject,
        textContent,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Brevo email request failed (${res.status}): ${body || "No response body"}`,
      );
    }

    return { ok: true };
  } catch (err) {
    const error = err?.message ? String(err.message) : String(err);
    logger.error("Email sending failed", { email, subject, error });
    return { ok: false, error };
  }
}
