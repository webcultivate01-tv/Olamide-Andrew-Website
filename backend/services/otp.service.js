import { env } from "../config/env.js";
import * as adminModel from "../models/admin.model.js";
import * as otpModel from "../models/otp.model.js";
import { generateOtp, hashOtp, compareOtp, getOtpExpiry } from "../utils/otp.js";
import { signResetToken } from "../utils/jwt.js";
import { sendOtpEmail } from "./email.service.js";
import { AppError } from "../utils/app-error.js";

// The "forgot password" OTP logic.

// Extra limit on top of the IP rate limiter, counted per account. It stops
// someone flooding one inbox by sending requests from different IPs.
const MAX_REQUESTS = 5;
const WINDOW_MINUTES = 15;

// Step 1: the admin asks for a code.
//
// Important: this function never tells the caller whether the email exists.
// It just stops quietly. The controller replies with the same message either
// way, so nobody can use this endpoint to find out which emails are registered.
export const requestOtp = async (email) => {
  const admin = await adminModel.findByEmail(email);

  if (!admin || !admin.is_active) {
    return;
  }

  const recentCount = await otpModel.countRecentOtps(admin.id, WINDOW_MINUTES);
  if (recentCount >= MAX_REQUESTS) {
    return;
  }

  // Delete the old code first, so only the newest email can ever work.
  await otpModel.deleteAllForAdmin(admin.id);

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await otpModel.createOtp(admin.id, otpHash, getOtpExpiry());
  await sendOtpEmail(admin.email, otp);
};

// Step 2: the admin types the code in.
//
// If it is correct we return a short lived reset token. That token is what
// allows the password to be changed. We do not simply trust the email address
// the browser sends to /reset-password, otherwise anyone could reset anyone.
export const verifyOtp = async (email, otp) => {
  const admin = await adminModel.findByEmail(email);
  if (!admin || !admin.is_active) {
    throw new AppError("Invalid or expired OTP.", 400);
  }

  const record = await otpModel.findLatestUnused(admin.id);
  if (!record) {
    throw new AppError("Invalid or expired OTP.", 400);
  }

  // Has it expired?
  if (new Date(record.expires_at).getTime() <= Date.now()) {
    throw new AppError("Invalid or expired OTP.", 400);
  }

  // Too many wrong guesses already?
  if (record.attempts >= env.otp.maxAttempts) {
    throw new AppError("Too many incorrect attempts. Please request a new OTP.", 429);
  }

  const isCorrect = await compareOtp(otp, record.otp_hash);

  if (!isCorrect) {
    await otpModel.increaseAttempts(record.id);

    const attemptsLeft = env.otp.maxAttempts - (record.attempts + 1);
    if (attemptsLeft <= 0) {
      throw new AppError("Too many incorrect attempts. Please request a new OTP.", 429);
    }
    throw new AppError(`Invalid or expired OTP. ${attemptsLeft} attempt(s) remaining.`, 400);
  }

  // Correct. Mark it used so the same code cannot be verified twice.
  const wasMarked = await otpModel.markAsUsed(record.id);
  if (!wasMarked) {
    throw new AppError("Invalid or expired OTP.", 400);
  }

  return {
    resetToken: signResetToken(admin.id, record.id),
    expiresIn: env.resetToken.expiresIn,
  };
};
