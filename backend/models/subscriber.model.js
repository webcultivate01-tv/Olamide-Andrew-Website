import { pool } from "../config/db.js";

// All the MySQL queries for the `subscribers` table.
//
// Same rules as every other model: every value goes in through a ?
// placeholder, never by joining strings together.

const COLUMNS = "id, email, created_at";

// % and _ are wildcards inside LIKE, so escape those and the backslash that
// escapes them before wrapping the term in its own wildcards.
const likeTerm = (search) => {
  const escaped = search.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
};

// "2026-03" -> the first instant of March and of April, in UTC. A range
// comparison rather than MySQL's DATE_FORMAT/YEAR() so the same SQL runs
// unchanged against the SQLite stand-in used in dev - see dev-sqlite/sqlite-db.js.
const monthRange = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return [start, end];
};

const buildFilter = ({ search, month }) => {
  const conditions = [];
  const values = [];

  if (search) {
    conditions.push("email LIKE ?");
    values.push(likeTerm(search));
  }

  if (month) {
    const [start, end] = monthRange(month);
    conditions.push("created_at >= ? AND created_at < ?");
    values.push(start, end);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, values };
};

export const createSubscriber = async (email) => {
  const [result] = await pool.query(
    "INSERT INTO subscribers (email) VALUES (?)",
    [email]
  );
  return result.insertId;
};

export const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM subscribers WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM subscribers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// One page of subscribers, newest first.
export const findSubscribers = async ({ search, month, limit, offset }) => {
  const { where, values } = buildFilter({ search, month });

  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM subscribers
     ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
};

export const countSubscribers = async ({ search, month }) => {
  const { where, values } = buildFilter({ search, month });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM subscribers ${where}`,
    values
  );
  return rows[0].total;
};

// Every matching row, for the CSV export - no paging, since the admin is
// downloading the whole filtered list rather than browsing it.
export const findAllForExport = async ({ search, month }) => {
  const { where, values } = buildFilter({ search, month });

  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM subscribers ${where} ORDER BY created_at DESC, id DESC`,
    values
  );
  return rows;
};

export const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM subscribers WHERE id = ?", [id]);
  return result.affectedRows === 1;
};
