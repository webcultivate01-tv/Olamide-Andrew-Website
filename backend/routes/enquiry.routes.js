import { Router } from "express";
import * as enquiryController from "../controllers/enquiry.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { enquiryLimiter } from "../middleware/rateLimit.middleware.js";
import { createEnquirySchema } from "../validators/enquiry.validator.js";

// All routes here start with /api/enquiries and are PUBLIC.
//
// Reading, updating and deleting enquiries live on the admin router instead,
// behind requireAuth. Nothing that exposes stored data belongs in this file -
// the public website only ever needs to write.
const router = Router();

router.post(
  "/",
  enquiryLimiter,
  validateBody(createEnquirySchema),
  enquiryController.createEnquiry
);

export default router;
