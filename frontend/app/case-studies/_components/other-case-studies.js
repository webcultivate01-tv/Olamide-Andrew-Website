"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import Reveal from "../../components/reveal";

// How long each slide holds before the carousel advances to the next one.
const AUTO_ADVANCE_MS = 2000;
// How long the slide transform takes, so the loop-reset below can wait for
// it to finish before snapping back to the real start.
const SLIDE_MS = 700;

function StudyCard({ study }) {
  return (
    <Link href={`/case-studies/${study.slug}`} className="group block">
      <div className="clip-notch overflow-hidden rounded-[16px]">
        <div className="relative aspect-[580/360] w-full">
          <Image
            src={mediaUrl(study.imageUrl)}
            alt={study.imageAlt || study.title || ""}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-foreground">{study.title}</h3>

      {study.service || study.categories?.length ? (
        <p className="mt-1 text-sm text-black/55">
          {study.categories?.length ? study.categories.join(", ") : study.service}
        </p>
      ) : null}
    </Link>
  );
}

// Two cards showing side by side from `sm` up, one on phones — matches the
// grid this replaced.
function useSlotsPerView() {
  const [slots, setSlots] = useState(1);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setSlots(query.matches ? 2 : 1);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return slots;
}

/**
 * The sliding track itself. Keyed by the caller on `slots` and the study
 * list, so a resize across the `sm` breakpoint or a navigation to a study
 * with a different set of others starts this over with fresh state instead
 * of trying to reconcile an index that no longer means the same thing.
 */
function Carousel({ studies, slots }) {
  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(true);

  const canLoop = studies.length > slots;
  // Trailing clones of the first slots so the track can keep sliding forward
  // past the real end; once they're fully on screen the loop snaps back to
  // index 0 with the transition off, which reads as an endless carousel.
  const track = canLoop ? [...studies, ...studies.slice(0, slots)] : studies;

  useEffect(() => {
    if (!canLoop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setIndex((current) => current + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [canLoop]);

  useEffect(() => {
    if (!canLoop || index !== studies.length) return;

    const id = setTimeout(() => {
      setAnimated(false);
      setIndex(0);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, canLoop, studies.length]);

  // Restore the transition on the next frame, after the snap-back above has
  // already landed at index 0 with it off.
  useEffect(() => {
    if (animated) return;
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [animated]);

  return (
    <div className="mt-6 -mx-2.5 overflow-hidden md:mt-8">
      <div
        className={`flex ${animated ? "transition-transform duration-700 ease-out" : ""}`}
        style={{ transform: `translateX(-${index * (100 / slots)}%)` }}
      >
        {track.map((study, i) => (
          <div key={`${study.id}-${i}`} className="w-full shrink-0 px-2.5 sm:w-1/2">
            <StudyCard study={study} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The other studies shown at the foot of a detail page, so a visitor who has
 * just read one project has somewhere obvious to go next. When there are
 * more studies than fit on screen at once, the extra ones aren't left off —
 * the row auto-advances every couple of seconds, the next study sliding in
 * from the right, looping back to the start once it reaches the end.
 */
export default function OtherCaseStudies({ studies = [] }) {
  const visible = studies.filter((study) => study.imageUrl);
  const slots = useSlotsPerView();

  if (!visible.length) return null;

  return (
    <section className="mt-20 border-t border-black/10 pt-14 md:mt-28 md:pt-20">
      <Reveal
        as="p"
        className="font-nav text-xs font-bold tracking-[0.2em] text-black/45 uppercase"
      >
        Other Case Studies
      </Reveal>

      <Carousel
        key={`${slots}-${visible.map((study) => study.id).join(",")}`}
        studies={visible}
        slots={slots}
      />
    </section>
  );
}
