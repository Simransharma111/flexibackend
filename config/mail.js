import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("RESEND CONFIG ERROR: RESEND_API_KEY is missing.");
}

const resend = apiKey ? new Resend(apiKey) : null;

const sendEmail = async ({
  from,
  to,
  subject,
  text,
  html,
}) => {
  if (!resend) {
    throw new Error(
      "Resend is not configured. Check RESEND_API_KEY."
    );
  }

  const sender = from || process.env.EMAIL_FROM;

  if (!sender) {
    throw new Error(
      "EMAIL_FROM is missing from the environment."
    );
  }

  try {
    const result = await resend.emails.send({
      from: sender,
      to,
      subject,
      text,
      html,
    });

    if (result.error) {
      console.error("RESEND EMAIL ERROR:", {
        name: result.error.name,
        message: result.error.message,
        statusCode: result.error.statusCode,
      });

      throw new Error(
        `Resend rejected the email: ${result.error.message}`
      );
    }

    console.log("RESEND EMAIL ACCEPTED:", {
      id: result.data?.id,
    });

    return result.data;
  } catch (error) {
    console.error("EMAIL SENDING ERROR:", {
      name: error?.name,
      message: error?.message,
      statusCode: error?.statusCode,
    });

    throw error;
  }
};

export { sendEmail };
export default sendEmail;
