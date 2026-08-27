import { Router } from "express";
import * as caseStudyController from "../controllers/case-study.controller.js";
import { validateParams } from "../middleware/validate.middleware.js";
import { caseStudySlugSchema } from "../validators/case-study.validator.js";

// All routes here start with /api/case-studies and are PUBLIC and read-only.
//
// Both handlers filter on status = 'PUBLISHED' in the query itself, so a draft
// cannot reach the website even if someone guesses its address. Everything
// that creates, edits or deletes a study lives on the admin router instead,
// behind requireAuth.
const router = Router();

router.get("/", caseStudyController.listPublishedCaseStudies);

router.get(
  "/:slug",
  validateParams(caseStudySlugSchema),
  caseStudyController.getPublishedCaseStudy
);

export default router;
