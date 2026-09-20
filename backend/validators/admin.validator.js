import { z } from "zod";

// Rules for the admin's own profile. There is only ever one admin account, so
// nothing here touches role or status - just the things a person can actually
// tell you about themselves.

const name = z
  .string({ error: "Please enter your name." })
  .trim()
  .min(1, "Please enter your name.")
  .max(150, "Name must be 150 characters or fewer.");

const email = z
  .string({ error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .email("Please provide a valid email address.")
  .toLowerCase();

// Set by the upload endpoint, or cleared with null to fall back to the
// initials shown when there is no photo.
const avatarUrl = z
  .string()
  .trim()
  .max(500, "Image must be 500 characters or fewer.")
  .nullish()
  .transform((value) => value || null)
  .refine(
    (value) => value === null || /^\/uploads\/admins\/[\w-]+\.\w+$/.test(value),
    "Invalid avatar image."
  );

export const updateProfileSchema = z.object({
  name,
  email,
  avatarUrl,
});

// Rules for a NEW password: at least 8 characters, with an uppercase letter,
// a lowercase letter, a number and a symbol. Kept identical to the
// forgot-password flow's rule so both paths accept the same passwords.
const newPassword = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

export const changePasswordSchema = z.object({
  newPassword,
  confirmPassword: z
    .string({ error: "Please confirm your new password." })
    .min(1, "Please confirm your new password."),
});
