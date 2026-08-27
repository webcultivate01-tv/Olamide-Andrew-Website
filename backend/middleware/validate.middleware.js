import { AppError } from "../utils/app-error.js";

// Checks req.body against a Zod schema before the controller runs.
// If it passes, req.body is replaced with the cleaned up values (trimmed
// email, lowercased, and so on), so controllers never re-check anything.
export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});

    if (!result.success) {
      // Build a { fieldName: message } object for the form to show, and use
      // the first message as the main one.
      const errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] || "body";
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }

      return next(new AppError(result.error.issues[0].message, 400, errors));
    }

    req.body = result.data;
    return next();
  };
};

// Turns a Zod failure into the { fieldName: message } shape the forms expect,
// with the first message used as the headline. Shared by all three wrappers.
const toAppError = (zodError) => {
  const errors = {};
  for (const issue of zodError.issues) {
    const field = issue.path[0] || "body";
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return new AppError(zodError.issues[0].message, 400, errors);
};

// Checks the query string, e.g. ?page=2&status=NEW.
//
// The result lands on req.validQuery rather than replacing req.query: since
// Express 5 req.query is a getter with no setter, and assigning to it throws.
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query || {});

    if (!result.success) {
      return next(toAppError(result.error));
    }

    req.validQuery = result.data;
    return next();
  };
};

// Checks the route parameters, e.g. the :id in /enquiries/:id, so a query
// never sees a value that is not the number it is supposed to be.
export const validateParams = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params || {});

    if (!result.success) {
      // A bad id in the URL is a wrong address, not a bad form submission.
      return next(new AppError(result.error.issues[0].message, 404));
    }

    req.validParams = result.data;
    return next();
  };
};
