"use client";

import { useState } from "react";
import Link from "next/link";
import { ENQUIRY_STATUSES } from "@/lib/api";
import { CHART, STATUS_COLORS, formatNumber, formatPercent, px } from "./chart-theme";

/**
 * Where the pipeline is sitting right now — every enquiry, split by status.
 *
 * A ring rather than bars because this is a part-to-whole reading: the useful
 * question is "how much of everything is still unanswered", and the whole is
 * what a ring draws. The total sits in the middle, where the parts add up to.
 *
 * The legend is not decoration here. Three of these hues are below 3:1 against
 * white, so each one is written out with its own count and share beside it —
 * nothing on this card is carried by colour alone.
 */

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER = 88;
const INNER = 58;

// The 2px surface gap that separates touching segments, expressed as an angle
// at the middle of the ring so it measures 2px on screen rather than 2px at
// whichever radius happened to be used for the maths.
const GAP = 2 / ((OUTER + INNER) / 2);

const onCircle = (radius, angle) => [
  px(CENTER + radius * Math.cos(angle)),
  px(CENTER + radius * Math.sin(angle)),
];

const segmentPath = (start, end) => {
  const large = end - start > Math.PI ? 1 : 0;

  const [x1, y1] = onCircle(OUTER, start);
  const [x2, y2] = onCircle(OUTER, end);
  const [x3, y3] = onCircle(INNER, end);
  const [x4, y4] = onCircle(INNER, start);

  return [
    `M${x1} ${y1}`,
    `A${OUTER} ${OUTER} 0 ${large} 1 ${x2} ${y2}`,
    `L${x3} ${y3}`,
    `A${INNER} ${INNER} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
};

export default function StatusDonut({ total, byStatus }) {
  const [hover, setHover] = useState(null);

  const slices = ENQUIRY_STATUSES.map((status) => ({
    ...status,
    count: byStatus?.[status.value] ?? 0,
    color: STATUS_COLORS[status.value],
  }));

  const present = slices.filter((slice) => slice.count > 0);

  // One status holding everything is drawn as a plain ring, not as an arc.
  // A segment sweeping the full turn starts and ends at the same point, and an
  // SVG arc between two identical points draws nothing at all — the card would
  // come up with a total in the middle and no ring around it.
  const whole = present.length === 1 ? present[0] : null;

  let angle = -Math.PI / 2;
  const arcs = whole
    ? []
    : present.map((slice) => {
        const sweep = (slice.count / total) * Math.PI * 2;
        const path = segmentPath(angle + GAP / 2, angle + sweep - GAP / 2);
        angle += sweep;

        return { ...slice, path };
      });

  const active = hover ? slices.find((slice) => slice.value === hover) : null;

  return (
    // Stacked rather than side by side: this card is a third of the grid on a
    // wide screen, and a ring plus five labelled rows does not fit across it
    // without the percentages running off the edge.
    <div className="flex w-full flex-col items-center gap-5">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`Enquiries by status. ${total} in total.`}
        >
          {total === 0 || whole ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={(OUTER + INNER) / 2}
              fill="none"
              stroke={whole ? whole.color : CHART.track}
              strokeWidth={OUTER - INNER}
              opacity={hover && whole && hover !== whole.value ? 0.28 : 1}
              onPointerEnter={() => whole && setHover(whole.value)}
              onPointerLeave={() => setHover(null)}
              className="transition-opacity duration-150"
            />
          ) : (
            arcs.map((arc) => (
              <path
                key={arc.value}
                d={arc.path}
                fill={arc.color}
                // Dimming the rest is the hover cue. A stroke around the
                // active slice would add ink that is not data and shift the
                // segment's apparent size with it.
                opacity={hover && hover !== arc.value ? 0.28 : 1}
                onPointerEnter={() => setHover(arc.value)}
                onPointerLeave={() => setHover(null)}
                className="cursor-default transition-opacity duration-150"
              />
            ))
          )}
        </svg>

        {/* The centre reads whatever the pointer is on, and the grand total
            when it is on nothing. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-headline text-3xl leading-none tracking-tight text-navy">
            {formatNumber(active ? active.count : total)}
          </span>
          <span className="font-nav mt-1 max-w-[90px] text-center text-[0.6rem] leading-tight font-bold tracking-[0.14em] text-muted uppercase">
            {active ? active.label : "Total"}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-0.5">
        {slices.map((slice) => (
          <li key={slice.value}>
            <Link
              href="/admin/enquiries"
              onPointerEnter={() => setHover(slice.value)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(slice.value)}
              onBlur={() => setHover(null)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-navy/[0.05]"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-black/70">
                {slice.label}
              </span>
              <span
                className="text-sm font-semibold text-navy"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatNumber(slice.count)}
              </span>
              <span
                className="w-9 text-right text-xs text-black/40"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatPercent(slice.count, total)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
