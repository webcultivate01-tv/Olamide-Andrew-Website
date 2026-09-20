"use client";

// The scroll-linked driver behind the case study page's pinned hero.
//
// Where <Reveal> answers "has this scrolled into view yet?" once and is done,
// this answers "how far through its travel is it *right now*?" and keeps
// answering for as long as the element is on screen. The number it produces
// is written to a CSS custom property, and the transform that reads it lives
// in globals.css — so JavaScript only ever supplies a 0..1 position and the
// browser composites the motion itself.
//
// One rAF-throttled reader for the whole page rather than a listener per
// element: every tracked element is measured inside the same frame callback,
// which keeps the layout reads batched together.

// el -> { measure, apply, last }
const tracked = new Map();

let frame = 0;
let listening = false;

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

function read() {
  frame = 0;
  const viewport = window.innerHeight;

  for (const [el, entry] of tracked) {
    const next = entry.measure(el.getBoundingClientRect(), viewport);
    // Quantised before the comparison so sub-pixel jitter — a trackpad
    // resting under a finger, a scrollbar nudge — doesn't cost a style write
    // and a composite for motion nobody could see.
    const quantised = Math.round(next * 500) / 500;
    if (quantised === entry.last) continue;

    entry.last = quantised;
    entry.apply(quantised);
  }
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(read);
}

/**
 * Tracks `el`, calling `apply(progress)` whenever the 0..1 position returned
 * by `measure(rect, viewport)` changes, until the returned function is called.
 *
 * The formula is the caller's rather than a named mode of this module's,
 * because what counts as "progress" differs per effect — and a sticky
 * element, whose own rect stops moving the moment it pins, has to be
 * measured by something else entirely.
 */
export function watchScroll(el, measure, apply) {
  tracked.set(el, { measure, apply, last: null });

  if (!listening) {
    listening = true;
    // Passive: both only ever read layout inside a frame callback.
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }

  // Covers mount on a page that is already scrolled — a reload part-way
  // down, or a back navigation that restores the old position.
  schedule();

  return () => {
    tracked.delete(el);
  };
}
