import { Router } from "express";
import * as blogController from "../controllers/blog-post.controller.js";
import { validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  blogPostSlugSchema,
  listPublishedBlogPostsSchema,
} from "../validators/blog-post.validator.js";

// All routes here start with /api/blog and are PUBLIC and read-only.
//
// Every handler filters on status = 'PUBLISHED' in the query itself, so a
// draft cannot reach the website even if someone guesses its address. There is
// no status parameter on this router at all - the admin list is where drafts
// are read, behind requireAuth.
const router = Router();

router.get("/", validateQuery(listPublishedBlogPostsSchema), blogController.listPublishedPosts);

// This must be declared before /:slug. Express matches in order, and the other
// way round "tags" would be read as a post address and answered with a 404.
router.get("/tags", blogController.listPublishedTags);

router.get(
  "/:slug",
  validateParams(blogPostSlugSchema),
  blogController.getPublishedPost
);

export default router;
