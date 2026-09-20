import { z } from "zod";

// Rules for the category endpoints. Every one of these is admin-only.

// Turns "Brand Strategy" into "brand-strategy". The controller falls back to
// this when the form leaves the slug blank, which is the normal case.
export const slugify = (value) =>
  value
    .normalize("NFKD")
    // Drop accents, so "Café" becomes "cafe" rather than "caf".
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const name = z
  .string({ error: "Please give this category a name." })
  .trim()
  .min(2, "Please give this category a name.")
  .max(100, "Name must be 100 characters or fewer.");

// Left blank on the form nearly always; the controller derives it from the
// name instead. When it is filled in, it is normalised the same way.
const slug = z
  .string()
  .trim()
  .max(120, "Slug must be 120 characters or fewer.")
  .transform((value) => (value ? slugify(value) : null))
  .nullish()
  .transform((value) => value ?? null);

// Which list a category belongs to. A category never changes list once made,
// so it is accepted on create only.
export const CATEGORY_TYPES = ["blog", "case_study"];

const type = z.enum(CATEGORY_TYPES, { error: "Category type must be blog or case_study." });

export const createCategorySchema = z.object({ name, slug, type: type.default("blog") });

export const updateCategorySchema = z
  .object({ name: name.optional(), slug: slug.optional() })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Nothing to update - no fields were sent."
  );

// URL ids arrive as strings, so coerce - but only a whole positive number gets
// through, which means /categories/abc is rejected before it reaches a query.
export const categoryIdSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid category id." })
    .int("Invalid category id.")
    .positive("Invalid category id."),
});

export const listCategoriesSchema = z.object({
  search: z.string().trim().max(100).catch("").transform((value) => value || undefined),
  // Left out, the admin list returns both kinds.
  type: type.optional().catch(undefined),
});

// The public list is always one kind; the blog's, unless asked otherwise.
export const listPublicCategoriesSchema = z.object({
  type: type.catch("blog"),
});
