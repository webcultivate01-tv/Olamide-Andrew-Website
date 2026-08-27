/**
 * The one place the dashboard's charts get their colours and their number
 * formatting from.
 *
 * Two palettes, because the charts do two different jobs:
 *
 * - **Volume** is a single measure — how many enquiries arrived. One measure
 *   gets one colour, and it is the brand navy, so the trend line, the
 *   sparklines and the service bars all read as the same quantity.
 * - **Identity** is the pipeline: five statuses that are not more or less of
 *   anything, just different. Those need hues that stay apart from each other,
 *   including for a colour-blind reader.
 *
 * The four coloured statuses were checked as a set rather than picked by eye:
 * every pair is at least ΔE 9.1 apart under protanopia and deuteranopia
 * simulation and ΔE 16.3 apart in normal vision, on a white surface. Closed
 * takes a neutral grey on purpose — it is the "nothing is happening here"
 * state, and grey is what that looks like.
 *
 * Three of those hues sit below 3:1 contrast against white. That is allowed
 * only because nothing here is carried by colour alone: every segment, bar and
 * slice has its label and its number written next to it.
 */

// Chart chrome. Recessive by design — the data is the only thing allowed to be
// loud, so gridlines and axes sit one step off the surface and no more.
export const CHART = {
  surface: "#ffffff",
  grid: "#e8e8e4",
  axis: "#c3c2b7",
  ink: "#101010",
  inkMuted: "#6b6f74",
  // Single-measure hue: enquiry volume, wherever it appears.
  volume: "#17395a",
  // The unfilled half of a meter, and the track behind an empty chart.
  track: "#e9edf1",
};

// One colour per pipeline stage, in pipeline order.
export const STATUS_COLORS = {
  NEW: "#eda100",
  CONTACTED: "#4a3aa7",
  IN_PROGRESS: "#2a78d6",
  CONVERTED: "#1baf7a",
  CLOSED: "#898781",
};

// Draft work is deliberately colourless: it is the absence of a published
// piece, not a category competing with one for attention.
export const CONTENT_COLORS = {
  PUBLISHED: "#17395a",
  DRAFT: "#c3c2b7",
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * A coordinate, rounded before it is written into an SVG attribute.
 *
 * This is not tidiness. Every chart here is drawn once on the server and again
 * in the browser, and `Math.cos` and `Math.sin` are allowed to disagree
 * between two JavaScript engines in the last bit or so of the result — Node
 * produced `48.33726910314756` for an arc that Chrome put at
 * `48.33726910314757`. React compares the two path strings during hydration,
 * sees different text, and reports the whole chart as a mismatch it cannot
 * patch up.
 *
 * Two decimals is far finer than a pixel at any size drawn here, and it makes
 * the two engines agree exactly.
 */
export const px = (value) => Math.round(value * 100) / 100;

// A fixed locale, not the reader's, and deliberately so. These numbers are
// rendered on the server and then again in the browser, and the two do not
// have the same locale: Node here resolves to en-IN, which groups a hundred
// thousand as 1,00,000 where Chrome writes 100,000. React compares the two
// strings during hydration and calls the difference a bug. Anything genuinely
// local — a timestamp — goes through <LocalTime>, which is built to differ.
export const formatNumber = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US")
    : "—";

// "0%" for an empty pipeline rather than NaN, and no decimals — a dashboard
// percentage is read at a glance, and the extra digit is noise.
export const formatPercent = (part, whole) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";

/**
 * A y-axis that lands on round numbers.
 *
 * The gap between ticks is picked first and the top of the scale follows from
 * it, rather than the other way round. Rounding the *top* up to something tidy
 * is the obvious approach and it goes wrong immediately: a scale topping out
 * at 5 with four gridlines puts ticks at 1.25 and 3.75, and these are counts
 * of enquiries — there is no such thing as a quarter of one.
 *
 * Only 1, 2, 5 and their powers of ten are offered as a step, and never below
 * 1, so every tick is a whole number.
 */
export const niceScale = (maxValue, targetTicks = 4) => {
  const rough = Math.max(maxValue, 1) / targetTicks;
  const magnitude = Math.max(1, 10 ** Math.floor(Math.log10(Math.max(rough, 1))));

  const step =
    [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude;

  // At least two steps, so a chart where nothing has happened yet still draws
  // an axis instead of collapsing to a single line at zero.
  const top = Math.max(step * 2, Math.ceil(Math.max(maxValue, 1) / step) * step);
  const ticks = [];

  for (let value = 0; value <= top; value += step) ticks.push(value);

  return { top, step, ticks };
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * An axis label for one of the API's day keys.
 *
 * The keys are plain YYYY-MM-DD, deliberately: they are calendar days, not
 * instants. Two things follow from that, and both are why this is assembled by
 * hand rather than handed to Intl.
 *
 * Parsing one with `new Date(key)` would produce a UTC midnight that renders
 * as the *previous* day for every reader west of Greenwich — the chart would
 * quietly file Monday's enquiries under Sunday.
 *
 * And a chart's axis is drawn on the server before it is drawn in the browser.
 * Those two run in different locales (Node here resolves to en-IN, which
 * writes "29 Jul" where Chrome writes "Jul 29"), so asking either one for
 * "the short date" gets a different answer and React reports the difference as
 * a hydration failure. A calendar day has no timezone and no reason to be
 * localised; writing it out is both simpler and correct.
 */
export const formatDay = (key, { withYear = false } = {}) => {
  const [year, month, day] = key.split("-");

  return `${MONTHS[Number(month) - 1]} ${Number(day)}${withYear ? `, ${year}` : ""}`;
};
