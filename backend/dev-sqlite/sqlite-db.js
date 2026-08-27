import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { hashPassword } from "../utils/password.js";
import { CASE_STUDIES } from "../database/seed/case-studies.data.js";

// A stand-in for config/db.js, backed by the SQLite that ships inside Node.
//
// This machine has no MySQL server, so nothing in backend/ that touches the
// database can be started. This file exports the same `pool.query(sql, values)
// -> [rows]` shape mysql2 does, so the models' real SQL still runs, unchanged,
// against a local file. It is loaded in place of config/db.js by hooks.mjs -
// nothing imports it directly, and the production path stays MySQL.
//
// Run with:  npm run dev:sqlite

const here = path.dirname(fileURLToPath(import.meta.url));
const dbFile = process.env.SQLITE_FILE || path.join(here, "dev.db");
const migrationsDir = path.join(here, "..", "database", "migrations");

const db = new DatabaseSync(dbFile);
db.exec("PRAGMA foreign_keys = ON");

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

// The migrations are written in MySQL DDL. SQLite understands most of it; the
// rest is rewritten here rather than kept as a second copy of the schema that
// could quietly drift away from the real one.
const toSqliteDdl = (sql, table) => {
  const indexes = [];

  let out = sql
    // INDEX lives outside the table in SQLite, so pull each one out and turn
    // it into its own CREATE INDEX below.
    .replace(/^\s*INDEX\s+(\w+)\s*\(([^)]*)\),?\s*$/gim, (line, name, columns) => {
      indexes.push(`CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${columns});`);
      return "";
    })
    // No ENUM type - the status values are checked by the zod validator anyway.
    .replace(/ENUM\s*\([^)]*\)/gis, "TEXT")
    .replace(/\bINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT")
    // Handled by a trigger further down.
    .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, "")
    .replace(/\)\s*ENGINE\s*=\s*InnoDB[^;]*/gi, ")");

  // Removing the INDEX lines can leave a comma dangling before the closing
  // bracket, which SQLite will not parse.
  //
  // Each comment has to be matched all the way to its newline. Allowing one to
  // stop early lets a ")" written *inside* a comment - "-- an upload
  // (/uploads/blog/...)" - stand in for the closing bracket, and the comma
  // stripped then is a real one separating two columns.
  out = out.replace(/,(\s*(?:--[^\n]*\n\s*)*)\)/g, "$1)");

  return [out, ...indexes].join("\n");
};

const applyMigrations = () => {
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const table = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i)?.[1];

    if (!table) {
      throw new Error(`Cannot find the table name in migration ${file}`);
    }

    db.exec(toSqliteDdl(sql, table));
  }

  // MySQL's ON UPDATE CURRENT_TIMESTAMP, written out by hand.
  for (const table of ["admins", "enquiries", "case_studies", "blog_posts"]) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS ${table}_updated_at
      AFTER UPDATE ON ${table}
      FOR EACH ROW BEGIN
        UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END
    `);
  }
};

// The same first admin database/seed/admin.seed.js creates, so the login page
// works the moment the server is up.
const seedAdmin = async () => {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123";

  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (existing) return;

  const passwordHash = await hashPassword(password);
  db.prepare("INSERT INTO admins (email, password_hash, role, is_active) VALUES (?, ?, 'admin', 1)")
    .run(email, passwordHash);

  console.log(`[sqlite] seeded admin ${email} / ${password}`);
};

// The same four studies database/seed/case-studies.seed.js inserts, so the
// website's portfolio is not empty when the panel is run against SQLite.
const seedCaseStudies = () => {
  for (const study of CASE_STUDIES) {
    const existing = db.prepare("SELECT id FROM case_studies WHERE slug = ?").get(study.slug);
    if (existing) continue;

    db.prepare(
      `INSERT INTO case_studies
         (title, slug, client, service, summary, image_url, image_alt, status, sort_order, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, datetime('now'))`
    ).run(
      study.title,
      study.slug,
      study.client,
      study.service,
      study.summary,
      study.imageUrl,
      study.imageAlt,
      study.sortOrder
    );

    console.log(`[sqlite] seeded case study ${study.slug}`);
  }
};

applyMigrations();
await seedAdmin();
seedCaseStudies();

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// The handful of places the models' MySQL does not mean the same thing here.
const toSqliteQuery = (sql) => {
  return sql
    // "created_at > (NOW() - INTERVAL ? MINUTE)". The placeholder stays where
    // it is, so the values array still lines up.
    .replace(/NOW\(\)\s*-\s*INTERVAL\s*\?\s*MINUTE/gi, "datetime('now', '-' || ? || ' minutes')")
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    // MySQL treats \ as the escape character inside LIKE by default and the
    // enquiry search relies on that to escape % and _. SQLite does not, unless
    // it is told to.
    .replace(/\bLIKE\s+\?/gi, String.raw`LIKE ? ESCAPE '\'`);
};

// SQLite takes numbers, strings, null and buffers - not booleans or Dates.
const toValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace("T", " ");
  return value;
};

const TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

// mysql2 hands back Date objects for DATETIME/TIMESTAMP columns and the app
// expects that, so turn the stored UTC strings back into Dates.
const fromRow = (row) => {
  for (const [column, value] of Object.entries(row)) {
    if (typeof value === "string" && TIMESTAMP.test(value)) {
      row[column] = new Date(`${value}Z`);
    }
  }
  return row;
};

const isRead = (sql) => /^\s*(SELECT|WITH|PRAGMA)/i.test(sql);

export const pool = {
  // Same contract as mysql2's pool.query: [rows] for a SELECT, [resultHeader]
  // for anything that changes rows.
  query: async (sql, values = []) => {
    const statement = db.prepare(toSqliteQuery(sql));
    const params = values.map(toValue);

    if (isRead(sql)) {
      return [statement.all(...params).map(fromRow), []];
    }

    const result = statement.run(...params);
    return [
      { affectedRows: Number(result.changes), insertId: Number(result.lastInsertRowid) },
      [],
    ];
  },
};

export const testConnection = async () => {
  db.prepare("SELECT 1").get();
};

export const closePool = async () => {
  db.close();
};
