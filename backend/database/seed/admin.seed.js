import { pool, closePool } from "../../config/db.js";
import { hashPassword } from "../../utils/password.js";

// Creates the first admin account.
//
// The plain password only exists inside this script. What goes into MySQL is
// the bcrypt hash. Running this twice is safe: an admin that already exists is
// left alone, so a password you changed later is never reset back.
//
// Run with:  npm run db:seed

const EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin123";

const run = async () => {
  const [rows] = await pool.query("SELECT id FROM admins WHERE email = ? LIMIT 1", [EMAIL]);

  if (rows.length > 0) {
    console.log(`Admin already exists: ${EMAIL} (id ${rows[0].id}) - nothing to do.`);
    return;
  }

  const passwordHash = await hashPassword(PASSWORD);

  const [result] = await pool.query(
    "INSERT INTO admins (email, password_hash, role, is_active) VALUES (?, ?, 'admin', TRUE)",
    [EMAIL, passwordHash]
  );

  console.log(`Created admin: ${EMAIL} (id ${result.insertId})`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`Stored in MySQL as: ${passwordHash.slice(0, 20)}... (bcrypt hash)`);
  console.log("");
  console.log("These are development credentials. Change the password before");
  console.log("this database is used anywhere real.");
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message || error.code);
    process.exitCode = 1;
  })
  .finally(closePool);
