"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "../components/reveal";

const STEPS = [
  {
    title: "Research",
    body: "A logo is just the beginning. I build cohesive brand systems that grow with you and scale across every touchpoint.",
  },
  {
    title: "Strategy",
    body: "Define goals, there's purpose. I start with your audience, your goals, and the story you need to tell.",
  },
  {
    title: "Positioning",
    body: "Design should make people feel something. I craft narratives that resonate and drive action.",
  },
  {
    title: "Identity",
    body: "Colour, type and mark come together into one system that stays consistent everywhere it shows up.",
  },
  {
    title: "Execution",
    body: "Strategy only counts when it ships. I hand over the files, rules and guidance that keep it working.",
  },
];

// Matches the gap-6 on the rail — used to advance exactly one card per click.
const GAP = 24;

// How long a card sits in view before the rail advances on its own.
const AUTO_PLAY_INTERVAL = 2000;

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-black/70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 16.5a5.5 5.5 0 1 1 5 0v1.5a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-1.5Z" />
      <path d="M12 19.5v2" />
    </svg>
  );
}

function Chevron({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-6 w-6 text-accent ${direction === "prev" ? "" : "rotate-180"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

export default function HowIThink() {
  const railRef = useRef(null);
  const pausedRef = useRef(false);
  const [progress, setProgress] = useState(0);

  // The bar tracks how much of the run has been revealed — including the cards
  // already on screen — so it reads as partly filled on first paint.
  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const scrollable = rail.scrollWidth - rail.clientWidth;
    setProgress(
      scrollable <= 0
        ? 1
        : (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth,
    );
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const step = useCallback((direction) => {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.firstElementChild;
    const distance = card ? card.offsetWidth + GAP : rail.clientWidth;
    rail.scrollBy({ left: direction * distance, behavior: "smooth" });
  }, []);

  // Auto-advance the rail so the rest of the steps surface on their own
  // instead of waiting on a click — loops back to the start once the last
  // card is on screen. Hovering or focusing a card (mouse or keyboard)
  // pauses it, since a card sliding away mid-read would be worse than a
  // static one. Skipped entirely for anyone who's asked for less motion,
  // and on mobile the rail isn't horizontally scrollable to begin with.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail || pausedRef.current) return;
      if (rail.scrollWidth <= rail.clientWidth) return;

      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1;
      if (atEnd) {
        rail.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        step(1);
      }
    }, AUTO_PLAY_INTERVAL);

    return () => window.clearInterval(id);
  }, [step]);

  function pause() {
    pausedRef.current = true;
  }

  function resume() {
    pausedRef.current = false;
  }

  return (
    <section className="overflow-hidden py-16 md:py-20 lg:py-24">
      <Reveal
        as="h2"
        variant="up"
        className="font-headline mx-auto max-w-[1600px] px-5 text-center text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-foreground uppercase md:px-10 md:text-[3.5rem] lg:px-20 lg:text-[4.75rem]"
      >
        See how I think
      </Reveal>

      {/* On mobile the steps are a plain vertical stack of full-width cards.
          From md up it becomes a full-bleed rail: padding sits on the row so
          the first card aligns with the page grid while the last one runs off
          the right edge. */}
      <div
        ref={railRef}
        onScroll={sync}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        onTouchStart={pause}
        className="no-scrollbar mt-10 md:mt-16 md:overflow-x-auto"
      >
        <div className="flex flex-col gap-5 px-5 md:w-max md:flex-row md:items-stretch md:gap-6 md:px-10 lg:px-20">
          {STEPS.map((item, index) => (
            // Hairline border that follows the notch: the outer layer is the
            // border colour, the inner one is the card face inset by 1px.
            <Reveal
              key={item.title}
              variant="up"
              delay={(index % 3) * 100}
              className="clip-notch w-full bg-black/15 p-px md:w-[360px] md:shrink-0 lg:w-[416px]"
            >
              <div className="clip-notch flex h-full min-h-[340px] flex-col bg-white p-7 pt-9 lg:min-h-[392px] lg:p-8 lg:pt-11">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-black/[.05]">
                  <LightbulbIcon />
                </span>

                <h3 className="mt-8 text-base font-semibold text-foreground lg:text-lg">
                  {item.title}
                </h3>

                <p className="mt-6 text-base leading-relaxed text-black/70 lg:text-lg">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Controls belong to the rail, so they go with it — the stacked cards
          on mobile are already all on the page. */}
      <div className="mx-auto mt-12 hidden max-w-[1600px] items-center justify-center gap-5 px-5 md:mt-14 md:flex md:gap-7 md:px-10 lg:px-20">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-black/15 transition-colors hover:border-accent md:h-20 md:w-20"
        >
          <Chevron direction="prev" />
        </button>

        <div
          role="progressbar"
          aria-label="Carousel progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-1.5 w-full max-w-[360px] overflow-hidden rounded-full bg-black/10"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-black/15 transition-colors hover:border-accent md:h-20 md:w-20"
        >
          <Chevron direction="next" />
        </button>
      </div>
    </section>
  );
}
