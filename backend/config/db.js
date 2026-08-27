import mysql from "mysql2/promise";
import { env } from "./env.js";

// One shared connection pool for the whole app. Every model uses this.
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Queries always use ? placeholders, so one query = one statement.
  // Keeping this off means an injection can never chain a second statement.
  multipleStatements: false,
});

// Called once when the server starts, so a wrong DB setting is reported
// straight away with a clear message.
export const testConnection = async () => {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
};

export const closePool = async () => {
  await pool.end();
};
