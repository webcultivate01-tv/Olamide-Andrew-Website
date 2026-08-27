import { Server } from "socket.io";
import * as cookie from "cookie";
import { env } from "../config/env.js";
import { verifyAuthToken } from "../utils/jwt.js";
import * as adminModel from "../models/admin.model.js";

// Pushes enquiry events to the admin panel over Socket.IO, so a new enquiry
// shows up in the notification bell without anyone reloading the page.
//
// Two things matter here:
//
//   1. A socket is authenticated exactly the way an HTTP request is. The
//      handshake carries the same session cookie, so it goes through the same
//      verify-token-then-re-read-the-account check requireAuth does. Skipping
//      that would hand anyone who can open a WebSocket a live feed of every
//      enquiry, walking straight around the login the REST routes enforce.
//
//   2. Sockets are a convenience, never the record. Every event below is a
//      hint that says "something changed, ask the API again". MySQL stays the
//      only source of truth, so a dropped connection or a missed event costs
//      the admin nothing beyond a slightly stale badge until the next fetch.

// Every authenticated admin is put in this one room, and events are sent to
// the room rather than to individual sockets. One admin with three tabs open
// is three sockets, and all three should light up together.
const ADMIN_ROOM = "admins";

let io = null;

// Reads the session cookie off the handshake and resolves it to an admin row,
// or null if there is no valid session behind it.
const authenticateSocket = async (socket) => {
  const header = socket.handshake.headers.cookie;
  if (!header) return null;

  const token = cookie.parse(header)[env.cookie.name];
  if (!token) return null;

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    // Bad signature or expired.
    return null;
  }

  // Re-read the account, so an admin disabled a minute ago is disconnected
  // now rather than whenever their token happens to run out.
  const admin = await adminModel.findById(payload.id);
  if (!admin || !admin.is_active) return null;

  return admin;
};

// Called once from server.js, with the same HTTP server Express is listening
// on - Socket.IO shares the port rather than opening a second one.
export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    // Socket.IO does its own CORS, separately from the cors() middleware in
    // app.js, and the handshake carries the session cookie - so this needs
    // the same single allowed origin and the same credentials flag.
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const admin = await authenticateSocket(socket);

      if (!admin) {
        // The client sees this as a connect_error and stops retrying.
        return next(new Error("Authentication required."));
      }

      socket.data.adminId = admin.id;
      return next();
    } catch (error) {
      console.error("[socket auth]", error);
      return next(new Error("Authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(ADMIN_ROOM);
  });

  return io;
};

// Fired when a visitor submits the public form. The payload carries enough to
// render a notification line; the panel refetches for anything more.
export const emitNewEnquiry = (enquiry) => {
  // Null before initRealtime runs, and after the server shuts down. Emitting
  // must never be the thing that breaks saving an enquiry.
  io?.to(ADMIN_ROOM).emit("new_enquiry", enquiry);
};

// Fired when an admin changes a status or deletes a row, so any *other* tab
// they have open corrects its list and its unread count too.
export const emitEnquiriesChanged = (change) => {
  io?.to(ADMIN_ROOM).emit("enquiries_changed", change);
};

export const closeRealtime = async () => {
  if (!io) return;
  await io.close();
  io = null;
};
