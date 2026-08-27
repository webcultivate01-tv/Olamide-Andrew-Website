import { env } from "../config/env.js";
import { verifyAuthToken } from "../utils/jwt.js";
import * as adminModel from "../models/admin.model.js";
import { AppError } from "../utils/app-error.js";

// Put this in front of any route that needs a logged in admin.
//
// It reads the JWT out of the cookie, checks it, then looks the admin up in
// MySQL again. Reading from the database matters: an account disabled a minute
// ago must stop working now, not whenever the token happens to expire.
//
// On success it puts the admin row on req.admin for the controller to use.
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies[env.cookie.name];

    if (!token) {
      throw new AppError("Authentication required. Please log in.", 401);
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      // Bad signature or expired.
      throw new AppError("Your session has expired. Please log in again.", 401);
    }

    const admin = await adminModel.findById(payload.id);
    if (!admin || !admin.is_active) {
      throw new AppError("Your session is no longer valid. Please log in again.", 401);
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};
