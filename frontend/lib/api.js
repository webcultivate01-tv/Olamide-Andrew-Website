/**
 * Client for the Express auth API.
 *
 * Every call sets `credentials: "include"`. The session lives in an HTTP-only
 * cookie the browser will not attach to a cross-origin request otherwise —
 * and because the token is never readable from JavaScript, this module has no
 * token to pass around by hand.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * An error the API described. `message` is already user-facing — the backend
 * writes these for display — and `errors` maps field names to messages when
 * validation failed.
 */
export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let response;

  // A FormData body is an upload. It is sent untouched and with no
  // Content-Type of our own — the browser has to set that header itself,
  // because only it knows the multipart boundary it generated.
  const isUpload = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: body && !isUpload ? { "Content-Type": "application/json" } : undefined,
      body: isUpload ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects when the request never completed — the API is down,
    // or CORS blocked it. Neither produces a message from the server, so
    // supply one rather than surfacing "Failed to fetch".
    throw new ApiError(
      "Could not reach the server. Please check your connection and try again."
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // A non-JSON body (a proxy error page, say) leaves payload null and falls
    // through to the generic message below.
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message || "Something went wrong. Please try again later.",
      { status: response.status, errors: payload?.errors }
    );
  }

  return payload;
}

export const login = (email, password) =>
  request("/api/auth/login", { method: "POST", body: { email, password } });

export const logout = () => request("/api/auth/logout", { method: "POST" });

export const getCurrentAdmin = () => request("/api/auth/me");

// Profile ----------------------------------------------------------------

export const updateProfile = (profile) =>
  request("/api/admin/profile", { method: "PATCH", body: profile });

// Stores the file and answers with the path to save on the profile. Uploaded
// as soon as it is chosen, same as a case study or blog cover image.
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append("image", file);

  return request("/api/admin/profile/avatar", { method: "POST", body: form });
};

export const changePassword = ({ newPassword, confirmPassword }) =>
  request("/api/admin/password", {
    method: "PATCH",
    body: { newPassword, confirmPassword },
  });

export const forgotPassword = (email) =>
  request("/api/auth/forgot-password", { method: "POST", body: { email } });

export const verifyOtp = (email, otp) =>
  request("/api/auth/verify-otp", { method: "POST", body: { email, otp } });

export const resetPassword = ({ resetToken, newPassword, confirmPassword }) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: { resetToken, newPassword, confirmPassword },
  });

// Enquiries ------------------------------------------------------------------

// Public. Called from the website's contact form, by a visitor with no session.
export const submitEnquiry = (enquiry) =>
  request("/api/enquiries", { method: "POST", body: enquiry });

// Everything below needs an admin session, which travels in the cookie.

export const getEnquiries = ({ page = 1, perPage = 20, status = "ALL", search = "" } = {}) => {
  // URLSearchParams encodes the values, so a search term containing & or #
  // cannot break the query string apart.
  const query = new URLSearchParams({ page, perPage, status });
  if (search) query.set("search", search);

  return request(`/api/admin/enquiries?${query}`);
};

export const getEnquiryStats = () => request("/api/admin/enquiries/stats");

export const updateEnquiryStatus = (id, status) =>
  request(`/api/admin/enquiries/${id}/status`, { method: "PATCH", body: { status } });

export const deleteEnquiry = (id) =>
  request(`/api/admin/enquiries/${id}`, { method: "DELETE" });

// The five statuses the API accepts, with the wording the panel shows for
// each. Kept here so the filter, the badge and the dropdown cannot disagree.
export const ENQUIRY_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CONVERTED", label: "Converted" },
  { value: "CLOSED", label: "Closed" },
];

export const statusLabel = (value) =>
  ENQUIRY_STATUSES.find((status) => status.value === value)?.label || value;

// Dashboard -------------------------------------------------------------------

// Every card and chart on the dashboard, in one response. Called again
// whenever the socket says something changed, so the charts move with the
// counts instead of going stale until the next reload.
export const getDashboardOverview = () => request("/api/admin/dashboard/overview");

// Case studies ---------------------------------------------------------------

// Public. The website's case studies page reads this; no session involved.
export const getPublishedCaseStudies = () => request("/api/case-studies");

