import { pool } from "../config/db.js";

// All the MySQL queries for the `password_reset_otps` table.
//
// The life of one row:
//   created on "forgot password"  ->  attempts +1 on each wrong guess
//   ->  is_used = TRUE once verified  ->  deleted once the password is reset

// Deletes any OTPs an admin already has. Called before making a new one (so a
// new code cancels the old one) and after a successful reset.
export const deleteAllForAdmin = async (adminId) => {
  const [result] = await pool.query(
    "DELETE FROM password_reset_otps WHERE admin_id = ?",
    [adminId]
  );
  return result.affectedRows;
};

export const createOtp = async (adminId, otpHash, expiresAt) => {
  const [result] = await pool.query(
    "INSERT INTO password_reset_otps (admin_id, otp_hash, expires_at) VALUES (?, ?, ?)",
    [adminId, otpHash, expiresAt]
  );
  return result.insertId;
};

// The newest OTP for this admin that has not been used yet.
// Expired ones are still returned, so the service can say "expired" instead of
// pretending the code never existed.
export const findLatestUnused = async (adminId) => {
  const [rows] = await pool.query(
    `SELECT * FROM password_reset_otps
     WHERE admin_id = ? AND is_used = FALSE
     ORDER BY id DESC
     LIMIT 1`,
    [adminId]
  );
  return rows[0] || null;
};

export const findOtpById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM password_reset_otps WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

export const increaseAttempts = async (id) => {
  await pool.query(
    "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?",
    [id]
  );
};

// Marks the OTP as used so it can never be verified a second time.
export const markAsUsed = async (id) => {
  const [result] = await pool.query(
    "UPDATE password_reset_otps SET is_used = TRUE WHERE id = ? AND is_used = FALSE",
    [id]
  );
  // affectedRows is 0 if another request already used it a moment ago.
  return result.affectedRows === 1;
};

// How many OTPs this admin has asked for recently. Used to stop someone
// flooding one inbox with reset emails.
export const countRecentOtps = async (adminId, minutes) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM password_reset_otps
     WHERE admin_id = ? AND created_at > (NOW() - INTERVAL ? MINUTE)`,
    [adminId, minutes]
  );
  return rows[0].total;
};
