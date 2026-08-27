"use client";

import Link from "next/link";
import { useEnquiryNotifications } from "./enquiry-notifications";

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

/**
 * The bell in the admin header, and the unread count on it.
 *
 * "Unread" is not a flag of its own — it is the number of enquiries still
 * sitting at status NEW. That is deliberate: it means the count is recomputed
 * from MySQL on every page load, so it survives a refresh, a new tab and a
 * different machine, and it clears itself the moment an admin actually deals
 * with an enquiry rather than merely glancing at it.
 */
export default function NotificationBell() {
  const { unread, connected } = useEnquiryNotifications();

  const label =
    unread === 0
      ? "No new enquiries"
      : `${unread} new ${unread === 1 ? "enquiry" : "enquiries"}`;

  return (
    <Link
      href="/admin/enquiries"
      aria-label={label}
      title={connected ? label : `${label} (live updates unavailable)`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-navy transition-colors hover:bg-navy hover:text-white"
    >
      <BellIcon />

      {unread > 0 ? (
        <span className="font-nav absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.7rem] leading-none font-bold text-black">
          {/* Past 99 the badge would stretch the header out of shape. */}
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}

      {/* A quiet dot rather than a warning: losing the live connection only
          means the count updates on the next page load, which is not something
          to alarm anyone about mid-task. */}
      {!connected ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-black/25"
        />
      ) : null}
    </Link>
  );
}
