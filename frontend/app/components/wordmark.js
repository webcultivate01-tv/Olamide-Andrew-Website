// Mixed-weight "OLAMIDE" lockup, drawn to match the reference design.
//
// The glyphs are squeezed to exactly fill the viewBox width via
// textLength + lengthAdjust="spacingAndGlyphs", which is what gives the
// ultra-condensed didone look and makes the mark flush to both edges at
// every screen size. Bodoni Moda is variable, so each letter can carry its
// own weight from the same family.
//
// The baseline sits at y=404 in a 412-tall box: the gap below is just the
// bottom bearing, and everything left over is headroom for the round-letter
// overshoot on the O, which rises above the cap height and would otherwise
// clip against the top of the viewBox.
const LETTERS = [
  { char: "O", weight: 400 },
  { char: "L", weight: 900 },
  { char: "A", weight: 900 },
  { char: "M", weight: 900 },
  { char: "I", weight: 400 },
  { char: "D", weight: 700 },
  { char: "E", weight: 400 },
];

export default function Wordmark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 1000 412"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Olamide"
      className={`block h-auto w-full ${className}`}
    >
      <text
        x="0"
        y="404"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        fontSize="500"
        fill="currentColor"
        style={{ fontFamily: "var(--font-bodoni), Georgia, serif" }}
      >
        {LETTERS.map(({ char, weight }, i) => (
          <tspan key={i} fontWeight={weight}>
            {char}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
