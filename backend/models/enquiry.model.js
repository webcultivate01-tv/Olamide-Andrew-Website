import { pool } from "../config/db.js";

// All the MySQL queries for the `enquiries` table.
//
// As in admin.model.js, every value goes in through a ? placeholder and never
// by joining strings together - that is what keeps SQL injection impossible.

// The five statuses the ENUM column accepts. Exported so the validator and the
// stats endpoint work from one list instead of three copies of it.
export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "CLOSED"];

// The columns the list and detail views need. Written out rather than SELECT *
// so a column added later cannot start leaking into API responses by accident.
const COLUMNS = `
  id, name, email, phone, company, subject, service, message,
  status, created_at, updated_at
`;

// % and _ are wildcards inside LIKE, so a visitor searching for "50%" would
// otherwise match far more than they meant. Escape those, and the backslash
// that escapes them, before wrapping the term in its own wildcards.
const likeTerm = (search) => {
  const escaped = search.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
};

// Turns the admin's filters into a WHERE clause plus the values that go with
// it. Both the list query and the count query need exactly the same filter,
// so building it once keeps the two from drifting apart.
const buildFilter = ({ status, search }) => {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  if (search) {
    conditions.push("(name LIKE ? OR email LIKE ? OR subject LIKE ? OR service LIKE ? OR company LIKE ? OR message LIKE ?)");
    const term = likeTerm(search);
    values.push(term, term, term, term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, values };
};

export const createEnquiry = async (enquiry) => {
  const [result] = await pool.query(
    `INSERT INTO enquiries (name, email, phone, company, subject, service, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      enquiry.name,
      enquiry.email,
      enquiry.phone,
      enquiry.company,
      enquiry.subject,
      enquiry.service,
      enquiry.message,
    ]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM enquiries WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// One page of enquiries, newest first.
//
// `limit` and `offset` are already whole numbers by the time they arrive - the
// validator coerced and bounded them - so they cannot smuggle anything into
// the query.
export const findEnquiries = async ({ status, search, limit, offset }) => {
  const { where, values } = buildFilter({ status, search });

  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM enquiries
     ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
};

// How many rows match the same filter, so the page count is right.
export const countEnquiries = async ({ status, search }) => {
  const { where, values } = buildFilter({ status, search });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM enquiries ${where}`,
    values
  );
  return rows[0].total;
};

export const updateStatus = async (id, status) => {
  const [result] = await pool.query(
    "UPDATE enquiries SET status = ? WHERE id = ?",
    [status, id]
  );
  // 0 when the id does not exist. MySQL also reports 0 when the status was
  // already the one asked for, which is why the controller checks the row
  // exists first rather than reading anything into this number.
  return result.affectedRows === 1;
};

export const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM enquiries WHERE id = ?", [id]);
  return result.affectedRows === 1;
};

// One row per status that actually occurs. The controller fills in the zeros
// for statuses nothing is sitting in yet.
export const countByStatus = async () => {
  const [rows] = await pool.query(
    "SELECT status, COUNT(*) AS total FROM enquiries GROUP BY status"
  );
  return rows;
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
//
// The cut-off for every query below arrives as a Date built in the controller
// rather than as SQL date arithmetic. MySQL and the SQLite stand-in spell
// "thirty days ago" differently, and a value in the placeholder is one thing
// neither of them can disagree about.

// How many enquiries arrived inside a window. `until` is exclusive, so two
// touching windows - this month and the one before it - cannot both count a
// row that landed on the boundary.
export const countCreatedBetween = async (since, until = null) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM enquiries
     WHERE created_at >= ?${until ? " AND created_at < ?" : ""}`,
    until ? [since, until] : [since]
  );
  return rows[0].total;
};

// One row per day that had at least one enquiry. Days with none are missing
// entirely - the controller fills those in, because a gap in a line chart has
// to be drawn as a zero and not as a shorter month.
//
// The grouping is by UTC date, which is what the column stores.
export const countByDay = async (since) => {
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS total
     FROM enquiries
     WHERE created_at >= ?
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [since]
  );
  return rows;
};

// Which services people are actually writing in about, most asked first.
//
// The service field is optional on the public form, so blanks are dropped
// rather than counted as a service called "".
export const countByService = async (since, limit) => {
  const [rows] = await pool.query(
    `SELECT service, COUNT(*) AS total
     FROM enquiries
     WHERE created_at >= ? AND service IS NOT NULL AND service <> ''
     GROUP BY service
     ORDER BY total DESC, service ASC
     LIMIT ?`,
    [since, limit]
  );
  return rows;
};

// The newest handful, for the dashboard's activity list. Same ordering as the
// enquiries table so the two never disagree about which one is latest.
export const findRecent = async (limit) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM enquiries ORDER BY created_at DESC, id DESC LIMIT ?`,
    [limit]
  );
  return rows;
};
