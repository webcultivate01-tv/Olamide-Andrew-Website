"use client";

import { CHART } from "./chart-theme";

/**
 * The small line inside a stat tile.
 *
 * It has no axes, no labels and no hover: it is there to say "rising",
 * "falling" or "quiet", and the number above it says everything else. Anything
 * more would compete with the figure it belongs to.
 *
 * Fixed at a small pixel size rather than measured — a tile's width barely
 * changes between breakpoints, and a `preserveAspectRatio="none"` stretch is
 * invisible at this scale.
 */

const WIDTH = 108;
const HEIGHT = 30;
const PADDING = 3;

export default function Sparkline({ values, color = CHART.volume }) {
  // One point cannot be a line, and a flat series has no shape worth drawing.
  if (!values || values.length < 2) return null;

  const max = Math.max(...values, 1);
  const step = (WIDTH - PADDING * 2) / (values.length - 1);

  const points = values.map((value, index) => [
    PADDING + index * step,
    // The baseline sits one pixel clear of the bottom edge so a run of zeros
    // is still visible as a line rather than disappearing into the border.
    HEIGHT - PADDING - (value / max) * (HEIGHT - PADDING * 2),
  ]);

  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${points.at(-1)[0]} ${HEIGHT} L${points[0][0]} ${HEIGHT} Z`;

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path d={area} fill={color} opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The last point, ringed in the surface colour so it stays readable
          where the line runs underneath it. */}
      <circle
        cx={points.at(-1)[0]}
        cy={points.at(-1)[1]}
        r="3"
        fill={color}
        stroke={CHART.surface}
        strokeWidth="2"
      />
    </svg>
  );
}
