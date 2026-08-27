import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

// Creates the database if needed, then runs every .sql file in ./migrations
// in order. Already applied files are remembered in a `schema_migrations`
// table, so running this again is safe.
//
// Run with:  npm run db:migrate

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

const run = async () => {
  // This first connection has no `database` on purpose - the database may not
  // exist yet, and connecting to one that is missing fails.
  const setup = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });

  // The name comes from .env, never from a request, so putting it in the
  // string is safe here. MySQL cannot use a ? placeholder for a table or
  // database name anyway.
  await setup.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``);
  await setup.end();
  console.log(`Database ready: ${env.db.name}`);

  const db = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [doneRows] = await db.query("SELECT filename FROM schema_migrations");
  const alreadyDone = doneRows.map((row) => row.filename);

  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;

  for (const file of files) {
    if (alreadyDone.includes(file)) {
      console.log(`skipped  ${file} (already applied)`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await db.query(sql);
    await db.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);

    console.log(`applied  ${file}`);
    count++;
  }

  await db.end();
  console.log(count === 0 ? "Schema already up to date." : `${count} migration(s) applied.`);
};

run().catch((error) => {
  console.error("Migration failed:", error.message || error.code);
  process.exit(1);
});
