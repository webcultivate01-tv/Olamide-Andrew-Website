import { z } from "zod";

// Rules for what each request body must look like. Zod checks the shape and
// gives back a message we can show the user directly.

const email = z
  .string({ error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .email("Please provide a valid email address.")
  .toLowerCase();

// Rules for a NEW password: at least 8 characters, with an uppercase letter,
// a lowercase letter, a number and a symbol.
const newPassword = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

export const loginSchema = z.object({
  email,
  // Login only checks that a password was typed. We must NOT apply the rules
  // above here - that would tell an attacker which guesses are even possible.
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const verifyOtpSchema = z.object({
  email,
  otp: z
    .string({ error: "OTP is required." })
    .trim()
    .regex(/^\d{6}$/, "Please enter the 6-digit OTP from your email."),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string({ error: "Reset token is required." }).min(1, "Reset token is required."),
  newPassword,
  confirmPassword: z
    .string({ error: "Please confirm your new password." })
    .min(1, "Please confirm your new password."),
});
