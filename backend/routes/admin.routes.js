import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import * as enquiryController from "../controllers/enquiry.controller.js";
import * as caseStudyController from "../controllers/case-study.controller.js";
import * as blogController from "../controllers/blog-post.controller.js";
import * as categoryController from "../controllers/category.controller.js";
import * as subscriberController from "../controllers/subscriber.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  handleCaseStudyImageUpload,
  handleBlogImageUpload,
  handleBlockImageUpload,
  handleAdminAvatarUpload,
} from "../middleware/upload.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  listEnquiriesSchema,
  enquiryIdSchema,
  updateStatusSchema,
} from "../validators/enquiry.validator.js";
import {
  listCaseStudiesSchema,
  caseStudyIdSchema,
  createCaseStudySchema,
  updateCaseStudySchema,
  updateCaseStudyStatusSchema,
} from "../validators/case-study.validator.js";
import {
  listBlogPostsSchema,
  blogPostIdSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  updateBlogPostStatusSchema,
} from "../validators/blog-post.validator.js";
import { updateProfileSchema, changePasswordSchema } from "../validators/admin.validator.js";
import {
  listCategoriesSchema,
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";
import {
  listSubscribersSchema,
  exportSubscribersSchema,
  subscriberIdSchema,
} from "../validators/subscriber.validator.js";

// All routes here start with /api/admin
const router = Router();

// requireAuth is applied to the whole router instead of each route, so any new
// admin route added below is protected automatically and cannot be forgotten.
router.use(requireAuth);

router.get("/profile", adminController.getProfile);

router.patch(
  "/profile",
  validateBody(updateProfileSchema),
  adminController.updateProfile
);

router.post("/profile/avatar", handleAdminAvatarUpload, adminController.uploadAvatar);

router.patch(
  "/password",
  validateBody(changePasswordSchema),
  adminController.changePassword
);

router.get("/dashboard", adminController.getDashboard);

// Everything the dashboard's cards and charts read, in one response. Separate
// from /dashboard above because that one answers "is this session real?" for
// every admin page, and it should stay cheap.
router.get("/dashboard/overview", adminController.getDashboardOverview);

// Enquiries ----------------------------------------------------------------

router.get("/enquiries", validateQuery(listEnquiriesSchema), enquiryController.listEnquiries);

// This must be declared before /enquiries/:id. Express matches in order, and
// the other way round "stats" would be read as an id and rejected as invalid.
router.get("/enquiries/stats", enquiryController.getEnquiryStats);

router.get(
  "/enquiries/:id",
  validateParams(enquiryIdSchema),
  enquiryController.getEnquiry
);

router.patch(
  "/enquiries/:id/status",
  validateParams(enquiryIdSchema),
  validateBody(updateStatusSchema),
  enquiryController.updateEnquiryStatus
);

router.delete(
  "/enquiries/:id",
  validateParams(enquiryIdSchema),
  enquiryController.deleteEnquiry
);

// Case studies --------------------------------------------------------------

router.get(
  "/case-studies",
  validateQuery(listCaseStudiesSchema),
  caseStudyController.listCaseStudies
);

// Both of these must be declared before /case-studies/:id. Express matches in
// order, and the other way round "stats" and "image" would be read as ids and
// rejected as invalid.
router.get("/case-studies/stats", caseStudyController.getCaseStudyStats);

// The one multipart endpoint on this API. It stores the file and answers with
// the path; the form then saves that path with the rest of the record.
router.post(
  "/case-studies/image",
  handleCaseStudyImageUpload,
  caseStudyController.uploadImage
);

router.post(
  "/case-studies",
  validateBody(createCaseStudySchema),
  caseStudyController.createCaseStudy
);

router.get(
  "/case-studies/:id",
  validateParams(caseStudyIdSchema),
  caseStudyController.getCaseStudy
);

router.patch(
  "/case-studies/:id",
  validateParams(caseStudyIdSchema),
  validateBody(updateCaseStudySchema),
  caseStudyController.updateCaseStudy
);

router.patch(
  "/case-studies/:id/status",
  validateParams(caseStudyIdSchema),
  validateBody(updateCaseStudyStatusSchema),
  caseStudyController.updateCaseStudyStatus
);

router.delete(
  "/case-studies/:id",
  validateParams(caseStudyIdSchema),
  caseStudyController.deleteCaseStudy
);

// Blog ----------------------------------------------------------------------

router.get("/blog", validateQuery(listBlogPostsSchema), blogController.listPosts);

// These three must be declared before /blog/:id. Express matches in order, and
// the other way round "stats", "tags" and "image" would be read as ids and
// rejected as invalid.
router.get("/blog/stats", blogController.getPostStats);

router.get("/blog/tags", blogController.getAllTags);

router.post("/blog/image", handleBlogImageUpload, blogController.uploadImage);

// Block images for both case studies and posts: uploads/blocks/<category>/<block>/.
router.post("/blocks/image", handleBlockImageUpload, blogController.uploadImage);

router.post("/blog", validateBody(createBlogPostSchema), blogController.createPost);

router.get("/blog/:id", validateParams(blogPostIdSchema), blogController.getPost);

router.patch(
  "/blog/:id",
  validateParams(blogPostIdSchema),
  validateBody(updateBlogPostSchema),
  blogController.updatePost
);

router.patch(
  "/blog/:id/status",
  validateParams(blogPostIdSchema),
  validateBody(updateBlogPostStatusSchema),
  blogController.updatePostStatus
);

router.delete("/blog/:id", validateParams(blogPostIdSchema), blogController.deletePost);

// Categories ------------------------------------------------------------------

router.get(
  "/categories",
  validateQuery(listCategoriesSchema),
  categoryController.listCategories
);

router.post(
  "/categories",
  validateBody(createCategorySchema),
  categoryController.createCategory
);

router.patch(
  "/categories/:id",
  validateParams(categoryIdSchema),
  validateBody(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/categories/:id",
  validateParams(categoryIdSchema),
  categoryController.deleteCategory
);

// Subscribers -----------------------------------------------------------------

router.get(
  "/subscribers",
  validateQuery(listSubscribersSchema),
  subscriberController.listSubscribers
);

// Declared before /subscribers/:id would be if there were one - there isn't,
// but every other route file in this API keeps a fixed segment ahead of a
// dynamic one for the same reason, so this follows suit.
router.get(
  "/subscribers/export",
  validateQuery(exportSubscribersSchema),
  subscriberController.exportSubscribers
);

router.delete(
  "/subscribers/:id",
  validateParams(subscriberIdSchema),
  subscriberController.deleteSubscriber
);

export default router;
