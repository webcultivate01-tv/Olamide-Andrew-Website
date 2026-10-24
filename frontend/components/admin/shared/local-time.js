"use client";

import { useSyncExternalStore } from "react";

/**
 * A timestamp shown in the reader's own timezone.
 *
 * Formatting has to wait for the browser: the server has no idea what timezone
 * the admin is in, so if it rendered a local time and the browser rendered a
 * different one, React would hydrate onto mismatched text.
 *
 * useSyncExternalStore is the sanctioned way to say "render one thing on the
 * server and another on the client" — it has a separate server snapshot, so
 * React expects the two to differ instead of treating it as a hydration bug.
 * The server paints a fixed UTC rendering, identical on both sides and correct
 * to the day for almost everyone, and the client swaps in real local time.
 */

// Never changes, so nothing ever needs to be notified.
const neverChanges = () => () => {};

const useIsBrowser = () =>
  useSyncExternalStore(
    neverChanges,
    () => true,
    () => false
  );

const UTC_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const UTC_DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function LocalTime({ value, withTime = false }) {
  const isBrowser = useIsBrowser();

  if (!value) return <span>—</span>;

  const date = new Date(value);

  // A malformed timestamp would otherwise render as "Invalid Date".
  if (Number.isNaN(date.getTime())) return <span>—</span>;

  const text = isBrowser
    ? date.toLocaleString(
        undefined,
        withTime
          ? { dateStyle: "medium", timeStyle: "short" }
          : { day: "2-digit", month: "short", year: "numeric" }
      )
    : (withTime ? UTC_DATE_TIME : UTC_DATE).format(date);

  return <time dateTime={date.toISOString()}>{text}</time>;
}
