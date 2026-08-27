import * as adminModel from "../models/admin.model.js";
import * as enquiryModel from "../models/enquiry.model.js";
import * as caseStudyModel from "../models/case-study.model.js";
import * as blogModel from "../models/blog-post.model.js";
import { ENQUIRY_STATUSES } from "../models/enquiry.model.js";
import { CASE_STUDY_STATUSES } from "../models/case-study.model.js";
import { BLOG_POST_STATUSES } from "../models/blog-post.model.js";
import { sendSuccess } from "../utils/response.js";

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
