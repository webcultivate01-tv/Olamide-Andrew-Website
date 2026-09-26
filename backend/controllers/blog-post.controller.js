import fs from "node:fs/promises";
import path from "node:path";
import * as blogModel from "../models/blog-post.model.js";
import { BLOG_POST_STATUSES } from "../models/blog-post.model.js";
import { slugify } from "../validators/blog-post.validator.js";
import { uploadsDir, blogUploadsDir } from "../middleware/upload.middleware.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Everything the blog feature does.
//
// The first three handlers are public - they are what the website's /blog
// pages read - and they only ever return published posts. All the rest sit
// behind requireAuth on the /api/admin router.

// How fast a person reads prose, in words a minute. On the low side on
// purpose: the number is there to set an expectation, and under-promising
// reads better than telling someone a fifteen-minute essay is a five.
const WORDS_PER_MINUTE = 200;

// Minutes, rounded up, never zero. Worked out on save rather than on read so
// the index can show it without loading every post's body.
const readingTime = (content) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

// The column holds "design,process"; everything above the model works with an
// array. Empty and NULL both mean "no tags".
const toTagArray = (value) => (value ? value.split(",").filter(Boolean) : []);

// And back again, for storage. An empty list is NULL rather than "", so a
// later "has tags?" check has one answer to look for instead of two.
const toTagColumn = (tags) => (tags.length ? tags.join(",") : null);

// A database row is snake_case and carries MySQL Date objects. The panel and
// the website both want camelCase and ISO strings, so every response goes
// through here.
//
// `content` is only on the row for the single-post lookups - the list queries
// leave it out - so it is only added to the response when it is really there.
// An undefined key disappears from JSON, which is the right answer: the list
// should not hand back an empty body that looks like a post with nothing in it.
//
// `blocks` follows the same rule, and for the same reason.
const toApiPost = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt,
  ...(row.content !== undefined ? { content: row.content } : {}),
  author: row.author,
  tags: toTagArray(row.tags),
  coverImageUrl: row.cover_image_url,
  coverImageAlt: row.cover_image_alt,
  readingTime: row.reading_time,
  status: row.status,
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

// Attaches a post's ordered blocks to the row before it goes through
// toApiPost, which only serialises them when the key is present.
const withBlocks = async (post) => {
  if (!post) return post;
  const blocks = await blogModel.findBlocksByBlogPostId(post.id);
  return { ...post, blocks };
};

// Finds a slug nothing else is using: the one asked for, or that with -2, -3
// and so on after it. Two posts with the same title - a yearly round-up, say -
// is a realistic thing to write, and it should not be an error the admin has
// to solve.
const uniqueSlug = async (wanted, excludeId = null) => {
  const base = wanted || "post";

  if (!(await blogModel.slugExists(base, excludeId))) {
    return base;
  }

  // A ceiling rather than a while(true): if something is badly wrong, this
  // should fail with a message and not spin against the database forever.
  for (let suffix = 2; suffix <= 50; suffix++) {
    const candidate = `${base.slice(0, 196)}-${suffix}`;
    if (!(await blogModel.slugExists(candidate, excludeId))) {
      return candidate;
    }
  }

  throw new AppError("Too many posts share this title. Please change it slightly.", 409);
};

// Only images this API wrote are ever deleted, and only ones that are really
// inside the blog uploads folder. cover_image_url can also point at a file in
// the website's own public folder, which is not ours to remove.
//
// Images now live up to two folders deeper -
// uploads/blog/<category>/<block>/<file> - so this resolves the whole
// remainder of the path, not just the basename.
const removeUploadedImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/blog/")) return;

  const relative = imageUrl.slice("/uploads/blog/".length);
  const target = path.resolve(blogUploadsDir, relative);

  // Resolving and checking the result is still inside the folder is what
  // stops a "../../" in the remainder from climbing out of it.
  const base = path.resolve(blogUploadsDir) + path.sep;
  if (!target.startsWith(base)) return;

  // A missing file is fine - the row is going either way, and a failed delete
  // must not fail the request.
  await fs.unlink(target).catch(() => {});
};

