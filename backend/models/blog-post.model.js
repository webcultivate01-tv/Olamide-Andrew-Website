import { pool } from "../config/db.js";

// All the MySQL queries for the `blog_posts` table.
//
// Same rules as the other models: every value goes in through a ? placeholder,
// and the column list is written out rather than SELECT *.

// The two states a post can be in. Exported so the validator, the stats
// endpoint and the frontend labels all work from one list.
export const BLOG_POST_STATUSES = ["DRAFT", "PUBLISHED"];

// `content` is deliberately left out. It is the whole body of the post, and a
// list of twenty of them would move a lot of text nobody on that screen reads.
// The two single-post lookups below add it back.
const LIST_COLUMNS = `
  id, title, slug, excerpt, author, tags, cover_image_url, cover_image_alt,
  reading_time, status, published_at, created_at, updated_at
`;

const FULL_COLUMNS = `${LIST_COLUMNS}, content`;

// The ordered set pieces above a post's body.
const BLOCK_COLUMNS = `
  id, blog_post_id, sort_order, type, layout, category, variant,
  heading, body, image_url, image_alt, color_hex
`;

// Newest first. A draft has no published_at at all, so created_at is the
// tie-breaker that keeps unpublished posts in a sensible order on the admin
// list instead of bunched at one end.
const ORDER_BY = "ORDER BY COALESCE(published_at, created_at) DESC, id DESC";

// % and _ are wildcards inside LIKE, so escape those and the backslash that
// escapes them before wrapping the term in its own wildcards.
const likeTerm = (search) => {
  const escaped = search.replace(/[\%_]/g, (character) => `\${character}`);
  return `%${escaped}%`;
};

