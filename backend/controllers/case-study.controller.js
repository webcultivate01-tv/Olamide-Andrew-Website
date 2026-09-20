import fs from "node:fs/promises";
import path from "node:path";
import * as caseStudyModel from "../models/case-study.model.js";
import { CASE_STUDY_STATUSES } from "../models/case-study.model.js";
import { slugify } from "../validators/case-study.validator.js";
import { uploadsDir, caseStudyUploadsDir } from "../middleware/upload.middleware.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Everything the case study feature does.
//
// The first two handlers are public - they are what the website's
// /case-studies page reads - and they only ever return published rows. All the
// rest sit behind requireAuth on the /api/admin router.

// The column holds "Finance, Investment"; everything above the model works
// with an array. Empty and NULL both mean "no categories".
const toCategoryArray = (value) =>
  value
    ? value
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean)
    : [];

// A database row is snake_case and carries MySQL Date objects. The panel and
// the website both want camelCase and ISO strings, so every response goes
// through here.
//
// `blocks` is only on the row for the single-study lookups - the list
// queries never attach it - so it is only added to the response when it is
// really there, the same reasoning blog posts use for `content`.
const toApiCaseStudy = (row) => ({
  id: row.id,
  title: row.title,
  tagline: row.tagline,
  slug: row.slug,
  client: row.client,
  service: row.service,
  summary: row.summary,
  categories: toCategoryArray(row.categories),
  intro: row.intro,
  imageUrl: row.image_url,
  imageAlt: row.image_alt,
  status: row.status,
  sortOrder: row.sort_order,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(row.blocks !== undefined ? { blocks: row.blocks.map(toApiBlock) } : {}),
});

const toApiBlock = (row) => ({
  id: row.id,
  type: row.type,
  layout: row.layout,
  category: row.category,
  variant: row.variant,
  heading: row.heading,
  body: row.body,
  imageUrl: row.image_url,
  imageAlt: row.image_alt,
  colorHex: row.color_hex,
});

// Finds a slug nothing else is using: the one asked for, or that with -2, -3
// and so on after it. Two studies for the same client - "Rebrand" twice - is a
// realistic mistake, and it should not be an error the admin has to solve.
const uniqueSlug = async (wanted, excludeId = null) => {
  const base = wanted || "case-study";

  if (!(await caseStudyModel.slugExists(base, excludeId))) {
    return base;
  }

  // A ceiling rather than a while(true): if something is badly wrong, this
  // should fail with a message and not spin against the database forever.
  for (let suffix = 2; suffix <= 50; suffix++) {
    const candidate = `${base.slice(0, 176)}-${suffix}`;
    if (!(await caseStudyModel.slugExists(candidate, excludeId))) {
      return candidate;
    }
  }

  throw new AppError("Too many case studies share this title. Please change it slightly.", 409);
};

// Only images this API wrote are ever deleted, and only ones that are really
// inside the uploads folder. image_url can also point at a file in the
// website's own public folder, which is not ours to remove.
//
// Images now live one folder deeper - uploads/case-studies/<slug>/<file> -
// so this resolves the whole remainder of the path, not just the basename.
const removeUploadedImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/case-studies/")) return;

  const relative = imageUrl.slice("/uploads/case-studies/".length);
  const target = path.resolve(caseStudyUploadsDir, relative);

  // Resolving and checking the result is still inside the folder is what
  // stops a "../../" in the remainder from climbing out of it.
  const base = path.resolve(caseStudyUploadsDir) + path.sep;
  if (!target.startsWith(base)) return;

  // A missing file is fine - the row is going either way, and a failed delete
  // must not fail the request.
  await fs.unlink(target).catch(() => {});
};

// Array in, comma column out — the shape createCaseStudy/updateCaseStudy's
// model layer expects, and the reverse of toCategoryArray above.
const toCategoryColumn = (categories) => (categories.length ? categories.join(", ") : null);

