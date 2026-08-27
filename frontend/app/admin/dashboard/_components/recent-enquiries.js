"use client";

import Link from "next/link";
import StatusBadge from "../../enquiries/_components/status-badge";
import LocalTime from "../../_components/local-time";

/**
 * The last handful of messages, newest first.
 *
 * The charts above say how much and what kind; this says who, which is the
 * part an admin actually acts on. Each row goes straight to the enquiry rather
 * than to the list, because the next thing after reading a name is opening it.
 *
 * The status badge is the same component the enquiries table uses, so a row
 * here and the same row there can never describe themselves differently.
 */
export default function RecentEnquiries({ enquiries }) {
  if (!enquiries.length) {
    return (
      <p className="text-sm leading-relaxed text-black/45">
        Nothing yet. Messages sent from the website&rsquo;s contact form land
        here the moment they arrive.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/[0.07]">
      {enquiries.map((enquiry) => (
        <li key={enquiry.id}>
          <Link
            href={`/admin/enquiries/${enquiry.id}`}
            className="-mx-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-2 py-3 transition-colors hover:bg-navy/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {enquiry.name}
              </span>
              <span className="block truncate text-xs text-black/50">
                {enquiry.subject || enquiry.service || enquiry.email}
              </span>
            </div>

            <StatusBadge status={enquiry.status} />

            <span className="w-full text-xs whitespace-nowrap text-black/40 sm:w-auto sm:text-right">
              <LocalTime value={enquiry.createdAt} withTime />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
