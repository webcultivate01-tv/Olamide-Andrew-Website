"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { clamp01, watchScroll } from "@/app/components/scroll-progress";
import Reveal from "../../components/reveal";
import { FULL_FRAME } from "./case-study-layout";

/**
 * The case study's cover image, pinned to the top of the screen so the rest
 * of the page rides up over it instead of pushing it off.
 *
 * The pin is `position: sticky` against the <article>, which is the whole
 * page — so once the hero reaches the top it stays there, hidden behind the
 * opaque column of content that passes over it. What sells it is the drift:
 * while it is being covered the image eases upward and zooms a fraction
 * behind a closing veil, so it reads as falling away behind the page rather
 * than as a picture that got stuck to the window.
 */
export default function CaseStudyHero({ src, alt }) {
  const heroRef = useRef(null);
  const rulerRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const ruler = rulerRef.current;
    if (!hero || !ruler) return;

    // A stuck element is its own blind spot: the moment it pins, its rect
    // stops moving and it can no longer say how far it has been covered. So
    // the measurement is taken from the seam directly below it instead —
    // which starts one hero-height down the screen and reaches the top of
    // the viewport at the exact moment the hero is completely hidden.
    return watchScroll(
      ruler,
      (rect) => {
        const height = hero.getBoundingClientRect().height;
        return clamp01((height - rect.top) / (height || 1));
      },
      (progress) => hero.style.setProperty("--hero-cover", progress),
    );
  }, []);

  return (
    <>
      <div
        ref={heroRef}
        className={`sticky top-0 z-0 hidden overflow-hidden md:block ${FULL_FRAME}`}
      >
        {/* The drift gets a layer of its own above the reveal rather than
            sharing one with it: the wipe's settle animation owns the
            transform of the element it lands on, and one element cannot
            carry two. */}
        <div data-hero-media className="absolute inset-0">
          <Reveal variant="wipe" className="absolute inset-0">
            <div className="absolute inset-0">
              <div className="absolute inset-0">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div
          data-hero-veil
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black"
        />
      </div>

      {/* The seam the drift is measured against: no height, no box, nothing
          to see — it only has to sit where the page begins. */}
      <div ref={rulerRef} aria-hidden="true" className="h-0" />
    </>
  );
}
