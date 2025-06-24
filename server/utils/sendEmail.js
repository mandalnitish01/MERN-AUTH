import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Your email host (e.g., smtp.gmail.com)
    service: process.env.SMTP_SERVICE, // Your email service (e.g., Gmail, Outlook)
    port: process.env.SMTP_PORT, // Your email port (e.g., 587 for TLS)
    auth: {
      user: process.env.SMTP_MAIL, // Your email address
      pass: process.env.SMTP_PASSWORD, // Your email password or app password
    },
  });
  
  const option = {
    from: process.env.SMTP_MAIL, // Sender address
    to: email, // List of recipients
    subject, // Subject line
    html: message, // HTML body (optional)
  }
  await transporter.sendMail(option, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      throw new Error("Email sending failed");
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });

  
};
