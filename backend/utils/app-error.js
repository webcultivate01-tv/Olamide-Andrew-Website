// An error we are happy to show the user, like "Invalid email or password."
//
// The error middleware sends the message of an AppError to the client, but
// replaces any other error with a generic message. That way a database or
// programming error can never leak details out of the API.
export class AppError extends Error {
  constructor(message, status = 400, errors) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.isAppError = true;
    this.errors = errors;
  }
}
