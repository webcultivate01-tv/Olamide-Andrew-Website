"use client";

import Link from "next/link";
import { CHART, CONTENT_COLORS, formatNumber } from "./chart-theme";

/**
 * How much of the site's own content is live and how much is still a draft.
 *
 * A stacked bar per collection, because published and draft add up to the
 * whole library — the useful reading is the proportion, and two numbers side
 * by side make that a subtraction the reader has to do themselves.
 *
 * The two segments are separated by a 2px gap in the surface colour rather
 * than by a border. A border adds ink that is not data and makes the segment
 * it surrounds look fractionally bigger than it is.
 */

const SEGMENTS = [
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Draft" },
];

function Row({ label, href, stats }) {
  const { total, byStatus } = stats;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={href}
          className="text-sm font-semibold text-navy transition-colors hover:text-accent-hover"
        >
          {label}
        </Link>
        <span
          className="text-sm text-black/50"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatNumber(total)} total
        </span>
      </div>

      <div
        className="mt-2 flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]"
        style={{ backgroundColor: CHART.track }}
      >
        {total > 0
          ? SEGMENTS.filter((segment) => byStatus[segment.key] > 0).map((segment) => (
              <div
                key={segment.key}
                className="h-full first:rounded-l-[4px] last:rounded-r-[4px] transition-[flex-grow] duration-500"
                style={{
                  flexGrow: byStatus[segment.key],
                  backgroundColor: CONTENT_COLORS[segment.key],
                }}
              />
            ))
          : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {SEGMENTS.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CONTENT_COLORS[segment.key] }}
            />
            <span className="text-black/55">{segment.label}</span>
            <span
              className="font-semibold text-navy"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatNumber(byStatus[segment.key])}
            </span>
          </span>
        ))}
      </div>
    </li>
  );
}

export default function ContentBreakdown({ caseStudies, blog }) {
  return (
    <ul className="space-y-6">
      <Row label="Case studies" href="/admin/case-studies" stats={caseStudies} />
      <Row label="Blog posts" href="/admin/blog" stats={blog} />
    </ul>
  );
}
