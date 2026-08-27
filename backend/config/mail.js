import nodemailer from "nodemailer";
import { env } from "./env.js";

// Is SMTP actually set up in .env?
const hasSmtp = Boolean(env.mail.host && env.mail.user);

if (!hasSmtp && env.isProduction) {
  throw new Error("MAIL_HOST and MAIL_USER are required when NODE_ENV=production.");
}

// True when we are only printing emails to the terminal.
export const isDevMailMode = !hasSmtp;

// With SMTP configured, send real email. Without it (a fresh checkout), use a
// transport that swallows the message so the OTP can be printed to the
// terminal instead. That keeps the reset flow testable before Gmail is set up.
export const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465, // port 465 = SSL, port 587 = STARTTLS
      auth: {
        user: env.mail.user,
        pass: env.mail.password,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });
