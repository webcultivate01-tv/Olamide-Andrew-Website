import { Router } from "express";
import * as subscriberController from "../controllers/subscriber.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { subscribeLimiter } from "../middleware/rateLimit.middleware.js";
import { subscribeSchema } from "../validators/subscriber.validator.js";

// All routes here start with /api/subscribers and are PUBLIC.
//
// Reading and deleting subscribers live on the admin router instead, behind
// requireAuth. Nothing that exposes an email address belongs in this file -
// the public website only ever needs to write.
const router = Router();

router.post(
  "/",
  subscribeLimiter,
  validateBody(subscribeSchema),
  subscriberController.subscribe
);

export default router;
