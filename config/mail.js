import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn("RESEND_API_KEY is not configured.");
}

const resend = apiKey ? new Resend(apiKey) : null;

export const sendEmail = async ({ from, to, subject, text, html }) => {
  if (!resend) {
    throw new Error("Resend is not configured. Check RESEND_API_KEY.");
  }

  const result = await resend.emails.send({
    from: from || process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    console.error("RESEND EMAIL ERROR:", result.error);
    throw new Error("Email delivery request failed.");
  }

  return result.data;
};

export default sendEmail;
