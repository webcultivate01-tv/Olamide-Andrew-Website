"use client";

// The scroll trigger shared by reveal.js and reveal-words.js.
//
// One observer for the whole page rather than one per element. Each target
// carries its own callback here and is dropped the moment it fires, so a
// reveal only ever plays once.
//
// An IntersectionObserver alone is not enough to guarantee the page is
// readable, which is the part that matters: it samples intersection per
// frame, so if the main thread is busy while an element passes through the
// viewport — a long task, a large image decoding, a flick scroll, a tab
// restored mid-page — that element is never sampled in an intersecting
// state. Once it sits above the viewport it never will be again, and because
// the hidden state lives in CSS the content stays invisible for good rather
// than simply un-animated.
//
// So the observer is treated as the thing that makes the entrance play at a
// nice moment, and the sweep below as the thing that guarantees content is
// shown at all. The sweep asks "is this element at or above the fold?", which
// is a question about current position rather than about a moment of
// crossing, so it cannot be missed the way a notification can.

// el -> the callback that reveals it. Entries live here until revealed.
const pending = new Map();

let observer = null;
let sweepQueued = false;

function reveal(el) {
  const show = pending.get(el);
  if (!show) return;

  pending.delete(el);
  observer?.unobserve(el);
  show();
}

// Matches the observer's own bottom inset, so an element caught by the sweep
// rather than by a notification still starts at the same point on screen and
// the page's rhythm doesn't change.
const triggerLine = () => window.innerHeight * 0.9;

function sweep() {
  sweepQueued = false;
  const limit = triggerLine();

  // reveal() mutates `pending`, hence the copy.
  for (const el of [...pending.keys()]) {
    if (el.getBoundingClientRect().top < limit) reveal(el);
  }
}

function queueSweep() {
  if (sweepQueued) return;
  sweepQueued = true;
  requestAnimationFrame(sweep);
}

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target);
        }
      },
      // The bottom inset holds a reveal back until the element is properly in
      // view instead of firing the instant its first pixel appears. The low
      // threshold keeps tall blocks — which can never reach 25% on a short
      // viewport — from being stranded.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    // Passive: these only ever read layout inside a frame callback.
    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", queueSweep, { passive: true });
  }

  return observer;
}

/**
 * Reveals `el` by calling `show` once, when it has scrolled into view — or
 * immediately if it is already at or above the fold, which is the case for
 * anything in the first screenful and for anything the visitor scrolled past
 * while the page was still hydrating.
 *
 * Returns the unwatch function for the effect's cleanup.
 */
export function watchReveal(el, show) {
  pending.set(el, show);
  getObserver().observe(el);

  // Covers mount: on screen already, or left behind by a scroll that happened
  // before this ran.
  queueSweep();

  return () => {
    pending.delete(el);
    observer?.unobserve(el);
  };
}
