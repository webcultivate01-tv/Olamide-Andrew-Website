import { z } from "zod";
import { CASE_STUDY_STATUSES } from "../models/case-study.model.js";

// Rules for the case study endpoints. Everything here is admin-only, but the
// values end up on the public website, so the checks are still strict: a
// summary with no end, or an image field pointing at someone else's server,
// would both show up on the homepage.

// Turns "Skyline Finance" into "skyline-finance". Exported because the
// controller falls back to it when the form leaves the slug blank, which is
// the normal case - the field is there for the rare time a specific URL is
// wanted, not something anyone should have to fill in.
export const slugify = (value) =>
  value
    .normalize("NFKD")
    // Drop accents, so "Café" becomes "cafe" rather than "caf".
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

// An optional text field. A field left blank arrives as "", which should be
// stored as NULL rather than an empty string, so a later "has a client?" check
// has one answer to look for instead of two.
const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null)
    .nullish()
    .transform((value) => value ?? null);

const title = z
  .string({ error: "Please give this case study a title." })
  .trim()
  .min(2, "Please give this case study a title.")
  .max(150, "Title must be 150 characters or fewer.");

// Left blank on the form nearly always; the controller derives it from the
// title instead. When it is filled in, it is normalised the same way, so a
// slug typed as "Skyline Finance" still becomes a usable one.
const slug = optionalText(180, "Slug").transform((value) =>
  value === null ? null : slugify(value)
);

const summary = z
  .string({ error: "Please write a short summary." })
  .trim()
  .min(10, "Please write at least 10 characters so the card has something to say.")
  .max(600, "Summary must be 600 characters or fewer.");

// Either a path on our own servers - an upload, or a file already in the
// website's public folder - or a full https URL. Anything else is rejected:
// a javascript: or data: value here would end up in an src attribute on the
// live site.
const imageUrl = optionalText(500, "Image").refine(
  (value) => value === null || /^\/[\w\-./]*$/.test(value) || /^https:\/\/\S+$/.test(value),
  "The image must be an uploaded file or an https:// address."
);

const imageAlt = optionalText(255, "Image description");

const tagline = optionalText(255, "Tagline");

// A comma-separated list of display labels ("Finance, Investment"), kept as
// typed rather than slugified — this is prose for a sidebar, not a filter
// key. Deduplicated case-insensitively, the same reasoning as blog tags:
// "Finance, finance" typed by accident is one category, not two.
const CATEGORIES_MAX = 500;
const categories = z
  .union([z.string(), z.array(z.string())])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return [];
    const parts = Array.isArray(value) ? value : value.split(",");

    const seen = new Set();
    const result = [];
    for (const part of parts) {
      const label = String(part).trim().replace(/\s+/g, " ").slice(0, 60);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(label);
    }
    return result;
  })
  .refine((value) => value.length <= 8, "A case study can have at most 8 categories.")
  .refine(
    (value) => value.join(", ").length <= CATEGORIES_MAX,
    "Those categories are too long altogether."
  );

// The paragraphs above the fold, blank-line separated — longer than the grid
// card's `summary`, so its own, higher limit.
const intro = optionalText(4000, "Introduction");

const BLOCK_TYPES = ["IMAGE", "COLOR", "TEXT"];
const BLOCK_LAYOUTS = ["FULL", "HALF"];
const BLOCK_VARIANTS = ["DEFAULT", "PROMISE"];

const blockImageUrl = optionalText(500, "Block image").refine(
  (value) => value === null || /^\/[\w\-./]*$/.test(value) || /^https:\/\/\S+$/.test(value),
  "The image must be an uploaded file or an https:// address."
);

const blockColorHex = optionalText(20, "Block colour").refine(
  (value) => value === null || /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value),
  "Colour must be a hex value like #2f6f4c."
);

