import fs from "node:fs/promises";
import path from "node:path";
import * as adminModel from "../models/admin.model.js";
import * as enquiryModel from "../models/enquiry.model.js";
import * as caseStudyModel from "../models/case-study.model.js";
import * as blogModel from "../models/blog-post.model.js";
import { ENQUIRY_STATUSES } from "../models/enquiry.model.js";
import { CASE_STUDY_STATUSES } from "../models/case-study.model.js";
import { BLOG_POST_STATUSES } from "../models/blog-post.model.js";
import { adminUploadsDir } from "../middleware/upload.middleware.js";
import { hashPassword } from "../utils/password.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Admin endpoints. These all sit behind requireAuth, which has already put the
// logged in admin's row on req.admin.

// A database row is snake_case and carries MySQL Date objects; the panel wants
// camelCase and ISO strings it can format in the browser's own timezone. Only
// the fields the dashboard's activity list shows are carried over - the full
// message belongs on the enquiry's own page, not in a summary.
const toApiEnquiry = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  subject: row.subject,
  service: row.service,
  status: row.status,
  createdAt: row.created_at,
});

// GET /api/admin/profile
export const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Profile loaded.", {
      admin: {
        ...adminModel.publicAdmin(req.admin),
        isActive: Boolean(req.admin.is_active),
        createdAt: req.admin.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Only a photo this API wrote is ever deleted, and only one that is really
// inside the admin uploads folder - the same reasoning as the case study and
// blog image cleanup.
const removeUploadedAvatar = async (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/admins/")) return;

  const filename = path.basename(avatarUrl);
  const target = path.resolve(adminUploadsDir, filename);

  if (path.dirname(target) !== path.resolve(adminUploadsDir)) return;

  await fs.unlink(target).catch(() => {});
};

// PATCH /api/admin/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatarUrl } = req.body;

    if (email !== req.admin.email) {
      const existing = await adminModel.findByEmail(email);
      if (existing && existing.id !== req.admin.id) {
        throw new AppError("That email address is already in use.", 409);
      }
    }

    const previousAvatarUrl = req.admin.avatar_url;

    await adminModel.updateProfile(req.admin.id, {
      name,
      email,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : previousAvatarUrl,
    });

    // The photo was replaced or removed, so the old file is orphaned. Clean it
    // up after the row is safely saved, never before.
    if (avatarUrl !== undefined && avatarUrl !== previousAvatarUrl) {
      await removeUploadedAvatar(previousAvatarUrl);
    }

    const admin = await adminModel.findById(req.admin.id);

    return sendSuccess(res, 200, "Profile saved.", {
      admin: {
        ...adminModel.publicAdmin(admin),
        isActive: Boolean(admin.is_active),
        createdAt: admin.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/profile/avatar
//
// Returns the path to store, not the file. The form saves that path with the
// rest of the profile, the same way a case study's image upload works.
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Please choose an image to upload.", 400);
    }

    return sendSuccess(res, 201, "Photo uploaded.", {
      avatarUrl: `/uploads/admins/${req.file.filename}`,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/password
//
// Lets the signed-in admin set a new password directly from the profile page,
// without going through the emailed OTP - they already proved who they are by
// being logged in. The session cookie is left alone, so the popup can close
// and leave them right where they were.
export const changePassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError("Passwords do not match.", 400, {
        confirmPassword: "Passwords do not match.",
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await adminModel.updatePassword(req.admin.id, passwordHash);

    return sendSuccess(res, 200, "Password updated.");
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Dashboard loaded.", {
      admin: adminModel.publicAdmin(req.admin),
      account: {
        isActive: Boolean(req.admin.is_active),
        createdAt: req.admin.created_at,
        updatedAt: req.admin.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

// How far back the charts look. 90 days is fetched in one go and the panel
// narrows it to 7 or 30 in the browser, so changing the range on the dashboard
// is instant instead of another round trip.
const RANGE_DAYS = 90;
const TREND_DAYS = 30;
const TOP_SERVICES = 6;
const RECENT_ENQUIRIES = 6;

// Midnight UTC, `days` ago. Everything the dashboard counts is bucketed by UTC
// day, so the window has to start on one too - a cut-off at the current time
// of day would make the oldest bucket a partial day and put a dip at the left
// edge of every chart.
const utcMidnightDaysAgo = (days) => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days)
  );
};

// The YYYY-MM-DD key a day is filed under.
//
// Two shapes arrive here. mysql2 turns a DATE result into a Date built at
// *local* midnight, so its local parts are the ones to read - toISOString()
// would move the day for anyone west of UTC. SQLite hands the same value back
// as a string that is already in this format.
const toDayKey = (value) => {
  if (value instanceof Date) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }
  return String(value).slice(0, 10);
};

// Every day in the window, oldest first, with the counts dropped in and the
// quiet days left as zeros. A chart has to plot the days nothing happened -
// skipping them would draw a busy fortnight and a quiet one as the same shape.
const fillDays = (rows, days) => {
  const counts = new Map(rows.map((row) => [toDayKey(row.day), Number(row.total)]));
  const start = utcMidnightDaysAgo(days - 1);

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(start.getTime() + index * 86400000)
      .toISOString()
      .slice(0, 10);

    return { day, total: counts.get(day) ?? 0 };
  });
};

// GROUP BY only returns the statuses something is sitting in. Start every one
// at zero so a card never vanishes when its status empties out.
const tallyStatuses = (rows, statuses) => {
  const byStatus = Object.fromEntries(statuses.map((status) => [status, 0]));
  let total = 0;

  for (const row of rows) {
    byStatus[row.status] = Number(row.total);
    total += Number(row.total);
  }

  return { total, byStatus };
};

// GET /api/admin/dashboard/overview
//
// Everything the dashboard draws, in one response.
//
// It is one endpoint rather than eight because the page needs all of it at
// once and would otherwise open eight connections to render a single screen.
// The queries run in parallel, so the response costs about as long as its
// slowest query rather than the sum of them.
export const getDashboardOverview = async (req, res, next) => {
  try {
    const rangeStart = utcMidnightDaysAgo(RANGE_DAYS - 1);

    // The two windows the headline delta compares. `previousStart` reaches
    // back another 30 days, and the older window stops where the current one
    // begins, so no enquiry is counted in both.
    const currentStart = utcMidnightDaysAgo(TREND_DAYS - 1);
    const previousStart = utcMidnightDaysAgo(TREND_DAYS * 2 - 1);

    const [
      statusRows,
      dayRows,
      serviceRows,
      recentRows,
      currentPeriod,
      previousPeriod,
      caseStudyRows,
      blogRows,
    ] = await Promise.all([
      enquiryModel.countByStatus(),
      enquiryModel.countByDay(rangeStart),
      enquiryModel.countByService(rangeStart, TOP_SERVICES),
      enquiryModel.findRecent(RECENT_ENQUIRIES),
      enquiryModel.countCreatedBetween(currentStart),
      enquiryModel.countCreatedBetween(previousStart, currentStart),
      caseStudyModel.countByStatus(),
      blogModel.countByStatus(),
    ]);

    const enquiries = tallyStatuses(statusRows, ENQUIRY_STATUSES);

    return sendSuccess(res, 200, "Overview loaded.", {
      rangeDays: RANGE_DAYS,
      enquiries: {
        ...enquiries,
        // The same number the notification bell shows: an enquiry stays NEW
        // until an admin moves it on.
        unread: enquiries.byStatus.NEW,
        byDay: fillDays(dayRows, RANGE_DAYS),
        byService: serviceRows.map((row) => ({
          service: row.service,
          total: Number(row.total),
        })),
        recent: recentRows.map(toApiEnquiry),
        periods: {
          days: TREND_DAYS,
          current: Number(currentPeriod),
          previous: Number(previousPeriod),
        },
      },
      caseStudies: tallyStatuses(caseStudyRows, CASE_STUDY_STATUSES),
      blog: tallyStatuses(blogRows, BLOG_POST_STATUSES),
    });
  } catch (error) {
    next(error);
  }
};
