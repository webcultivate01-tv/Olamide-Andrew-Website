import { z } from "zod";
import { BLOG_POST_STATUSES } from "../models/blog-post.model.js";

// Rules for the blog endpoints. Everything here is admin-only, but the values
// end up on the public website, so the checks are still strict: an excerpt with
// no end, or a cover image pointing at someone else's server, would both show
// up on the blog index.

// Turns "Why Brands Fail" into "why-brands-fail". Exported because the
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
    .slice(0, 200);

// An optional text field. A field left blank arrives as "", which should be
// stored as NULL rather than an empty string, so a later "has an author?"
// check has one answer to look for instead of two.
const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null)
    .nullish()
    .transform((value) => value ?? null);

const title = z
  .string({ error: "Please give this post a title." })
  .trim()
  .min(2, "Please give this post a title.")
  .max(180, "Title must be 180 characters or fewer.");

// Left blank on the form nearly always; the controller derives it from the
// title instead. When it is filled in, it is normalised the same way, so a
// slug typed as "Why Brands Fail" still becomes a usable one.
const slug = optionalText(200, "Slug").transform((value) =>
  value === null ? null : slugify(value)
);

const excerpt = z
  .string({ error: "Please write a short excerpt." })
  .trim()
  .min(10, "Please write at least 10 characters so the card has something to say.")
  .max(400, "Excerpt must be 400 characters or fewer.");

// The body of the post, as Markdown. The ceiling is generous but not absent:
// MEDIUMTEXT holds far more than this, and a request that large is a mistake
// or an attack rather than an article.
const content = z
  .string({ error: "Please write the post." })
  .trim()
  .min(20, "Please write at least a couple of sentences.")
  .max(200000, "This post is too long to save. Please split it up.");

// Either a path on our own servers - an upload, or a file already in the
// website's public folder - or a full https URL. Anything else is rejected:
// a javascript: or data: value here would end up in an src attribute on the
// live site.
const coverImageUrl = optionalText(500, "Cover image").refine(
  (value) => value === null || /^\/[\w\-./]*$/.test(value) || /^https:\/\/\S+$/.test(value),
  "The cover image must be an uploaded file or an https:// address."
);

const coverImageAlt = optionalText(255, "Cover image description");

// One tag, in the shape a URL can carry: the same characters slugify()
// produces. The filter on the public blog is a ?tag= query, so a tag with a
// comma or a space in it would either break that or break the comma-joined
// column it is stored in.
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Tags arrive either as an array (the admin form) or as one comma-separated
 * string (a hand-written request). Both end up as the same lower-cased,
 * de-duplicated array, which the controller joins with commas for storage.
 */
const tags = z
  .union([z.string(), z.array(z.string())])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return [];
    const parts = Array.isArray(value) ? value : value.split(",");

    // A Set rather than an error: "Design, design" is one tag typed twice, and
    // rejecting it would be a worse answer than quietly keeping one.
    return [...new Set(parts.map((tag) => slugify(String(tag))).filter(Boolean))];
  })
  .refine((value) => value.length <= 8, "A post can have at most 8 tags.")
  .refine(
    (value) => value.every((tag) => tag.length <= 40 && TAG_PATTERN.test(tag)),
    "Tags must be words or hyphenated words, 40 characters or fewer."
  )
  // The column is 255 characters; eight 40-character tags would overflow it.
  .refine((value) => value.join(",").length <= 255, "Those tags are too long altogether.");

const status = z.enum(BLOG_POST_STATUSES, {
  error: `Status must be one of: ${BLOG_POST_STATUSES.join(", ")}.`,
});

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------

const BLOCK_TYPES = ["IMAGE", "COLOR", "TEXT"];
const BLOCK_LAYOUTS = ["FULL", "HALF"];
const BLOCK_VARIANTS = ["DEFAULT", "PROMISE"];

// Same two shapes coverImageUrl allows, and for the same reason.
const blockImageUrl = optionalText(500, "Block image").refine(
  (value) => value === null || /^\/[\w\-./]*$/.test(value) || /^https:\/\/\S+$/.test(value),
  "The image must be an uploaded file or an https:// address."
);

const blockColorHex = optionalText(20, "Block colour").refine(
  (value) => value === null || /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value),
  "Colour must be a hex value like #2f6f4c."
);

