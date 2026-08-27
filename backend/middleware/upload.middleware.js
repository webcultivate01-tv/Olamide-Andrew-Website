import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { AppError } from "../utils/app-error.js";

// Accepts one image - for a case study or for a blog post - and writes it to
// backend/uploads.
//
// Uploads are the one place this API takes a file rather than a JSON value, so
// three things are pinned down here and not left to the caller:
//
//   1. The name on disk is generated, never the name the browser sent. An
//      uploaded "../../server.js" or "logo.png.js" would otherwise be written
//      wherever the name pointed, under whatever extension it claimed.
//   2. Only image types the website can actually display are allowed through.
//   3. There is a hard size limit, because the route is behind a login but a
//      logged-in admin can still fill a disk by accident.
//
// The two features get their own folder rather than sharing one. Deleting a
// record deletes the file it points at, and that check ("is this path really
// inside the folder this feature owns?") is only worth anything if the folders
// are separate.

// backend/uploads. app.js serves this folder as /uploads, so the path the API
// hands back is the path the browser asks for.
export const uploadsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads"
);

export const caseStudyUploadsDir = path.join(uploadsDir, "case-studies");
export const blogUploadsDir = path.join(uploadsDir, "blog");

// The folders are created on startup rather than on the first upload, so a
// permissions problem shows up while the server is booting instead of halfway
// through someone saving a post.
fs.mkdirSync(caseStudyUploadsDir, { recursive: true });
fs.mkdirSync(blogUploadsDir, { recursive: true });

// The MIME types allowed, and the extension each is stored under. Going from
// the type to the extension - rather than trusting the one in the filename -
// is what stops a .js being saved because it was named "photo.png".
const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

// 4 MB. Comfortably more than a compressed hero photograph needs, far less
// than an untouched camera file.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * A single-image upload handler writing into `destination`.
 *
 * multer reports its own limits as a MulterError, which the error handler would
 * otherwise treat as an unexpected bug and answer with a generic 500. The
 * wrapper turns those into the plain messages a form can show, in the same
 * { success, message } shape every other failure uses.
 */
const makeImageUpload = (destination) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, done) => done(null, destination),
      filename: (req, file, done) => {
        // Random, so two people uploading "cover.jpg" cannot overwrite each
        // other and nobody can guess the URL of an image before it is
        // published.
        const name = crypto.randomBytes(16).toString("hex");
        done(null, `${name}${IMAGE_TYPES[file.mimetype]}`);
      },
    }),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (req, file, done) => {
      if (!IMAGE_TYPES[file.mimetype]) {
        // Passing an AppError to multer's callback sends it down the normal
        // error path rather than surfacing multer's own wording.
        return done(new AppError("Please upload a JPEG, PNG, WebP or AVIF image.", 400));
      }
      return done(null, true);
    },
  }).single("image");

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) return next();

      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError("That image is larger than 4 MB. Please upload a smaller one.", 400)
        );
      }

      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new AppError("Please upload a single image, in the 'image' field.", 400));
      }

      return next(error);
    });
  };
};

export const handleCaseStudyImageUpload = makeImageUpload(caseStudyUploadsDir);
export const handleBlogImageUpload = makeImageUpload(blogUploadsDir);