// Everything below needs an admin session, which travels in the cookie.

export const getCaseStudies = ({ page = 1, perPage = 20, status = "ALL", search = "" } = {}) => {
  const query = new URLSearchParams({ page, perPage, status });
  if (search) query.set("search", search);

  return request(`/api/admin/case-studies?${query}`);
};

export const getCaseStudyStats = () => request("/api/admin/case-studies/stats");

export const getCaseStudy = (id) => request(`/api/admin/case-studies/${id}`);

export const createCaseStudy = (caseStudy) =>
  request("/api/admin/case-studies", { method: "POST", body: caseStudy });

export const updateCaseStudy = (id, caseStudy) =>
  request(`/api/admin/case-studies/${id}`, { method: "PATCH", body: caseStudy });

export const updateCaseStudyStatus = (id, status) =>
  request(`/api/admin/case-studies/${id}/status`, { method: "PATCH", body: { status } });

export const deleteCaseStudy = (id) =>
  request(`/api/admin/case-studies/${id}`, { method: "DELETE" });

// Stores the file and answers with the path to save on the record. The upload
// happens as soon as a file is chosen, before the form is submitted, so the
// admin sees the real image in the preview rather than a local placeholder
// that might not survive the save.
export const uploadCaseStudyImage = (file) => {
  const form = new FormData();
  form.append("image", file);

  return request("/api/admin/case-studies/image", { method: "POST", body: form });
};

export const CASE_STUDY_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

export const caseStudyStatusLabel = (value) =>
  CASE_STUDY_STATUSES.find((status) => status.value === value)?.label || value;

// Blog -----------------------------------------------------------------------

// Public. The website's blog reads these; no session involved. Unlike the case
// study grid the list is paged — a blog grows without limit.
export const getPublishedPosts = ({ page = 1, perPage = 12, tag = "" } = {}) => {
  const query = new URLSearchParams({ page, perPage });
  if (tag) query.set("tag", tag);

  return request(`/api/blog?${query}`);
};

export const getPublishedPost = (slug) =>
  request(`/api/blog/${encodeURIComponent(slug)}`);

export const getPublishedPostTags = () => request("/api/blog/tags");

// Everything below needs an admin session, which travels in the cookie.

export const getPosts = ({
  page = 1,
  perPage = 20,
  status = "ALL",
  tag = "",
  search = "",
} = {}) => {
  // URLSearchParams encodes the values, so a search term containing & or #
  // cannot break the query string apart.
  const query = new URLSearchParams({ page, perPage, status });
  if (tag) query.set("tag", tag);
  if (search) query.set("search", search);

  return request(`/api/admin/blog?${query}`);
};

export const getPostStats = () => request("/api/admin/blog/stats");

// Drafts included, unlike the public one: this fills the panel's filter.
export const getPostTags = () => request("/api/admin/blog/tags");

export const getPost = (id) => request(`/api/admin/blog/${id}`);

export const createPost = (post) =>
  request("/api/admin/blog", { method: "POST", body: post });

export const updatePost = (id, post) =>
  request(`/api/admin/blog/${id}`, { method: "PATCH", body: post });

export const updatePostStatus = (id, status) =>
  request(`/api/admin/blog/${id}/status`, { method: "PATCH", body: { status } });

export const deletePost = (id) => request(`/api/admin/blog/${id}`, { method: "DELETE" });

// Stores the file and answers with the path to save on the record. Same
// reasoning as the case study upload above: the file goes up as soon as it is
// chosen, so the preview shows the real image.
export const uploadPostImage = (file) => {
  const form = new FormData();
  form.append("image", file);

  return request("/api/admin/blog/image", { method: "POST", body: form });
};

export const POST_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

export const postStatusLabel = (value) =>
  POST_STATUSES.find((status) => status.value === value)?.label || value;

/**
 * Turns a stored image path into one the browser can load.
 *
 * There are three kinds of value in that column, and they resolve differently:
 * an upload (`/uploads/...`) is served by the Express API on its own origin, a
 * file in this site's `public` folder (`/case-studies/...`) is served by
 * Next.js, and a full URL is already complete.
 */
export const mediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${API_URL}${path}`;
  return path;
};
