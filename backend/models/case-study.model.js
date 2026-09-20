import { pool } from "../config/db.js";

// All the MySQL queries for the `case_studies` table.
//
// Same rules as the other models: every value goes in through a ? placeholder,
// and the column list is written out rather than SELECT *.

// The two states a study can be in. Exported so the validator, the stats
// endpoint and the frontend labels all work from one list.
export const CASE_STUDY_STATUSES = ["DRAFT", "PUBLISHED"];

const COLUMNS = `
  id, title, slug, client, service, summary, image_url, image_alt,
  status, sort_order, published_at, created_at, updated_at,
  tagline, categories, intro
`;

// The ordered body of a study's detail page.
const BLOCK_COLUMNS = `
  id, case_study_id, sort_order, type, layout, category, variant,
  heading, body, image_url, image_alt, color_hex
`;

// The website's order: lowest sort_order first, then newest, so two studies
// left at the default 0 still come out in a sensible order instead of whatever
// MySQL feels like.
const ORDER_BY = "ORDER BY sort_order ASC, published_at DESC, id DESC";

// % and _ are wildcards inside LIKE, so escape those and the backslash that
// escapes them before wrapping the term in its own wildcards.
const likeTerm = (search) => {
  const escaped = search.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
};

// Builds the WHERE clause for the admin list. The list query and the count
// query share it, so the two can never disagree about how many rows match.
const buildFilter = ({ status, search }) => {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  if (search) {
    conditions.push("(title LIKE ? OR client LIKE ? OR service LIKE ? OR summary LIKE ?)");
    const term = likeTerm(search);
    values.push(term, term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, values };
};

export const createCaseStudy = async (study) => {
  const [result] = await pool.query(
    `INSERT INTO case_studies
       (title, slug, client, service, summary, image_url, image_alt, status, sort_order, published_at,
        tagline, categories, intro)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      study.title,
      study.slug,
      study.client,
      study.service,
      study.summary,
      study.imageUrl,
      study.imageAlt,
      study.status,
      study.sortOrder,
      study.publishedAt,
      study.tagline,
      study.categories,
      study.intro,
    ]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM case_studies WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const findBySlug = async (slug) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM case_studies WHERE slug = ? LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

// Whether some *other* row already uses this slug. `excludeId` is the study
// being edited, which is allowed to keep the slug it already has.
export const slugExists = async (slug, excludeId = null) => {
  const [rows] = await pool.query(
    "SELECT id FROM case_studies WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, excludeId ?? 0]
  );
  return rows.length > 0;
};

// One page for the admin list. `limit` and `offset` are whole numbers by the
// time they get here - the validator coerced and bounded them.
export const findCaseStudies = async ({ status, search, limit, offset }) => {
  const { where, values } = buildFilter({ status, search });

  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM case_studies
     ${where}
     ${ORDER_BY}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
};

export const countCaseStudies = async ({ status, search }) => {
  const { where, values } = buildFilter({ status, search });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM case_studies ${where}`,
    values
  );
  return rows[0].total;
};

// What the public website asks for: published rows only, in display order.
// There is no paging here on purpose - this is a hand-curated portfolio, not a
// feed, and the grid shows all of it.
export const findPublished = async () => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM case_studies WHERE status = 'PUBLISHED' ${ORDER_BY}`
  );
  return rows;
};

export const findPublishedBySlug = async (slug) => {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM case_studies WHERE slug = ? AND status = 'PUBLISHED' LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

// A full replace of the editable fields. The controller has already merged the
// form values over the existing row, so every column here has a value.
export const updateCaseStudy = async (id, study) => {
  const [result] = await pool.query(
    `UPDATE case_studies SET
       title = ?, slug = ?, client = ?, service = ?, summary = ?,
       image_url = ?, image_alt = ?, status = ?, sort_order = ?, published_at = ?,
       tagline = ?, categories = ?, intro = ?
     WHERE id = ?`,
    [
      study.title,
      study.slug,
      study.client,
      study.service,
      study.summary,
      study.imageUrl,
      study.imageAlt,
      study.status,
      study.sortOrder,
      study.publishedAt,
      study.tagline,
      study.categories,
      study.intro,
      id,
    ]
  );
  return result.affectedRows === 1;
};

// Used by the publish/unpublish toggle on the list, which changes nothing else.
export const updateStatus = async (id, status, publishedAt) => {
  const [result] = await pool.query(
    "UPDATE case_studies SET status = ?, published_at = ? WHERE id = ?",
    [status, publishedAt, id]
  );
  return result.affectedRows === 1;
};

export const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM case_studies WHERE id = ?", [id]);
  return result.affectedRows === 1;
};

// One row per status that actually occurs; the controller fills in the zeros.
export const countByStatus = async () => {
  const [rows] = await pool.query(
    "SELECT status, COUNT(*) AS total FROM case_studies GROUP BY status"
  );
  return rows;
};

// The number to drop a brand new study at: the end of the list.
export const nextSortOrder = async () => {
  const [rows] = await pool.query("SELECT MAX(sort_order) AS max FROM case_studies");
  return (rows[0].max ?? -1) + 1;
};

// ---------------------------------------------------------------------------
// Content blocks — the body of a study's detail page.
// ---------------------------------------------------------------------------

export const findBlocksByCaseStudyId = async (caseStudyId) => {
  const [rows] = await pool.query(
    `SELECT ${BLOCK_COLUMNS} FROM case_study_blocks
     WHERE case_study_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [caseStudyId]
  );
  return rows;
};

// A full replace: every existing block is dropped and the list sent in is
// inserted in its place, in the order given. Simpler than diffing an old set
// of blocks against a new one, and the admin form always has the whole list
// in hand anyway — there is no partial "edit block 3" interaction to support.
export const replaceBlocks = async (caseStudyId, blocks) => {
  await pool.query("DELETE FROM case_study_blocks WHERE case_study_id = ?", [caseStudyId]);

  for (const [index, block] of blocks.entries()) {
    await pool.query(
      `INSERT INTO case_study_blocks
         (case_study_id, sort_order, type, layout, category, variant, heading, body, image_url, image_alt, color_hex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        caseStudyId,
        index,
        block.type,
        block.layout,
        block.category,
        block.variant,
        block.heading,
        block.body,
        block.imageUrl,
        block.imageAlt,
        block.colorHex,
      ]
    );
  }
};
