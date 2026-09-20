import { z } from "zod";

// Rules for the subscriber endpoints. The public POST is the only place on
// this API a stranger can write to, so its schema is the strictest thing
// here: anything not described below never reaches MySQL.

export const subscribeSchema = z.object({
  email: z
    .string({ error: "Please enter your email address." })
    .trim()
    .min(1, "Please enter your email address.")
    .max(255, "Email must be 255 characters or fewer.")
    .email("Please provide a valid email address.")
    .toLowerCase(),
});

// URL ids arrive as strings, so coerce - but only a whole positive number gets
// through, which means /subscribers/abc is rejected before it reaches a query.
export const subscriberIdSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid subscriber id." })
    .int("Invalid subscriber id.")
    .positive("Invalid subscriber id."),
});

// Shared by the list and the export - both filter the same way, the export
// just skips paging. A malformed month (bad shape, or one search would never
// produce) falls back to undefined rather than a 400: the filter is dropped
// and the request still answers, the same way an empty search does.
const subscriberFilters = {
  search: z.string().trim().max(100).catch("").transform((value) => value || undefined),
  month: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .catch(undefined),
};

// The query string on the admin list. Everything has a default, so
// GET /api/admin/subscribers with no parameters at all is valid.
export const listSubscribersSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  perPage: z.coerce.number().int().min(1).max(100).catch(20),
  ...subscriberFilters,
});

// The query string on the CSV export - the same filters, no paging.
export const exportSubscribersSchema = z.object(subscriberFilters);
