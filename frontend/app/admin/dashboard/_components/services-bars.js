"use client";

import { CHART, formatNumber } from "./chart-theme";

/**
 * Which services people are writing in about, most asked first.
 *
 * Bars, not a pie: the reading here is "which is biggest", and length along a
 * shared baseline is the one encoding people compare accurately. They are
 * horizontal because the labels are phrases — "Brand Strategy", "Web Design" —
 * and horizontal bars give a phrase a whole line to sit on instead of turning
 * it sideways under a column.
 *
 * One colour for all of them. There is a single measure on this chart, so a
 * second hue would imply a distinction that is not in the data; the bar's
 * length already carries everything.
 */
export default function ServicesBars({ services, rangeDays }) {
  if (!services.length) {
    return (
      <p className="text-sm leading-relaxed text-black/45">
        No enquiry in the last {rangeDays} days named a service. The field is
        optional on the contact form, so this fills in as they come.
      </p>
    );
  }

  // Bars are scaled against the biggest one rather than against the total, so
  // the top service always reaches the end and the shape of the ranking is
  // visible even when every count is small.
  const max = Math.max(...services.map((service) => service.total));

  return (
    <ul className="space-y-3.5">
      {services.map((service) => (
        <li key={service.service}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-black/70" title={service.service}>
              {service.service}
            </span>
            <span
              className="shrink-0 text-sm font-semibold text-navy"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatNumber(service.total)}
            </span>
          </div>

          <div
            className="mt-1.5 h-3 w-full overflow-hidden rounded-[4px]"
            style={{ backgroundColor: CHART.track }}
          >
            <div
              // Square where it leaves the baseline, rounded at the data end —
              // so the tip reads as the value and the start reads as zero.
              className="h-full rounded-l-none rounded-r-[4px] transition-[width] duration-500"
              style={{
                // A minimum sliver, so a service with one enquiry against a
                // leader with forty is still a visible bar and not an empty row.
                width: `${Math.max((service.total / max) * 100, 3)}%`,
                backgroundColor: CHART.volume,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
