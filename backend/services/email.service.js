import { transporter, isDevMailMode } from "../config/mail.js";
import { env } from "../config/env.js";

// Sending email happens here and nowhere else, so the rest of the app never
// has to know about Nodemailer.

export const sendOtpEmail = async (to, otp) => {
  const minutes = env.otp.expiresInMinutes;

  const text = `Hello Admin,

Your password reset OTP is:

${otp}

This OTP will expire in ${minutes} minutes.

If you did not request a password reset, please ignore this email.

Regards,
Admin System`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#101010;line-height:1.6">
      <p>Hello Admin,</p>
      <p>Your password reset OTP is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#17395a;margin:24px 0">${otp}</p>
      <p>This OTP will expire in <strong>${minutes} minutes</strong>.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p style="margin-top:32px">Regards,<br />Admin System</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: "Password Reset OTP",
    text,
    html,
  });

  // When SMTP is not set up the email goes nowhere, so print the code here
  // instead. Without this you could not test the reset flow at all.
  if (isDevMailMode) {
    console.log("\n----------------------------------------");
    console.log(" SMTP not configured - email NOT sent.");
    console.log(" To:  " + to);
    console.log(" OTP: " + otp);
    console.log(" Valid for " + minutes + " minutes.");
    console.log("----------------------------------------\n");
  }
};
