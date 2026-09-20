"use client";

import { useEffect, useRef, useState } from "react";
import { watchReveal } from "./reveal-observer";

// Scroll-triggered entrance wrapper.
//
// The animation itself lives in globals.css under [data-reveal]; this
// component only decides *when* it runs by flipping data-shown on. That
// split keeps the hidden starting state in the server-rendered HTML, so
// nothing flashes at full opacity before hydration catches up.
//
// Variants:
//   up    — the element fades and lifts into place.
//   left  — the element fades in from the left. For list rows that should
//           read as a different gesture from the prose around them.
//   right — the mirror of left, fades in from the right. Pairs with left
//           on two-line headlines so the lines converge from opposite sides.
//   wide-left / wide-right — same pairing as left/right but with much
//           longer travel (16vw), for a hero-scale entrance where the line
//           should visibly fly in from past the section's edge. Only use
//           inside an overflow-hidden ancestor, since the start position
//           sits outside the element's own box.
//   mask  — the element clips its own overflow and its child slides up
//           from behind the bottom edge. Built for single blocks of
//           display type; the child must be one element.
//   wipe  — a top-to-bottom clip reveal with the child easing out of a
//           slight zoom. Built for images.
//   roll  — a 3D tip-up on the element's own bottom edge (rotateX +
//           translate), for a modern "rolling" entrance on cards/blocks.

export default function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return watchReveal(el, () => setShown(true));
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      data-shown={shown ? "" : undefined}
      style={delay ? { "--reveal-delay": `${delay}ms` } : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