// Every distinct tag in use, alphabetically, for a filter dropdown. The rows
// come back one comma-joined string per post, so they are flattened here.
const collectTags = async (options) => {
  const rows = await blogModel.findAllTags(options);
  const tags = new Set();

  for (const row of rows) {
    for (const tag of toTagArray(row.tags)) {
      tags.add(tag);
    }
  }

  return [...tags].sort();
};

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// GET /api/blog?page=&perPage=&tag=
//
// No login, and paged: a blog grows without limit, so page 1 of it must not
// get slower every time something is published.
export const listPublishedPosts = async (req, res, next) => {
  try {
    const { page, perPage, tag } = req.validQuery;
    const offset = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      blogModel.findPublished({ tag, limit: perPage, offset }),
      blogModel.countPublished({ tag }),
    ]);

    return sendSuccess(res, 200, "Posts loaded.", {
      posts: rows.map(toApiPost),
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

// GET /api/blog/tags
//
// Published posts only. A draft's tags would otherwise leak what is being
// written before it is ready to be read.
export const listPublishedTags = async (req, res, next) => {
  try {
    const tags = await collectTags({ publishedOnly: true });

    return sendSuccess(res, 200, "Tags loaded.", { tags });
  } catch (error) {
    next(error);
  }
};

// GET /api/blog/:slug
//
// A draft answers 404 here rather than 403. Whether an unpublished post exists
// is not something a stranger should be able to find out.
export const getPublishedPost = async (req, res, next) => {
  try {
    const post = await blogModel.findPublishedBySlug(req.validParams.slug);

    if (!post) {
      throw new AppError("Post not found.", 404);
    }

    return sendSuccess(res, 200, "Post loaded.", {
      post: toApiPost(await withBlocks(post)),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/blog?page=&perPage=&status=&tag=&search=
export const listPosts = async (req, res, next) => {
  try {
    const { page, perPage, status, tag, search } = req.validQuery;
    const offset = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      blogModel.findBlogPosts({ status, tag, search, limit: perPage, offset }),
      blogModel.countBlogPosts({ status, tag, search }),
    ]);

    return sendSuccess(res, 200, "Posts loaded.", {
      posts: rows.map(toApiPost),
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

// GET /api/admin/blog/stats
export const getPostStats = async (req, res, next) => {
  try {
    const rows = await blogModel.countByStatus();

    // GROUP BY only returns statuses something is sitting in, so start both at
    // zero and let the counts overwrite them.
    const byStatus = Object.fromEntries(BLOG_POST_STATUSES.map((status) => [status, 0]));
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

// GET /api/admin/blog/tags
//
// Drafts included, unlike the public one: this fills the panel's filter, and
// an admin filtering their own drafts is the point of it.
export const getAllTags = async (req, res, next) => {
  try {
    const tags = await collectTags();

    return sendSuccess(res, 200, "Tags loaded.", { tags });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/blog/:id
//
// By id, and drafts included - this is what the edit form loads.
export const getPost = async (req, res, next) => {
  try {
    const post = await blogModel.findById(req.validParams.id);

    if (!post) {
      throw new AppError("Post not found.", 404);
    }

    return sendSuccess(res, 200, "Post loaded.", {
      post: toApiPost(await withBlocks(post)),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/blog
export const createPost = async (req, res, next) => {
  try {
    const body = req.body;

    // The slug is derived from the title unless one was typed, then made
    // unique either way.
    const slug = await uniqueSlug(body.slug || slugify(body.title));

    // published_at is the moment it first went live. Creating a draft leaves
    // it null until the day it is published.
    const publishedAt = body.status === "PUBLISHED" ? new Date() : null;

    const id = await blogModel.createBlogPost({
      ...body,
      slug,
      tags: toTagColumn(body.tags),
      readingTime: readingTime(body.content),
      publishedAt,
    });

    await blogModel.replaceBlocks(id, body.blocks);

    const post = await blogModel.findById(id);

    return sendSuccess(res, 201, "Post created.", {
      post: toApiPost(await withBlocks(post)),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/blog/:id
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.validParams;
    const body = req.body;

    const existing = await blogModel.findById(id);
    if (!existing) {
      throw new AppError("Post not found.", 404);
    }

    // Whatever was sent wins; everything else keeps the value it has. This is
    // why the model can do a full UPDATE without needing to know which fields
    // the form actually touched.
    //
    // The nullable fields are compared against undefined rather than using ??,
    // because null is a real value here: it is how the form says "clear this".
    const merged = {
      title: body.title ?? existing.title,
      excerpt: body.excerpt ?? existing.excerpt,
      content: body.content ?? existing.content,
      author: body.author !== undefined ? body.author : existing.author,
      tags: body.tags !== undefined ? toTagColumn(body.tags) : existing.tags,
      coverImageUrl:
        body.coverImageUrl !== undefined ? body.coverImageUrl : existing.cover_image_url,
      coverImageAlt:
        body.coverImageAlt !== undefined ? body.coverImageAlt : existing.cover_image_alt,
      status: body.status ?? existing.status,
    };

    // Recomputed whenever the body changes, so the stored minutes and the
    // stored words can never describe different posts.
    merged.readingTime = readingTime(merged.content);

    // An explicit slug replaces the old one. Retitling a post does *not*
    // silently move its address once it is live - that would break every link
    // to it, and a blog post is meant to be linked to - so the slug only
    // follows the title while it is still a draft.
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

    await blogModel.updateBlogPost(id, merged);

    // Undefined means the form's block list was never sent - leave the
    // existing blocks alone. An explicit [] is how the form says "delete
    // them all", the same rule every other field here follows.
    if (body.blocks !== undefined) {
      await blogModel.replaceBlocks(id, body.blocks);
    }

    // The cover was replaced, so the file the old row pointed at is orphaned.
    // Clean it up after the row is safely saved, never before.
    if (
      body.coverImageUrl !== undefined &&
      body.coverImageUrl !== existing.cover_image_url
    ) {
      await removeUploadedImage(existing.cover_image_url);
    }

    const post = await blogModel.findById(id);

    return sendSuccess(res, 200, "Post saved.", {
      post: toApiPost(await withBlocks(post)),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/blog/:id/status
//
// The publish / unpublish toggle on the list, which changes nothing else.
export const updatePostStatus = async (req, res, next) => {
  try {
    const { id } = req.validParams;
    const { status } = req.body;

    // Checked first: UPDATE reports 0 changed rows both for a missing id and
    // for a status that was already set, so it cannot tell those apart.
    const existing = await blogModel.findById(id);
    if (!existing) {
      throw new AppError("Post not found.", 404);
    }

    const publishedAt =
      status === "PUBLISHED" && !existing.published_at ? new Date() : existing.published_at;

    await blogModel.updateStatus(id, status, publishedAt);
    const post = await blogModel.findById(id);

    return sendSuccess(
      res,
      200,
      status === "PUBLISHED" ? "Post published." : "Post moved back to draft.",
      { post: toApiPost(post) }
    );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/blog/:id
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.validParams;

    // Read the row first, so the image it points at can be removed once the
    // row itself is gone.
    const existing = await blogModel.findById(id);
    if (!existing) {
      throw new AppError("Post not found.", 404);
    }

    await blogModel.deleteById(id);
    await removeUploadedImage(existing.cover_image_url);

    return sendSuccess(res, 200, "Post deleted.");
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/blog/image
//
// Returns the path to store, not the file. The form saves that path with the
// rest of the record, which is what lets an admin swap the cover and then
// abandon the edit - the file is on disk, but no row points at it.
//
// The file may have landed in a <category>/<block> subfolder (see the
// `folder` field the upload middleware reads) or, without one, straight in
// the top-level blog folder - so the URL is built from where the file
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