// Builds the WHERE clause for the admin list. The list query and the count
// query share it, so the two can never disagree about how many rows match.
const buildFilter = ({ status, tag, search }) => {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  // tags is stored as "design,process,tools", so an exact tag is one of four
  // positions: the only tag, the first, the last, or somewhere in the middle.
  // Spelling all four out is what stops "design" also matching
  // "design-systems" - the search below is the loose one, this is the exact
  // one. It is written this way rather than as CONCAT(',', tags, ',') LIKE ?
  // because the SQLite stand-in used in development has no CONCAT.
  //
  // The tag has been through the validator's slug pattern by now, so it holds
  // no % or _ of its own to escape.
  if (tag) {
    conditions.push("(tags = ? OR tags LIKE ? OR tags LIKE ? OR tags LIKE ?)");
    values.push(tag, `${tag},%`, `%,${tag}`, `%,${tag},%`);
  }

  if (search) {
    conditions.push("(title LIKE ? OR excerpt LIKE ? OR author LIKE ? OR tags LIKE ? OR content LIKE ?)");
    const term = likeTerm(search);
    values.push(term, term, term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, values };
};

export const createBlogPost = async (post) => {
  const [result] = await pool.query(
    `INSERT INTO blog_posts
       (title, slug, excerpt, content, author, tags, cover_image_url,
        cover_image_alt, reading_time, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.title,
      post.slug,
      post.excerpt,
      post.content,
      post.author,
      post.tags,
      post.coverImageUrl,
      post.coverImageAlt,
      post.readingTime,
      post.status,
      post.publishedAt,
    ]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${FULL_COLUMNS} FROM blog_posts WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// Whether some *other* row already uses this slug. `excludeId` is the post
// being edited, which is allowed to keep the slug it already has.
export const slugExists = async (slug, excludeId = null) => {
  const [rows] = await pool.query(
    "SELECT id FROM blog_posts WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, excludeId ?? 0]
  );
  return rows.length > 0;
};

// One page for the admin list. `limit` and `offset` are whole numbers by the
// time they get here - the validator coerced and bounded them.
export const findBlogPosts = async ({ status, tag, search, limit, offset }) => {
  const { where, values } = buildFilter({ status, tag, search });

  const [rows] = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM blog_posts
     ${where}
     ${ORDER_BY}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
};

export const countBlogPosts = async ({ status, tag, search }) => {
  const { where, values } = buildFilter({ status, tag, search });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM blog_posts ${where}`,
    values
  );
  return rows[0].total;
};

// What the public website asks for. Paged, unlike the case study grid: a blog
// grows without limit, and page 1 of it must not get slower every time
// something is published.
export const findPublished = async ({ tag, limit, offset }) => {
  const { where, values } = buildFilter({ status: "PUBLISHED", tag });

  const [rows] = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM blog_posts
     ${where}
     ${ORDER_BY}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
};

export const countPublished = async ({ tag }) => {
  const { where, values } = buildFilter({ status: "PUBLISHED", tag });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM blog_posts ${where}`,
    values
  );
  return rows[0].total;
};

// The reader's page, so the body comes too.
export const findPublishedBySlug = async (slug) => {
  const [rows] = await pool.query(
    `SELECT ${FULL_COLUMNS} FROM blog_posts WHERE slug = ? AND status = 'PUBLISHED' LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

// A full replace of the editable fields. The controller has already merged the
// form values over the existing row, so every column here has a value.
export const updateBlogPost = async (id, post) => {
  const [result] = await pool.query(
    `UPDATE blog_posts SET
       title = ?, slug = ?, excerpt = ?, content = ?, author = ?, tags = ?,
       cover_image_url = ?, cover_image_alt = ?, reading_time = ?,
       status = ?, published_at = ?
     WHERE id = ?`,
    [
      post.title,
      post.slug,
      post.excerpt,
      post.content,
      post.author,
      post.tags,
      post.coverImageUrl,
      post.coverImageAlt,
      post.readingTime,
      post.status,
      post.publishedAt,
      id,
    ]
  );
  return result.affectedRows === 1;
};

// Used by the publish/unpublish toggle on the list, which changes nothing else.
export const updateStatus = async (id, status, publishedAt) => {
  const [result] = await pool.query(
    "UPDATE blog_posts SET status = ?, published_at = ? WHERE id = ?",
    [status, publishedAt, id]
  );
  return result.affectedRows === 1;
};

export const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM blog_posts WHERE id = ?", [id]);
  return result.affectedRows === 1;
};

// One row per status that actually occurs; the controller fills in the zeros.
export const countByStatus = async () => {
  const [rows] = await pool.query(
    "SELECT status, COUNT(*) AS total FROM blog_posts GROUP BY status"
  );
  return rows;
};

// ---------------------------------------------------------------------------
// Content blocks — the set pieces above a post's body.
// ---------------------------------------------------------------------------

export const findBlocksByBlogPostId = async (blogPostId) => {
  const [rows] = await pool.query(
    `SELECT ${BLOCK_COLUMNS} FROM blog_post_blocks
     WHERE blog_post_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [blogPostId]
  );
  return rows;
};

// A full replace: every existing block is dropped and the list sent in is
// inserted in its place, in the order given. Simpler than diffing an old set
// of blocks against a new one, and the admin form always has the whole list
// in hand anyway — there is no partial "edit block 3" interaction to support.
export const replaceBlocks = async (blogPostId, blocks) => {
  await pool.query("DELETE FROM blog_post_blocks WHERE blog_post_id = ?", [blogPostId]);

  for (const [index, block] of blocks.entries()) {
    await pool.query(
      `INSERT INTO blog_post_blocks
         (blog_post_id, sort_order, type, layout, category, variant, heading, body, image_url, image_alt, color_hex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blogPostId,
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

// Every tags value in use, for the filter dropdown. Splitting one comma-joined
// column per post into a list of distinct tags is the controller's job - SQL
// that does it is far harder to read than the loop that replaces it, and this
// is a few hundred short strings at the very most.
export const findAllTags = async ({ publishedOnly = false } = {}) => {
  const [rows] = await pool.query(
    `SELECT tags FROM blog_posts
     WHERE tags IS NOT NULL AND tags <> ''
     ${publishedOnly ? "AND status = 'PUBLISHED'" : ""}`
  );
  return rows;
};
