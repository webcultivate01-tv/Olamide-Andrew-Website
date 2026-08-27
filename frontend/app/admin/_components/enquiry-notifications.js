"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, getEnquiryStats } from "@/lib/api";

/**
 * Owns the one Socket.IO connection the admin panel needs, and the counts that
 * hang off it.
 *
 * There is a single provider, mounted by AdminShell, so every authenticated
 * page shares one socket instead of opening one each. Anything that needs to
 * know about new enquiries — the bell in the header, the table on the
 * enquiries page, the cards on the dashboard — reads from here.
 *
 * The socket is treated as a *hint*, never as data. An event says "something
 * changed"; the answer to "changed to what?" always comes from a fresh call to
 * the API. That is what makes a dropped connection harmless: the counts are
 * derived from MySQL on every page load, so the badge is right after a reload
 * whether or not a single event ever arrived.
 */

const EnquiryNotificationsContext = createContext(null);

export function EnquiryNotificationsProvider({ initialStats, children }) {
  // Seeded from the server render, so the bell shows the true count in the
  // first paint instead of a zero that corrects itself a moment later.
  const [stats, setStats] = useState(initialStats ?? null);
  const [connected, setConnected] = useState(false);

  // Bumped on every server event. The enquiries table watches this and
  // refetches, which keeps "when to reload the list" in one place instead of
  // wiring a second socket listener into the table.
  const [version, setVersion] = useState(0);

  // Enquiries that have arrived since this page was opened, so the panel can
  // say "2 new enquiries just arrived" rather than silently rearranging the
  // table under the admin's cursor while they are reading it.
  const [arrivals, setArrivals] = useState([]);

  // No dependencies, so this identity is stable and the socket effect below
  // can hold it without ever tearing the connection down to pick up a new one.
  const refresh = useCallback(async () => {
    try {
      const payload = await getEnquiryStats();
      setStats(payload.data);
    } catch {
      // Nearly always an expired session, and the page-level fetches handle
      // that by redirecting to the login screen. Leaving the last known counts
      // on screen beats blanking the header.
    }
  }, []);

  useEffect(() => {
    const socket = io(API_URL, {
      // The session cookie authenticates the handshake, and the browser will
      // not attach it to a cross-origin connection without this.
      withCredentials: true,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // The server refuses an unauthenticated handshake. There is nothing to
    // show the admin here — the page they are on does its own session check,
    // and quietly degrading to "the counts update on reload" is the right
    // outcome for a socket that cannot connect.
    socket.on("connect_error", () => setConnected(false));

    socket.on("new_enquiry", (enquiry) => {
      setArrivals((previous) => [enquiry, ...previous]);
      setVersion((previous) => previous + 1);
      refresh();
    });

    // Sent when an admin changes a status or deletes an enquiry. Its purpose
    // is the *other* tabs: the one that made the change already knows.
    socket.on("enquiries_changed", () => {
      setVersion((previous) => previous + 1);
      refresh();
    });

    return () => {
      socket.close();
    };
  }, [refresh]);

  const clearArrivals = useCallback(() => setArrivals([]), []);

  const value = useMemo(
    () => ({
      // Falls back to 0 rather than null so the header always has a number.
      unread: stats?.unread ?? 0,
      stats,
      version,
      arrivals,
      connected,
      refresh,
      clearArrivals,
    }),
    [stats, version, arrivals, connected, refresh, clearArrivals]
  );

  return (
    <EnquiryNotificationsContext.Provider value={value}>
      {children}
    </EnquiryNotificationsContext.Provider>
  );
}

export function useEnquiryNotifications() {
  const context = useContext(EnquiryNotificationsContext);

  if (!context) {
    throw new Error("useEnquiryNotifications must be used inside an AdminShell.");
  }

  return context;
}
