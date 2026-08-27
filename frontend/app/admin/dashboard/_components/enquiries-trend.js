"use client";

import { useMemo, useState } from "react";
import { CHART, formatDay, formatNumber, niceScale, px } from "./chart-theme";
import useChartWidth from "./use-chart-width";

/**
 * Enquiries per day, as an area chart.
 *
 * One series, so there is no legend: the card's own title says what is
 * plotted, and a box holding a single swatch would only repeat it.
 *
 * The API sends ninety days in the first response and the buttons narrow that
 * in the browser. Ninety days of daily counts is a few kilobytes, and paying
 * for it once buys an instant range switch instead of a request and a spinner
 * every time the admin changes their mind.
 */

const RANGES = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

const HEIGHT = 250;
const PAD = { top: 18, right: 18, bottom: 28, left: 40 };

// Which x positions get a written date. Every day would be an unreadable smear
// at ninety points, and the tooltip carries the exact date anyway — so this is
// only enough to orient the reader in time.
const labelIndexes = (count) => {
  if (count <= 8) return Array.from({ length: count }, (_, index) => index);

  const wanted = [0, Math.round((count - 1) / 3), Math.round(((count - 1) * 2) / 3), count - 1];
  return [...new Set(wanted)];
};

export default function EnquiriesTrend({ byDay }) {
  const [containerRef, width] = useChartWidth();
  const [days, setDays] = useState(30);
  const [hover, setHover] = useState(null);

  // `byDay` is oldest first, so the requested range is the tail of it.
  const points = useMemo(() => byDay.slice(-days), [byDay, days]);

  const totals = points.map((point) => point.total);
  const scale = niceScale(Math.max(...totals, 0));
  const rangeTotal = totals.reduce((sum, value) => sum + value, 0);
  const busiest = points[totals.indexOf(Math.max(...totals))];

  const innerWidth = Math.max(1, width - PAD.left - PAD.right);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  // A one-point range would divide by zero; it is drawn at the left edge.
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  // Rounded for the same reason the donut rounds: these numbers end up as
  // attribute text that the server and the browser both have to write
  // identically.
  const x = (index) => px(PAD.left + index * stepX);
  const y = (value) => px(PAD.top + innerHeight - (value / scale.top) * innerHeight);

  const line = points.map((point, index) => `${index ? "L" : "M"}${x(index)} ${y(point.total)}`).join(" ");
  const baseline = PAD.top + innerHeight;
  const area = `${line} L${x(points.length - 1)} ${baseline} L${x(0)} ${baseline} Z`;

  const lastIndex = points.length - 1;
  const marks = labelIndexes(points.length);

  // The pointer is snapped to the nearest day rather than tracking freely, so
  // the crosshair always sits on a real reading instead of between two.
  const onPointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - PAD.left;
    const index = Math.max(0, Math.min(lastIndex, stepX ? Math.round(offset / stepX) : 0));

    setHover(index);
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-black/55">
          <span className="font-semibold text-navy">{formatNumber(rangeTotal)}</span>{" "}
          {rangeTotal === 1 ? "enquiry" : "enquiries"} in the last {days} days
        </p>

        <div
          role="group"
          aria-label="Chart range"
          className="inline-flex overflow-hidden rounded-full border border-black/10"
        >
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              aria-pressed={days === range.days}
              onClick={() => {
                setDays(range.days);
                setHover(null);
              }}
              className={`font-nav px-3.5 py-1.5 text-[0.68rem] font-bold tracking-[0.14em] uppercase transition-colors ${
                days === range.days ? "bg-navy text-white" : "bg-white text-muted hover:text-navy"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* The height is held whether or not the plot has been measured yet, so
          the card does not resize under the reader a frame after it appears. */}
      <div ref={containerRef} className="relative mt-4" style={{ minHeight: HEIGHT }}>
        {width > 0 ? (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Enquiries received per day over the last ${days} days. ${rangeTotal} in total.`}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHover(null)}
            className="touch-pan-y"
          >
            {/* Gridlines first, so every mark that follows sits on top of them. */}
            {scale.ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerWidth}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={tick === 0 ? CHART.axis : CHART.grid}
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 10}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={CHART.inkMuted}
                  fontSize="11"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {tick}
                </text>
              </g>
            ))}

            <path d={area} fill={CHART.volume} opacity="0.1" />
            <path
              d={line}
              fill="none"
              stroke={CHART.volume}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {marks.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={HEIGHT - 8}
                // The first and last labels are pinned to their ends rather
                // than centred, so neither hangs off the side of the chart.
                textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
                fill={CHART.inkMuted}
                fontSize="11"
              >
                {formatDay(points[index].day)}
              </text>
            ))}

            {hover !== null ? (
              <g pointerEvents="none">
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={PAD.top}
                  y2={baseline}
                  stroke={CHART.axis}
                  strokeWidth="1"
                />
                <circle
                  cx={x(hover)}
                  cy={y(points[hover].total)}
                  r="4.5"
                  fill={CHART.volume}
                  stroke={CHART.surface}
                  strokeWidth="2"
                />
              </g>
            ) : null}

            {/* The end of the line, marked. One direct mark, not thirty: it is
                where the eye lands, and the rest are a hover away. */}
            {hover === null && points.length > 1 ? (
              <circle
                cx={x(lastIndex)}
                cy={y(points[lastIndex].total)}
                r="4.5"
                fill={CHART.volume}
                stroke={CHART.surface}
                strokeWidth="2"
              />
            ) : null}
          </svg>
        ) : null}

        {hover !== null ? (
          <div
            // Clamped to the plot area so a tooltip near either edge stays
            // inside the card instead of being cut off by it.
            style={{
              left: Math.min(Math.max(x(hover), 62), Math.max(width - 62, 62)),
              top: Math.max(y(points[hover].total) - 14, 0),
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl border border-black/10 bg-white px-3 py-2 text-center shadow-lg"
          >
            <span className="font-nav block text-[0.62rem] font-bold tracking-[0.14em] whitespace-nowrap text-muted uppercase">
              {formatDay(points[hover].day, { withYear: true })}
            </span>
            <span className="mt-0.5 block text-sm font-semibold whitespace-nowrap text-navy">
              {formatNumber(points[hover].total)}{" "}
              {points[hover].total === 1 ? "enquiry" : "enquiries"}
            </span>
          </div>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-black/45">
        {rangeTotal > 0
          ? `Busiest day: ${formatDay(busiest.day, { withYear: true })} — ${formatNumber(busiest.total)} ${busiest.total === 1 ? "enquiry" : "enquiries"}.`
          : "Nothing has come in over this period yet."}
      </p>

      {/* The same numbers as a table, for a screen reader and for anyone the
          chart does not work for. Hidden visually, not from the accessibility
          tree — the chart above is the same data drawn. */}
      <table className="sr-only">
        <caption>Enquiries received per day, last {days} days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Enquiries</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <th scope="row">{formatDay(point.day, { withYear: true })}</th>
              <td>{point.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
