"use client";

import { useEffect, useRef, useState } from "react";

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
//   mask  — the element clips its own overflow and its child slides up
//           from behind the bottom edge. Built for single blocks of
//           display type; the child must be one element.
//   wipe  — a top-to-bottom clip reveal with the child easing out of a
//           slight zoom. Built for images.
//   roll  — a 3D tip-up on the element's own bottom edge (rotateX +
//           translate), for a modern "rolling" entrance on cards/blocks.

// One observer for the whole page rather than one per element. Each target
// carries its own callback in the map and is dropped the moment it fires,
// so a reveal only ever plays once.
const callbacks = new WeakMap();
let observer = null;

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const show = callbacks.get(entry.target);
          callbacks.delete(entry.target);
          if (show) show();
        }
      },
      // The bottom inset holds a reveal back until the element is properly
      // in view instead of firing the instant its first pixel appears. The
      // low threshold keeps tall blocks — which can never reach 25% on a
      // short viewport — from being stranded.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
  }
  return observer;
}

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

    // Anything already on screen at mount — the hero — intersects on the
    // observer's first pass, so it plays immediately without a scroll.
    const io = getObserver();
    callbacks.set(el, () => setShown(true));
    io.observe(el);

    return () => {
      io.unobserve(el);
      callbacks.delete(el);
    };
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