// What each block needs depends on what kind it is, so the type-specific
// requirements are refinements on the whole object rather than fields that
// are required outright.
const blockSchema = z
  .object({
    type: z.enum(BLOCK_TYPES, {
      error: `Block type must be one of: ${BLOCK_TYPES.join(", ")}.`,
    }),
    layout: z.enum(BLOCK_LAYOUTS).default("FULL"),
    // One of the admin's blog categories (categories.slug), or null for a
    // block not tied to any of them. Not cross-checked against that list
    // here - an admin can add the category first and the block second, or
    // the reverse, in one save. Purely organisational: unlike case studies,
    // the public post page does not filter blocks by it.
    category: optionalText(60, "Block category"),
    variant: z.enum(BLOCK_VARIANTS).default("DEFAULT"),
    heading: optionalText(255, "Block heading"),
    body: optionalText(4000, "Block text"),
    imageUrl: blockImageUrl,
    imageAlt: optionalText(255, "Block image description"),
    colorHex: blockColorHex,
  })
  .refine((block) => block.type !== "IMAGE" || block.imageUrl, {
    message: "An image block needs an image.",
    path: ["imageUrl"],
  })
  .refine((block) => block.type !== "COLOR" || block.colorHex, {
    message: "A colour block needs a colour.",
    path: ["colorHex"],
  })
  .refine((block) => block.type !== "TEXT" || block.body, {
    message: "A text block needs some body copy.",
    path: ["body"],
  });

const blockList = z
  .array(blockSchema)
  .max(40, "A post can have at most 40 content blocks.");

export const createBlogPostSchema = z.object({
  title,
  slug,
  excerpt,
  content,
  author: optionalText(150, "Author"),
  tags,
  coverImageUrl,
  coverImageAlt,
  // A new post starts as a draft unless the form says otherwise, so nothing
  // half-written can reach the website by being saved too early.
  status: status.default("DRAFT"),
  blocks: blockList.optional().default([]),
});

// Every field is optional here: the edit form sends the whole record, but a
// caller sending one field should be able to change that field alone. The
// controller merges whatever arrives over the row already in the database.
export const updateBlogPostSchema = z
  .object({
    title: title.optional(),
    slug: slug.optional(),
    excerpt: excerpt.optional(),
    content: content.optional(),
    author: optionalText(150, "Author").optional(),
    tags: tags.optional(),
    coverImageUrl: coverImageUrl.optional(),
    coverImageAlt: coverImageAlt.optional(),
    status: status.optional(),
    // Left out entirely means "leave the blocks alone"; an explicit [] is how
    // the form says "delete them all".
    blocks: blockList.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Nothing to update - no fields were sent."
  );

export const updateBlogPostStatusSchema = z.object({ status });

// URL ids arrive as strings, so coerce - but only a whole positive number gets
// through, which means /blog/abc is rejected before it reaches a query.
export const blogPostIdSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid post id." })
    .int("Invalid post id.")
    .positive("Invalid post id."),
});

// The public route looks a post up by slug, so the same shape check applies
// there: only the characters slugify() can produce.
export const blogPostSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Invalid post address.")
    .max(200, "Invalid post address.")
    .regex(/^[a-z0-9-]+$/, "Invalid post address."),
});

// One tag on a query string. `.catch("")` rather than an error: a bad tag in a
// URL should show the unfiltered list, not an error page.
const tagFilter = z
  .string()
  .trim()
  .toLowerCase()
  .max(40)
  .regex(TAG_PATTERN)
  .catch("")
  .transform((value) => value || undefined);

// The query string on the admin list. Everything has a default, so
// GET /api/admin/blog with no parameters at all is valid.
export const listBlogPostsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  perPage: z.coerce.number().int().min(1).max(100).catch(20),
  // "ALL" is how the frontend says "no status filter"; it becomes undefined
  // here and the model then leaves the status condition out entirely.
  status: z
    .enum([...BLOG_POST_STATUSES, "ALL"])
    .catch("ALL")
    .transform((value) => (value === "ALL" ? undefined : value)),
  tag: tagFilter,
  search: z.string().trim().max(100).catch("").transform((value) => value || undefined),
});

// The query string the website's blog index uses. No status - that route only
// ever returns published posts, and letting a visitor ask for drafts is
// exactly what it must not do.
export const listPublishedBlogPostsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  perPage: z.coerce.number().int().min(1).max(50).catch(12),
  tag: tagFilter,
});
