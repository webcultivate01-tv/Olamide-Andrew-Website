"use client";

import Link from "next/link";
import { CHART, formatNumber } from "./chart-theme";
import Sparkline from "./sparkline";

/**
 * One headline number, with whatever context it needs underneath it.
 *
 * Four of these run across the top of the dashboard. A tile carries at most
 * one extra thing — a delta, a sparkline or a meter — because the point of the
 * row is that four numbers can be read in one pass.
 *
 * The value keeps the panel's headline face rather than the body sans. Every
 * other big number in this admin panel is set in it, and a dashboard that
 * picked its own type would be the odd screen out.
 */

function ArrowIcon({ up }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {up ? <path d="M6 10V2m0 0L2.5 5.5M6 2l3.5 3.5" /> : <path d="M6 2v8m0 0L2.5 6.5M6 10l3.5-3.5" />}
    </svg>
  );
}

/**
 * The change against the period before, in words as well as in colour.
 *
 * Growth from nothing has no percentage — dividing by zero is not "infinity up
 * ", it is "there was nothing to compare with" — so that case says the count
 * instead of inventing a number.
 */
function Delta({ current, previous, periodDays }) {
  const label = `vs previous ${periodDays} days`;

  if (previous === 0 && current === 0) {
    return <span className="text-xs text-black/40">No enquiries either period</span>;
  }

  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-black/55">
        <span className="inline-flex items-center gap-1 font-semibold text-[#006300]">
          <ArrowIcon up />
          {formatNumber(current)} new
        </span>
        {label}
      </span>
    );
  }

  const change = Math.round(((current - previous) / previous) * 100);

  if (change === 0) {
    return <span className="text-xs text-black/55">Level {label}</span>;
  }

  const up = change > 0;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-black/55">
      <span
        className={`inline-flex items-center gap-1 font-semibold ${
          up ? "text-[#006300]" : "text-[#b3261e]"
        }`}
      >
        <ArrowIcon up={up} />
        {up ? "+" : ""}
        {change}%
      </span>
      {label}
    </span>
  );
}

/**
 * A proportion drawn as a bar.
 *
 * The unfilled part is a lighter step of the same navy rather than a grey, so
 * the whole bar reads as one measure with a filled portion — a grey track
 * looks like a second category.
 */
function Meter({ ratio, color }) {
  return (
    <div
      className="mt-4 h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: CHART.track }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export default function StatTile({
  label,
  value,
  caption,
  href,
  accent = false,
  delta,
  meter,
  spark,
}) {
  const body = (
    <>
      <span className="font-nav block text-[0.68rem] font-bold tracking-[0.16em] text-muted uppercase">
        {label}
      </span>

      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="font-headline text-4xl leading-none tracking-tight text-navy">
          {value}
        </span>

        {spark ? <Sparkline values={spark.values} color={spark.color} /> : null}
      </div>

      {meter ? <Meter ratio={meter.ratio} color={meter.color} /> : null}

      <div className="mt-3 min-h-[1.25rem]">
        {delta ? <Delta {...delta} /> : null}
        {!delta && caption ? (
          <span className="text-xs text-black/55">{caption}</span>
        ) : null}
      </div>
    </>
  );

  const className = `block rounded-2xl border p-5 transition-colors ${
    accent
      ? "border-accent bg-accent/15 hover:border-accent"
      : "border-black/10 bg-white hover:border-navy/40"
  }`;

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
