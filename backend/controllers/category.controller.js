import * as categoryModel from "../models/category.model.js";
import { slugify } from "../validators/category.validator.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Everything the category feature does. All admin-only - there is no public
// endpoint, the same way tags have none of their own either.

// A database row is snake_case and carries MySQL Date objects. The panel
// wants camelCase and ISO strings, so every response goes through here.
const toApiCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  type: row.type,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Finds a slug nothing else is using: the one asked for, or that with -2, -3
// and so on after it. Two categories with the same name is not something the
// admin should have to solve by hand.
const uniqueSlug = async (wanted, excludeId = null) => {
  const base = wanted || "category";

  if (!(await categoryModel.slugExists(base, excludeId))) {
    return base;
  }

  for (let suffix = 2; suffix <= 50; suffix++) {
    const candidate = `${base.slice(0, 116)}-${suffix}`;
    if (!(await categoryModel.slugExists(candidate, excludeId))) {
      return candidate;
    }
  }

  throw new AppError("Too many categories share this name. Please change it slightly.", 409);
};

// GET /api/categories
//
// Public. The website's blog page reads this to build its category filter
// pills, so a category added, renamed or removed in the admin panel shows up
// there on the next page load - no separate publish step, the same way a
// category has no draft state to begin with.
export const listPublicCategories = async (req, res, next) => {
  try {
    const { type } = req.validQuery;
    const rows = await categoryModel.findCategories({ type });

    return sendSuccess(res, 200, "Categories loaded.", {
      categories: rows.map(toApiCategory),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/categories?search=
export const listCategories = async (req, res, next) => {
  try {
    const { search, type } = req.validQuery;
    const rows = await categoryModel.findCategories({ search, type });

    return sendSuccess(res, 200, "Categories loaded.", {
      categories: rows.map(toApiCategory),
      total: rows.length,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug: wantedSlug, type } = req.body;

    const slug = await uniqueSlug(wantedSlug || slugify(name));
    const id = await categoryModel.createCategory({ name, slug, type });
    const category = await categoryModel.findById(id);

    return sendSuccess(res, 201, "Category created.", { category: toApiCategory(category) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.validParams;
    const body = req.body;

    const existing = await categoryModel.findById(id);
    if (!existing) {
      throw new AppError("Category not found.", 404);
    }

    const name = body.name ?? existing.name;

    // An explicit slug wins. Otherwise, a renamed category re-derives its
    // slug from the new name, same as a blog post's while it is a draft.
    const wantedSlug = body.slug || (body.name ? slugify(name) : existing.slug);
    const slug = await uniqueSlug(wantedSlug, id);

    await categoryModel.updateCategory(id, { name, slug });
    const category = await categoryModel.findById(id);

    return sendSuccess(res, 200, "Category saved.", { category: toApiCategory(category) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.validParams;

    const deleted = await categoryModel.deleteById(id);
    if (!deleted) {
      throw new AppError("Category not found.", 404);
    }

    return sendSuccess(res, 200, "Category deleted.");
  } catch (error) {
    next(error);
  }
};
