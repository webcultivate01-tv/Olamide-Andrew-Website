import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

// Makes a random 6 digit code like "483921".
// crypto.randomInt is used instead of Math.random because Math.random is
// predictable, and a guessable OTP is no protection at all.
export const generateOtp = () => {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
};

// The OTP is hashed before it goes into MySQL, the same way a password is.
// The database never holds the digits themselves.
export const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

export const compareOtp = async (otp, otpHash) => {
  return bcrypt.compare(otp, otpHash);
};

// The moment this OTP stops being valid (10 minutes from now by default).
export const getOtpExpiry = () => {
  return new Date(Date.now() + env.otp.expiresInMinutes * 60 * 1000);
};
