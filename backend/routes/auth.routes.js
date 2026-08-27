import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  loginLimiter,
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

// All routes here start with /api/auth
//
// Read each line left to right: rate limit first, then validate the body,
// then run the controller.
const router = Router();

router.post("/login", loginLimiter, validateBody(loginSchema), authController.login);

router.post("/logout", authController.logout);

router.get("/me", requireAuth, authController.me);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/verify-otp",
  verifyOtpLimiter,
  validateBody(verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

export default router;
