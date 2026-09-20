import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { listPublicCategoriesSchema } from "../validators/category.validator.js";

// All routes here start with /api/categories and are PUBLIC and read-only.
//
// The blog page's category filter reads the exact list the admin panel
// manages - everything that adds, renames or removes a category lives on the
// admin router instead, behind requireAuth.
const router = Router();

router.get(
  "/",
  validateQuery(listPublicCategoriesSchema),
  categoryController.listPublicCategories
);

export default router;
