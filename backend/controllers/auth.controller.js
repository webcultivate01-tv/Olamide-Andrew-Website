import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import * as otpService from "../services/otp.service.js";
import * as adminModel from "../models/admin.model.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Controllers handle the request and the response only. All the real logic
// lives in the services. Each one wraps its work in try/catch and passes any
// error to next(), which sends it to the error middleware.

// Cookie settings. These must be identical when setting and when clearing,
// or the browser will keep the old cookie.
const cookieOptions = {
  // httpOnly means JavaScript in the browser cannot read the token, so an XSS
  // bug on the admin panel cannot steal the session.
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  path: "/",
};

const setAuthCookie = (res, token) => {
  // Expire the cookie at the same moment the token expires, by reading the
  // expiry out of the token itself.
  const decoded = jwt.decode(token);
  res.cookie(env.cookie.name, token, {
    ...cookieOptions,
    expires: new Date(decoded.exp * 1000),
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(env.cookie.name, cookieOptions);
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { token, admin } = await authService.login(email, password);

    setAuthCookie(res, token);

    return sendSuccess(res, 200, "Login successful", { admin });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return sendSuccess(res, 200, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me  (requires login)
// The frontend calls this to ask "am I really logged in?". The backend is the
// only thing allowed to answer that question.
export const me = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Authenticated", adminModel.publicAdmin(req.admin));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    await otpService.requestOtp(email);

    // Always the same reply, registered email or not. Saying "no such account"
    // would let anyone check which emails exist.
    return sendSuccess(res, 200, "If the email is registered, an OTP has been sent.");
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const { resetToken, expiresIn } = await otpService.verifyOtp(email, otp);

    return sendSuccess(res, 200, "OTP verified successfully.", { resetToken, expiresIn });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError("Passwords do not match.", 400, {
        confirmPassword: "Passwords do not match.",
      });
    }

    await authService.resetPassword(resetToken, newPassword);

    // The password changed, so any cookie this browser is holding is stale.
    clearAuthCookie(res);

    return sendSuccess(res, 200, "Password reset successfully.");
  } catch (error) {
    next(error);
  }
};
