import { FULL_BLEED } from "./case-study-layout";

/**
 * A row of two half-width blocks, flush against the screen's edges with a
 * hairline gap between them.
 */
export default function SplitRow({ className = "", left, right }) {
  return (
    <div className={`${FULL_BLEED} ${className}`}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
