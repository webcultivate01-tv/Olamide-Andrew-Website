// Every response from this API looks the same, so the frontend never has to
// guess the shape:  { success, message, data? }

export const sendSuccess = (res, status, message, data) => {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
};

export const sendError = (res, status, message, errors) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};
