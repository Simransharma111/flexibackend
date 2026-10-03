import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  family: 4,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("EMAIL SMTP ERROR:", error);
  } else {
    console.log("EMAIL SMTP READY:", success);
  }
});

export default transporter;