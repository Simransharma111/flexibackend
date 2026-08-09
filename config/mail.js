import nodemailer from "nodemailer";

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASSWORD EXISTS:",
  !!process.env.EMAIL_PASSWORD
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error(
      "EMAIL TRANSPORT ERROR:",
      error
    );
  } else {
    console.log(
      "EMAIL SERVER READY:",
      success
    );
  }
});

export default transporter;