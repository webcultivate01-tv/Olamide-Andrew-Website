import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Two kinds of token, signed with two different secrets:
//
//   auth token  -> proves you are logged in, lives in the cookie, valid 1 day
//   reset token -> proves you passed the OTP check, valid 15 minutes
//
// Because the secrets are different, a reset token can never be used as a
// login token, or the other way round.

export const signAuthToken = (admin) => {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

// Throws if the token is invalid or expired, so always call inside try/catch.
export const verifyAuthToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

// otpId links the token to the exact OTP row that allowed it, so the reset
// step can check that row is still there before changing the password.
export const signResetToken = (adminId, otpId) => {
  return jwt.sign({ id: adminId, otpId }, env.resetToken.secret, {
    expiresIn: env.resetToken.expiresIn,
  });
};

export const verifyResetToken = (token) => {
  return jwt.verify(token, env.resetToken.secret);
};
