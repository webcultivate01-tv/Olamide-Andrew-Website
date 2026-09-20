import PDFDocument from "pdfkit";
import * as subscriberModel from "../models/subscriber.model.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

// Everything the subscriber feature does.
//
// The first handler is the public one - it is the only endpoint on this API
// a stranger can reach that writes to the database. All the rest sit behind
// requireAuth on the /api/admin router.

const toApiSubscriber = (row) => ({
  id: row.id,
  email: row.email,
  createdAt: row.created_at,
});

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// POST /api/subscribers
//
// No login. The rate limiter on the route and the schema on the body are what
// stand between this and the table.
export const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Signing up twice is not an error the visitor typed anything wrong to
    // cause, so it gets the same friendly success rather than a 409 - the
    // form has nothing useful for them to fix.
    const existing = await subscriberModel.findByEmail(email);
    if (existing) {
      return sendSuccess(res, 200, "You're already subscribed - thanks for sticking around!");
    }

    await subscriberModel.createSubscriber(email);

    return sendSuccess(res, 201, "Thanks for subscribing! You'll hear from us soon.");
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/subscribers?page=&perPage=&search=&month=
export const listSubscribers = async (req, res, next) => {
  try {
    const { page, perPage, search, month } = req.validQuery;
    const offset = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      subscriberModel.findSubscribers({ search, month, limit: perPage, offset }),
      subscriberModel.countSubscribers({ search, month }),
    ]);

    return sendSuccess(res, 200, "Subscribers loaded.", {
      subscribers: rows.map(toApiSubscriber),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const TABLE_COLUMNS = [
  { label: "Email", width: 320 },
  { label: "Subscribed At", width: 160 },
];
const ROW_HEIGHT = 20;
const NAVY = "#17395A";

// One line describing which filters produced this file - printed under the
// title so a report downloaded today still explains itself if it is opened
// next month.
const describeFilters = ({ search, month }) => {
  const parts = [];
  if (search) parts.push(`search "${search}"`);
  if (month) {
    const label = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    parts.push(`month ${label}`);
  }
  return parts.length ? `Filtered by ${parts.join(" and ")}` : "All subscribers";
};

const drawTableHeader = (doc, x, y) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
  let cursor = x;
  for (const column of TABLE_COLUMNS) {
    doc.text(column.label, cursor, y, { width: column.width });
    cursor += column.width;
  }

  const tableWidth = TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);
  doc
    .moveTo(x, y + 16)
    .lineTo(x + tableWidth, y + 16)
    .strokeColor("#cccccc")
    .stroke();
};

// Builds the PDF straight onto the response stream - there is nothing to
// buffer, since pdfkit writes as it goes and Express happily streams it out.
const streamSubscribersPdf = (res, rows, filters) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(18).fillColor(NAVY).text("Newsletter Subscribers");
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#555555")
    .text(
      `${describeFilters(filters)}  ·  Generated ${new Date().toLocaleString()}  ·  ${rows.length} total`
    );
  doc.moveDown(0.8);

  const tableX = doc.page.margins.left;
  const bottom = doc.page.height - doc.page.margins.bottom;
  let y = doc.y;

  drawTableHeader(doc, tableX, y);
  y += ROW_HEIGHT + 4;

  doc.font("Helvetica").fontSize(9.5).fillColor("#111111");

  for (const row of rows) {
    if (y > bottom - ROW_HEIGHT) {
      doc.addPage();
      y = doc.page.margins.top;
      drawTableHeader(doc, tableX, y);
      y += ROW_HEIGHT + 4;
      doc.font("Helvetica").fontSize(9.5).fillColor("#111111");
    }

    doc.text(row.email, tableX, y, { width: TABLE_COLUMNS[0].width });
    doc.text(new Date(row.created_at).toLocaleString(), tableX + TABLE_COLUMNS[0].width, y, {
      width: TABLE_COLUMNS[1].width,
    });
    y += ROW_HEIGHT;
  }

  if (rows.length === 0) {
    doc.fillColor("#777777").text("No subscribers match this filter.", tableX, y);
  }

  doc.end();
};

// GET /api/admin/subscribers/export?search=&month=
//
// Same filters as the list, no paging - the admin gets every matching row in
// one PDF.
export const exportSubscribers = async (req, res, next) => {
  try {
    const { search, month } = req.validQuery;
    const rows = await subscriberModel.findAllForExport({ search, month });

    const filename = `subscribers-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    streamSubscribersPdf(res, rows, { search, month });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/subscribers/:id
export const deleteSubscriber = async (req, res, next) => {
  try {
    const { id } = req.validParams;

    const deleted = await subscriberModel.deleteById(id);
    if (!deleted) {
      throw new AppError("Subscriber not found.", 404);
    }

    return sendSuccess(res, 200, "Subscriber removed.");
  } catch (error) {
    next(error);
  }
};
