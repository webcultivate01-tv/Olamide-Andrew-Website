import * as enquiryModel from "../models/enquiry.model.js";
import { ENQUIRY_STATUSES } from "../models/enquiry.model.js";
import * as realtime from "../services/realtime.service.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Everything the enquiry feature does.
//
// The first handler is the public one - it is the only endpoint on this API a
// stranger can reach that writes to the database. All the rest sit behind
// requireAuth on the /api/admin router.

// A database row uses snake_case and carries a MySQL Date object. The panel
// wants camelCase and an ISO string it can format in the browser's own
// timezone, so every response goes through here.
const toApiEnquiry = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  company: row.company,
  subject: row.subject,
  service: row.service,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// POST /api/enquiries
//
// No login. The rate limiter on the route and the schema on the body are what
// stand between this and the table.
//
// Note what is *not* done here: the message is stored exactly as it was typed,
// tags and all. Stripping HTML on the way in would quietly corrupt an honest
// message that happens to contain a < sign, and it is not where the safety
// comes from anyway - React escapes every value it renders, so the admin panel
// shows `<script>` as those nine characters and never as a script. Escape on
// output, store the truth.
export const createEnquiry = async (req, res, next) => {
  try {
    const id = await enquiryModel.createEnquiry(req.body);
    const enquiry = await enquiryModel.findById(id);

    // Tell every open admin panel. This runs after the row is safely in MySQL,
    // so a notification can never describe an enquiry that was not saved.
    realtime.emitNewEnquiry(toApiEnquiry(enquiry));

    // The visitor is told their message arrived and nothing else. Sending the
    // row back would hand out the id and status of an internal record for no
    // reason.
    return sendSuccess(res, 201, "Thanks - your enquiry has been received. I'll be in touch shortly.");
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/enquiries?page=&perPage=&status=&search=
export const listEnquiries = async (req, res, next) => {
  try {
    const { page, perPage, status, search } = req.validQuery;
    const offset = (page - 1) * perPage;

    // Both queries use the same filter, so they always agree on the total.
    const [rows, total] = await Promise.all([
      enquiryModel.findEnquiries({ status, search, limit: perPage, offset }),
      enquiryModel.countEnquiries({ status, search }),
    ]);

    return sendSuccess(res, 200, "Enquiries loaded.", {
      enquiries: rows.map(toApiEnquiry),
      pagination: {
        page,
        perPage,
        total,
        // At least 1, so an empty table still reads as "page 1 of 1" rather
        // than "page 1 of 0".
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/enquiries/stats
//
// Feeds the cards at the top of the page and the count on the notification
// bell. `new` is the unread count: an enquiry stays NEW until an admin moves
// it on, which is what makes the badge survive a page refresh without a
// separate notifications table.
export const getEnquiryStats = async (req, res, next) => {
  try {
    const rows = await enquiryModel.countByStatus();

    // GROUP BY only returns statuses something is actually sitting in. Start
    // every status at zero so the cards do not disappear when a status empties.
    const byStatus = Object.fromEntries(ENQUIRY_STATUSES.map((status) => [status, 0]));
    let total = 0;

    for (const row of rows) {
      byStatus[row.status] = row.total;
      total += row.total;
    }

    return sendSuccess(res, 200, "Stats loaded.", {
      total,
      byStatus,
      unread: byStatus.NEW,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/enquiries/:id
export const getEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryModel.findById(req.validParams.id);

    if (!enquiry) {
      throw new AppError("Enquiry not found.", 404);
    }

    return sendSuccess(res, 200, "Enquiry loaded.", { enquiry: toApiEnquiry(enquiry) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/enquiries/:id/status
export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.validParams;
    const { status } = req.body;

    // Check the row exists first. UPDATE reports 0 changed rows both for an id
    // that is missing and for a status that was already set to that value, so
    // it cannot tell those two apart on its own.
    const existing = await enquiryModel.findById(id);
    if (!existing) {
      throw new AppError("Enquiry not found.", 404);
    }

    await enquiryModel.updateStatus(id, status);
    const enquiry = await enquiryModel.findById(id);

    // Moving an enquiry off NEW changes the unread count, so any other tab
    // this admin has open needs to hear about it.
    realtime.emitEnquiriesChanged({ id, action: "status", status });

    return sendSuccess(res, 200, "Status updated.", { enquiry: toApiEnquiry(enquiry) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/enquiries/:id
export const deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.validParams;

    const deleted = await enquiryModel.deleteById(id);
    if (!deleted) {
      throw new AppError("Enquiry not found.", 404);
    }

    realtime.emitEnquiriesChanged({ id, action: "deleted" });

    return sendSuccess(res, 200, "Enquiry deleted.");
  } catch (error) {
    next(error);
  }
};
