import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { testConnection, closePool } from "./config/db.js";
import { isDevMailMode } from "./config/mail.js";
import { initRealtime, closeRealtime } from "./services/realtime.service.js";

// Starts the server: check MySQL, then listen.

const start = async () => {
  try {
    await testConnection();
    console.log(`MySQL connected: ${env.db.name} at ${env.db.host}:${env.db.port}`);
  } catch (error) {
    // A refused connection has an empty message, so fall back to the code.
    console.error("Could not connect to MySQL:", error.message || error.code);
    console.error("Check the DB_ settings in backend/.env and that MySQL is running.");
    process.exit(1);
  }

  if (isDevMailMode) {
    console.log("SMTP is not configured - password reset OTPs will be printed here.");
  }

  // Express is wrapped in an explicit HTTP server so Socket.IO can attach to
  // the same one. app.listen() would build a server we never get a handle on,
  // leaving nothing for the realtime layer to hook into - and a second server
  // on a second port would mean a second origin to configure and allow.
  const server = http.createServer(app);
  initRealtime(server);

  server.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`Allowed frontend origin: ${env.frontendUrl}`);
    console.log("Socket.IO ready - admins are notified of new enquiries live.");
  });

  // On Ctrl+C, finish the current requests and close the MySQL pool properly.
  const shutdown = () => {
    console.log("\nShutting down...");
    // Open WebSockets keep the HTTP server from ever reporting itself closed,
    // so they have to go first or shutdown just hangs.
    closeRealtime().finally(() => {
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start();
