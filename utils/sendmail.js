import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export default async function sendEmailTo(email, token) {
  const host = process.env.HOSTNAME;
  const verificationLink = `${host}/api/users/verify/${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: "ciprianpaulr@outlook.com",
      pass: "srtjstrsrtjsrtEGE",
    },
  });

  const mailOptions = {
    from: "ciprianpaulr@outlook.com",
    to: email,
    subject: "Hello",
    text: `Hello from phoneBookApp. Use this link to validate your account: ${verificationLink}`,
    html: `Hello from <strong>phoneBookApp</strong><br><a href="${verificationLink}">${verificationLink}</a> to validate your account.<br>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
}
