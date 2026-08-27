import * as adminModel from "../models/admin.model.js";
import * as otpModel from "../models/otp.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAuthToken, verifyResetToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";

// Login and password reset logic.

export const login = async (email, password) => {
  const admin = await adminModel.findByEmail(email);

  // Same message whether the email is wrong or the password is wrong. If we
  // said "no account with that email", anyone could use the login form to
  // find out which emails are registered.
  if (!admin) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isCorrect = await comparePassword(password, admin.password_hash);
  if (!isCorrect) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!admin.is_active) {
    throw new AppError("This account has been deactivated.", 403);
  }

  return {
    token: signAuthToken(admin),
    admin: adminModel.publicAdmin(admin),
  };
};

// Step 3 of the forgot password flow: set the new password.
export const resetPassword = async (resetToken, newPassword) => {
  const invalidToken = new AppError(
    "This password reset request is invalid or has expired. Please start again.",
    400
  );

  let payload;
  try {
    payload = verifyResetToken(resetToken);
  } catch {
    // Wrong signature, or more than 15 minutes old.
    throw invalidToken;
  }

  // The OTP row that allowed this token must still exist and be marked used.
  // It gets deleted below, which is what makes a reset token one-time-only.
  const otpRecord = await otpModel.findOtpById(payload.otpId);
  if (!otpRecord || otpRecord.admin_id !== payload.id || !otpRecord.is_used) {
    throw invalidToken;
  }

  const admin = await adminModel.findById(payload.id);
  if (!admin || !admin.is_active) {
    throw invalidToken;
  }

  const passwordHash = await hashPassword(newPassword);
  await adminModel.updatePassword(admin.id, passwordHash);

  // Clear every OTP for this admin, including the one just used, so the reset
  // token cannot be sent a second time.
  await otpModel.deleteAllForAdmin(admin.id);
};