// Attaches a study's ordered blocks to the row before it goes through
// toApiCaseStudy, which only serialises them when the key is present.
const withBlocks = async (study) => {
  if (!study) return study;
  const blocks = await caseStudyModel.findBlocksByCaseStudyId(study.id);
  return { ...study, blocks };
};

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// GET /api/case-studies
//
// No login, no paging: the website's grid shows the whole published portfolio,
// in the order the admin arranged it.
export const listPublishedCaseStudies = async (req, res, next) => {
  try {
    const rows = await caseStudyModel.findPublished();

    return sendSuccess(res, 200, "Case studies loaded.", {
      caseStudies: rows.map(toApiCaseStudy),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/case-studies/:slug
//
// A draft answers 404 here rather than 403. Whether an unpublished study
// exists is not something a stranger should be able to find out.
export const getPublishedCaseStudy = async (req, res, next) => {
  try {
    const study = await caseStudyModel.findPublishedBySlug(req.validParams.slug);

    if (!study) {
      throw new AppError("Case study not found.", 404);
    }

    return sendSuccess(res, 200, "Case study loaded.", {
      caseStudy: toApiCaseStudy(await withBlocks(study)),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/case-studies?page=&perPage=&status=&search=
export const listCaseStudies = async (req, res, next) => {
  try {
    const { page, perPage, status, search } = req.validQuery;
    const offset = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      caseStudyModel.findCaseStudies({ status, search, limit: perPage, offset }),
      caseStudyModel.countCaseStudies({ status, search }),
    ]);

    return sendSuccess(res, 200, "Case studies loaded.", {
      caseStudies: rows.map(toApiCaseStudy),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/case-studies/stats
export const getCaseStudyStats = async (req, res, next) => {
  try {
    const rows = await caseStudyModel.countByStatus();

    // GROUP BY only returns statuses something is sitting in, so start both at
    // zero and let the counts overwrite them.
    const byStatus = Object.fromEntries(CASE_STUDY_STATUSES.map((status) => [status, 0]));
    let total = 0;

    for (const row of rows) {
      byStatus[row.status] = row.total;
      total += row.total;
    }

    return sendSuccess(res, 200, "Stats loaded.", { total, byStatus });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/case-studies/:id
//
// By id, and drafts included - this is what the edit form loads.
export const getCaseStudy = async (req, res, next) => {
  try {
    const study = await caseStudyModel.findById(req.validParams.id);

    if (!study) {
      throw new AppError("Case study not found.", 404);
    }

    return sendSuccess(res, 200, "Case study loaded.", {
      caseStudy: toApiCaseStudy(await withBlocks(study)),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/case-studies
export const createCaseStudy = async (req, res, next) => {
  try {
    const body = req.body;

    // The slug is derived from the title unless one was typed, then made
    // unique either way.
    const slug = await uniqueSlug(body.slug || slugify(body.title));

    // published_at is the moment it first went live. Creating a draft leaves
    // it null until the day it is published.
    const publishedAt = body.status === "PUBLISHED" ? new Date() : null;

    // No order given means "put it after everything else", which is what the
    // admin means when they add a study and do not think about ordering.
    const sortOrder = body.sortOrder ?? (await caseStudyModel.nextSortOrder());

    const id = await caseStudyModel.createCaseStudy({
      ...body,
      slug,
      sortOrder,
      publishedAt,
      categories: toCategoryColumn(body.categories),
    });

    await caseStudyModel.replaceBlocks(id, body.blocks);

    const study = await caseStudyModel.findById(id);

    return sendSuccess(res, 201, "Case study created.", {
      caseStudy: toApiCaseStudy(await withBlocks(study)),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/case-studies/:id
export const updateCaseStudy = async (req, res, next) => {
  try {
    const { id } = req.validParams;
    const body = req.body;

    const existing = await caseStudyModel.findById(id);
    if (!existing) {
      throw new AppError("Case study not found.", 404);
    }

    // Whatever was sent wins; everything else keeps the value it has. This is
    // why the model can do a full UPDATE without needing to know which fields
    // the form actually touched.
    //
    // The nullable fields are compared against undefined rather than using ??,
    // because null is a real value here: it is how the form says "clear this".
    const merged = {
      title: body.title ?? existing.title,
      client: body.client !== undefined ? body.client : existing.client,
      service: body.service !== undefined ? body.service : existing.service,
      summary: body.summary ?? existing.summary,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.image_url,
      imageAlt: body.imageAlt !== undefined ? body.imageAlt : existing.image_alt,
      status: body.status ?? existing.status,
      sortOrder: body.sortOrder ?? existing.sort_order,
      tagline: body.tagline !== undefined ? body.tagline : existing.tagline,
      categories:
        body.categories !== undefined ? toCategoryColumn(body.categories) : existing.categories,
      intro: body.intro !== undefined ? body.intro : existing.intro,
    };

    // An explicit slug replaces the old one. Retitling a study does *not*
    // silently move its address once it is live - that would break every link
    // to it - so the slug only follows the title while it is still a draft.
    const wantedSlug =
      body.slug ||
      (existing.status === "DRAFT" && body.title ? slugify(merged.title) : existing.slug);

    merged.slug = await uniqueSlug(wantedSlug, id);

    // First publish stamps the date. Unpublishing and publishing again keeps
    // the original, so the record does not rewrite its own history.
    merged.publishedAt =
      merged.status === "PUBLISHED" && !existing.published_at
        ? new Date()
        : existing.published_at;

    await caseStudyModel.updateCaseStudy(id, merged);

    // Undefined means the form's block list was never sent - leave the
    // existing blocks alone. An explicit [] is how the form says "delete
    // them all", the same rule every other field here follows.
    if (body.blocks !== undefined) {
      await caseStudyModel.replaceBlocks(id, body.blocks);
    }

    // The image was replaced, so the file the old row pointed at is orphaned.
    // Clean it up after the row is safely saved, never before.
    if (body.imageUrl !== undefined && body.imageUrl !== existing.image_url) {
      await removeUploadedImage(existing.image_url);
    }

    const study = await caseStudyModel.findById(id);

    return sendSuccess(res, 200, "Case study saved.", {
      caseStudy: toApiCaseStudy(await withBlocks(study)),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/case-studies/:id/status
//
// The publish / unpublish toggle on the list, which changes nothing else.
export const updateCaseStudyStatus = async (req, res, next) => {
  try {
    const { id } = req.validParams;
    const { status } = req.body;

    // Checked first: UPDATE reports 0 changed rows both for a missing id and
    // for a status that was already set, so it cannot tell those apart.
    const existing = await caseStudyModel.findById(id);
    if (!existing) {
      throw new AppError("Case study not found.", 404);
    }

    const publishedAt =
      status === "PUBLISHED" && !existing.published_at ? new Date() : existing.published_at;

    await caseStudyModel.updateStatus(id, status, publishedAt);
    const study = await caseStudyModel.findById(id);

    return sendSuccess(
      res,
      200,
      status === "PUBLISHED" ? "Case study published." : "Case study moved back to draft.",
      { caseStudy: toApiCaseStudy(study) }
    );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/case-studies/:id
export const deleteCaseStudy = async (req, res, next) => {
  try {
    const { id } = req.validParams;

    // Read the row first, so the image it points at can be removed once the
    // row itself is gone.
    const existing = await caseStudyModel.findById(id);
    if (!existing) {
      throw new AppError("Case study not found.", 404);
    }

    await caseStudyModel.deleteById(id);
    await removeUploadedImage(existing.image_url);

    return sendSuccess(res, 200, "Case study deleted.");
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/case-studies/image
//
// Returns the path to store, not the file. The form saves that path with the
// rest of the record, which is what lets an admin swap the image and then
// abandon the edit - the file is on disk, but no row points at it.
//
// The file may have landed in a per-case-study subfolder (see the `folder`
// field the upload middleware reads) or, without one, straight in the
// top-level case-studies folder - so the URL is built from where the file
// actually was written rather than assumed.
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Please choose an image to upload.", 400);
    }

    const relative = path.relative(uploadsDir, req.file.path).split(path.sep).join("/");

    return sendSuccess(res, 201, "Image uploaded.", {
      imageUrl: `/uploads/${relative}`,
    });
  } catch (error) {
    next(error);
  }
};
