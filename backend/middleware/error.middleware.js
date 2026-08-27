import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

// Runs when no route matched the request.
export const notFoundHandler = (req, res) => {
  return sendError(res, 404, `Cannot ${req.method} ${req.originalUrl}`);
};

// The one place where errors become responses. Express sends any error passed
// to next(error) here.
//
// An AppError is something we threw on purpose, so its message is safe to show.
// Anything else is a bug or a database failure: we log it on the server and
// send back a generic message, so stack traces and SQL errors never leak out.
export const errorHandler = (error, req, res, next) => {
  if (error.isAppError) {
    return sendError(res, error.status, error.message, error.errors);
  }

  console.error("[unexpected error]", error);

  const message = env.isProduction
    ? "Something went wrong. Please try again later."
    : // In development show the real message, it makes debugging much faster.
      error.message || "Something went wrong. Please try again later.";

  return sendError(res, 500, message);
};
