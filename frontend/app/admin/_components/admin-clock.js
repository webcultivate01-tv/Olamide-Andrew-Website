"use client";

import { useEffect, useState } from "react";
import { ADMIN_TIMEZONE, timezoneLabel } from "@/lib/admin-config";

/**
 * The live clock in the admin header, on Canadian time.
 *
 * The timezone is pinned rather than taken from the browser: an admin on a
 * laptop abroad, or on a machine with a wandering clock, should still see the
 * hour the business runs on. Intl does the conversion, so daylight saving is
 * handled for us — America/Toronto is EST or EDT depending on the date,
 * without a rule of ours to get wrong. Which zone is a setting, not a
 * constant: NEXT_PUBLIC_ADMIN_TIMEZONE picks any of the seven in
 * lib/admin-config.js.
 *
 * The formatters are built once at module scope. Rebuilding an
 * Intl.DateTimeFormat every second is the expensive part of a clock like this.
 *
 * The first render happens on the server, a second or two before the browser
 * hydrates, so the two disagree about the current time by design. That is what
 * suppressHydrationWarning marks: the alternative — rendering nothing until
 * mount — trades a harmless warning for an empty header on first paint.
 */

// en-US, not en-CA: Canadian English formats the meridiem as "p.m.", and the
// header is designed around the shorter "PM".
const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: ADMIN_TIMEZONE,
});

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: ADMIN_TIMEZONE,
});

// "Wednesday, August 26, 2026" will not sit beside a menu button on a phone,
// so small screens get the date abbreviated rather than dropped.
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: ADMIN_TIMEZONE,
});

export default function AdminClock({ className = "" }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // A second is finer than the display needs, but it keeps the minute from
    // arriving up to a minute late without any alignment arithmetic.
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`text-right leading-tight ${className}`} suppressHydrationWarning>
      <p className="flex items-baseline justify-end gap-1.5 md:gap-2">
        <span className="font-nav text-sm font-bold tracking-[0.06em] text-navy tabular-nums md:text-lg">
          {TIME_FORMAT.format(now)}
        </span>
        <span className="font-nav hidden text-[0.6rem] font-bold tracking-[0.18em] text-muted uppercase sm:inline">
          {timezoneLabel()}
        </span>
      </p>
      <p className="mt-0.5 text-[0.7rem] text-black/50 md:text-[0.8rem]">
        <span className="md:hidden">{SHORT_DATE_FORMAT.format(now)}</span>
        <span className="hidden md:inline">{DATE_FORMAT.format(now)}</span>
      </p>
    </div>
  );
}
