import { z } from "zod";
import { ENQUIRY_STATUSES } from "../models/enquiry.model.js";

// Rules for the enquiry endpoints. The public POST is the only place on this
// API a stranger can write to, so its schema is the strictest thing here:
// anything not described below never reaches MySQL.

// An optional text field on the form. A field left blank arrives as "", which
// is not the same thing as "not provided" - both should end up as NULL in the
// database rather than an empty string, so that a later "has a phone number?"
// check has one answer to look for instead of two.
const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null)
    .nullish()
    .transform((value) => value ?? null);

export const createEnquirySchema = z.object({
  name: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(2, "Please enter your name.")
    .max(150, "Name must be 150 characters or fewer."),

  email: z
    .string({ error: "Please enter your email address." })
    .trim()
    .min(1, "Please enter your email address.")
    .max(255, "Email must be 255 characters or fewer.")
    .email("Please provide a valid email address.")
    .toLowerCase(),

  // Deliberately loose. Phone numbers differ far too much between countries to
  // pattern-match safely, so this only rejects text that is clearly not one.
  phone: optionalText(30, "Phone number").refine(
    (value) => value === null || /^[\d\s+()./-]{6,30}$/.test(value),
    "Please enter a valid phone number."
  ),

  company: optionalText(150, "Company"),
  subject: optionalText(255, "Subject"),
  service: optionalText(150, "Service"),

  message: z
    .string({ error: "Please tell me about your project." })
    .trim()
    .min(10, "Please write at least 10 characters so I know what you need.")
    // Long enough for a real brief, short enough that nobody can post a novel.
    // express.json's 10kb body limit is the backstop behind this.
    .max(5000, "Message must be 5000 characters or fewer."),
});

export const updateStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES, {
    error: `Status must be one of: ${ENQUIRY_STATUSES.join(", ")}.`,
  }),
});

// URL ids arrive as strings, so coerce - but only a whole positive number gets
// through, which means a request for /enquiries/abc is rejected before it can
// reach a query.
export const enquiryIdSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid enquiry id." })
    .int("Invalid enquiry id.")
    .positive("Invalid enquiry id."),
});

// The query string on the admin list. Everything has a default, so
// GET /api/admin/enquiries with no parameters at all is valid.
export const listEnquiriesSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  // Capped so one request cannot ask for the entire table at once.
  perPage: z.coerce.number().int().min(1).max(100).catch(20),
  // "ALL" is how the frontend says "no status filter"; it becomes undefined
  // here and the model then leaves the status condition out entirely.
  status: z
    .enum([...ENQUIRY_STATUSES, "ALL"])
    .catch("ALL")
    .transform((value) => (value === "ALL" ? undefined : value)),
  search: z.string().trim().max(100).catch("").transform((value) => value || undefined),
});
