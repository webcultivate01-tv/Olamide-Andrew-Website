import { pool } from "../config/db.js";

// All the MySQL queries for the `categories` table.
//
// Same rules as every other model: every value goes in through a ?
// placeholder, never by joining strings together.

const COLUMNS = "id, name, slug, type, created_at, updated_at";

// % and _ are wildcards inside LIKE, so escape those and the backslash that
// escapes them before wrapping the term in its own wildcards.
const likeTerm = (search) => {
  const escaped = search.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
};

export const createCategory = async ({ name, slug, type }) => {
  const [result] = await pool.query(
    "INSERT INTO categories (name, slug, type) VALUES (?, ?, ?)",
    [name, slug, type]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM categories WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// Whether some *other* row already uses this slug. `excludeId` is the
// category being edited, which is allowed to keep the slug it already has.
export const slugExists = async (slug, excludeId = null) => {
  const [rows] = await pool.query(
    "SELECT id FROM categories WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, excludeId ?? 0]
  );
  return rows.length > 0;
};

// The whole list, alphabetical. A handful of categories at most - there is no
// paging here, the same way there is none on the tag list.
export const findCategories = async ({ search, type } = {}) => {
  const conditions = [];
  const values = [];

  if (type) {
    conditions.push("type = ?");
    values.push(type);
  }

  if (search) {
    conditions.push("(name LIKE ? OR slug LIKE ?)");
    const term = likeTerm(search);
    values.push(term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM categories ${where} ORDER BY name ASC`,
    values
  );
  return rows;
};

export const updateCategory = async (id, { name, slug }) => {
  const [result] = await pool.query(
    "UPDATE categories SET name = ?, slug = ? WHERE id = ?",
    [name, slug, id]
  );
  return result.affectedRows === 1;
};

export const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
  return result.affectedRows === 1;
};
