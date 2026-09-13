import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";
import caseStudyRoutes from "./routes/case-study.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import subscriberRoutes from "./routes/subscriber.routes.js";
import { uploadsDir } from "./middleware/upload.middleware.js";
import { globalLimiter } from "./middleware/rateLimit.middleware.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";
import { sendSuccess } from "./utils/response.js";

// The Express app: middleware, then routes, then error handling.
// server.js is what actually starts it listening.
const app = express();

// Only believe the X-Forwarded-For header when a real proxy is in front of us.
app.set("trust proxy", env.trustProxy ? 1 : false);

// Hides the "X-Powered-By: Express" header.
app.disable("x-powered-by");

// Adds a set of safe HTTP headers.
app.use(helmet());

// Only the admin panel is allowed to call this API, and credentials: true is
// what lets the login cookie travel with each request.
// A "*" origin is not possible here - browsers reject it once cookies are used.
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

// Reads JSON request bodies. The size limit keeps a huge POST from becoming a
// memory problem.
app.use(express.json({ limit: "10kb" }));

// Reads cookies into req.cookies, which is how the auth middleware finds the token.
app.use(cookieParser());

app.use(globalLimiter);

// A quick way to check the API is alive.
app.get("/api/health", (req, res) => {
  return sendSuccess(res, 200, "API is running.", {
    environment: env.nodeEnv,
    time: new Date().toISOString(),
  });
});

// Uploaded case study and blog images, served straight off disk.
//
// helmet() sets Cross-Origin-Resource-Policy: same-origin on everything, which
// is right for JSON but would stop the website - a different origin - from
// displaying these images at all. The header is relaxed for this folder only.
//
// dotfiles: "deny" and the generated filenames mean nothing here can be asked
// for except an image this API wrote.
app.use(
  "/uploads",
  helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
  express.static(uploadsDir, {
    dotfiles: "deny",
    index: false,
    // Filenames are random and a file is never rewritten under the same name,
    // so a long cache is safe: a changed image is always a new URL.
    maxAge: "30d",
  })
);

app.use("/api/auth", authRoutes);

// Public: the website's enquiry form posts here. Everything that *reads* an
// enquiry lives on the admin router below, behind the login check.
app.use("/api/enquiries", enquiryRoutes);

// Public: the website's case studies page reads from here. Published rows
// only - everything that writes one lives on the admin router below.
app.use("/api/case-studies", caseStudyRoutes);

// Public: the website's blog reads from here. Published posts only -
// everything that writes one lives on the admin router below.
app.use("/api/blog", blogRoutes);

// Public: the blog page's category filter reads from here. Everything that
// adds, renames or removes a category lives on the admin router below.
app.use("/api/categories", categoryRoutes);

// Public: the newsletter signup on the blog page posts here. Reading and
// deleting subscribers both live on the admin router below.
app.use("/api/subscribers", subscriberRoutes);

app.use("/api/admin", adminRoutes);

// These two must come last, after every route.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
