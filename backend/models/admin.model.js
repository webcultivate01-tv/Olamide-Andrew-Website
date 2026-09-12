import { pool } from "../config/db.js";

// All the MySQL queries for the `admins` table live here.
//
// Notice every query uses ? placeholders and passes the values in an array.
// mysql2 escapes them, which is what protects us from SQL injection. Never
// build a query by joining strings together.

export const findByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

export const updatePassword = async (id, passwordHash) => {
  const [result] = await pool.query(
    "UPDATE admins SET password_hash = ? WHERE id = ?",
    [passwordHash, id]
  );
  return result.affectedRows === 1;
};

export const createAdmin = async (email, passwordHash, role = "admin") => {
  const [result] = await pool.query(
    "INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?)",
    [email, passwordHash, role]
  );
  return result.insertId;
};

// The profile page: a name, an email and a photo. Password lives behind its
// own OTP-gated flow and is never touched here.
export const updateProfile = async (id, { name, email, avatarUrl }) => {
  const [result] = await pool.query(
    "UPDATE admins SET name = ?, email = ?, avatar_url = ? WHERE id = ?",
    [name, email, avatarUrl, id]
  );
  return result.affectedRows === 1;
};

// A database row holds password_hash, which must never be sent to the browser.
// Controllers use this to pick out only the safe fields.
export const publicAdmin = (admin) => {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    avatarUrl: admin.avatar_url,
    role: admin.role,
  };
};
