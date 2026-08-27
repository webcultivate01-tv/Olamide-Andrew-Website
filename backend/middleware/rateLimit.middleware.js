import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Rate limits stop someone hammering the auth endpoints to guess a password
// or an OTP.
//
// Outside production the limits are multiplied, so clicking through the flow
// by hand while developing does not lock you out.
const multiplier = env.isProduction ? 1 : 20;

const createLimiter = ({ minutes, max, message, countFailuresOnly = false }) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max * multiplier,
    skipSuccessfulRequests: countFailuresOnly,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Same response shape as every other error from this API.
    handler: (req, res) => {
      res.status(429).json({ success: false, message });
    },
  });
};

// Only failed logins count, so a busy admin who keeps logging in is fine.
export const loginLimiter = createLimiter({
  minutes: 15,
  max: 5,
  countFailuresOnly: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

export const forgotPasswordLimiter = createLimiter({
  minutes: 15,
  max: 5,
  message: "Too many password reset requests. Please try again later.",
});

export const verifyOtpLimiter = createLimiter({
  minutes: 15,
  max: 10,
  message: "Too many OTP attempts. Please request a new code and try again.",
});

export const resetPasswordLimiter = createLimiter({
  minutes: 15,
  max: 10,
  message: "Too many password reset attempts. Please try again later.",
});

// A wide limit for everything else.
export const globalLimiter = createLimiter({
  minutes: 15,
  max: 300,
  message: "Too many requests. Please slow down and try again shortly.",
});

// The public enquiry form. This is the one endpoint a stranger can write to,
// so the limit is tight: a real visitor sends one message, not five.
// Successful submissions count too - unlike login, a flood of *valid* spam is
// exactly what this is here to stop.
export const enquiryLimiter = createLimiter({
  minutes: 15,
  max: 5,
  message: "Too many enquiries sent from this connection. Please try again in a little while.",
});