// One block of the detail page's body. Which fields matter depends on
// `type` — an IMAGE block needs an image, a COLOR block needs a colour, a
// TEXT block needs body copy — checked below rather than with three separate
// schemas, so the admin form can post one uniform shape regardless of type.
const blockSchema = z
  .object({
    type: z.enum(BLOCK_TYPES, {
      error: `Block type must be one of: ${BLOCK_TYPES.join(", ")}.`,
    }),
    layout: z.enum(BLOCK_LAYOUTS).default("FULL"),
    // One of the study's own `categories` labels, or null for a block that
    // is not tied to any of them and so stays visible under every filter.
    // Not cross-checked against that list here - an admin can type the
    // category first and the block second, or the reverse, in one save.
    category: optionalText(60, "Block category"),
    variant: z.enum(BLOCK_VARIANTS).default("DEFAULT"),
    heading: optionalText(255, "Block heading"),
    body: optionalText(4000, "Block text"),
    imageUrl: blockImageUrl,
    imageAlt: optionalText(255, "Block image description"),
    colorHex: blockColorHex,
  })
  .refine((value) => value.type !== "IMAGE" || value.imageUrl, {
    message: "An image block needs an image.",
    path: ["imageUrl"],
  })
  .refine((value) => value.type !== "COLOR" || value.colorHex, {
    message: "A colour block needs a colour.",
    path: ["colorHex"],
  })
  .refine((value) => value.type !== "TEXT" || value.body, {
    message: "A text block needs some body copy.",
    path: ["body"],
  });

const blockList = z.array(blockSchema).max(40, "A case study can have at most 40 content blocks.");

const status = z.enum(CASE_STUDY_STATUSES, {
  error: `Status must be one of: ${CASE_STUDY_STATUSES.join(", ")}.`,
});

// Lowest first. Capped well below what anyone would type so the column cannot
// be handed a number MySQL would refuse.
const sortOrder = z.coerce
  .number({ error: "Display order must be a number." })
  .int("Display order must be a whole number.")
  .min(0, "Display order cannot be negative.")
  .max(9999, "Display order must be 9999 or less.");

export const createCaseStudySchema = z.object({
  title,
  slug,
  client: optionalText(150, "Client"),
  service: optionalText(150, "Service"),
  summary,
  imageUrl,
  imageAlt,
  // A new study starts as a draft unless the form says otherwise, so nothing
  // half-written can reach the website by being saved too early.
  status: status.default("DRAFT"),
  // Absent means "put it at the end", which the controller works out.
  sortOrder: sortOrder.optional(),
  tagline,
  categories,
  intro,
  // Absent means "no body yet" — a study can be created before its detail
  // page content exists.
  blocks: blockList.optional().default([]),
});

// Every field is optional here: the edit form sends the whole record, but a
// caller sending one field should be able to change that field alone. The
// controller merges whatever arrives over the row already in the database.
export const updateCaseStudySchema = z
  .object({
    title: title.optional(),
    slug: slug.optional(),
    client: optionalText(150, "Client").optional(),
    service: optionalText(150, "Service").optional(),
    summary: summary.optional(),
    imageUrl: imageUrl.optional(),
    imageAlt: imageAlt.optional(),
    status: status.optional(),
    sortOrder: sortOrder.optional(),
    tagline: tagline.optional(),
    categories: categories.optional(),
    intro: intro.optional(),
    // Absent leaves the existing blocks untouched; an explicit [] clears
    // them, the same "whatever was sent wins" rule every other field here
    // follows.
    blocks: blockList.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Nothing to update - no fields were sent."
  );

export const updateCaseStudyStatusSchema = z.object({ status });

// URL ids arrive as strings, so coerce - but only a whole positive number gets
// through, which means /case-studies/abc is rejected before it reaches a query.
export const caseStudyIdSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid case study id." })
    .int("Invalid case study id.")
    .positive("Invalid case study id."),
});

// The public route looks a study up by slug, so the same shape check applies
// there: only the characters slugify() can produce.
export const caseStudySlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Invalid case study address.")
    .max(180, "Invalid case study address.")
    .regex(/^[a-z0-9-]+$/, "Invalid case study address."),
});

// The query string on the admin list. Everything has a default, so
// GET /api/admin/case-studies with no parameters at all is valid.
export const listCaseStudiesSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  perPage: z.coerce.number().int().min(1).max(100).catch(20),
  // "ALL" is how the frontend says "no status filter"; it becomes undefined
  // here and the model then leaves the status condition out entirely.
  status: z
    .enum([...CASE_STUDY_STATUSES, "ALL"])
    .catch("ALL")
    .transform((value) => (value === "ALL" ? undefined : value)),
  search: z.string().trim().max(100).catch("").transform((value) => value || undefined),
});
