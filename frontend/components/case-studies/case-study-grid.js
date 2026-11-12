import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import Reveal from "@/components/shared/reveal";
import RevealWords from "@/components/shared/reveal-words";

// Studies that carry the folded-tab callout (see insights-hero.js for the
// same shape: two clip-path triangles either side of a white label block,
// with the light-blue underside on the left edge so the fold reads as 3D
// rather than a flat rectangle). Matched by title rather than a DB column
// since it's a one-off visual callout, not a general per-study feature.
// Currently empty — no study is featured this way.
const RIBBONS = {};

/**
 * The portfolio grid.
 *
 * `studies` comes from the API — the published rows of the case_studies table,
 * in the order the admin panel arranged them. This used to be a hardcoded
 * array in this file; those same four entries are now the seed data behind the
 * table, so the page looks the same and is editable.
 *
 * A study with no image is skipped rather than rendered as a hole in the grid:
 * this layout is photographs first, and a card with an empty frame reads as
 * broken. The panel shows an unmistakable "None" thumbnail on any such row.
 */
export default function CaseStudyGrid({ studies = [] }) {
  // Skip studies with no image, and any repeat of a study already shown
  // (same slug or same title), so a duplicated row can never render twice.
  const seen = new Set();
  const visible = studies.filter((study) => {
    if (!study.imageUrl) return false;
    const keys = [study.slug, (study.title || "").trim().toLowerCase()].filter(Boolean);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });

  return (
    <section className="bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
        {/* 48px line height on mobile (36px type set that tight reads as one
            block, not a slab of leftover leading); 96px from sm up per design
            spec, once the type itself is large enough to want the room.
            Word-by-word reveal (rather than the single-block mask) so the
            line reads as the words themselves arriving, not a slab of text
            sliding into place. */}
        <RevealWords
          as="h1"
          text="Every concept starts with a business problem, not a design brief."
          accent="business problem,"
          step={55}
          className="font-headline mx-auto max-w-[960px] text-center text-[2.25rem] leading-[48px] tracking-[-0.01em] text-foreground uppercase sm:text-[3.25rem] sm:leading-[96px] md:text-[3.75rem] lg:text-[4.75rem] xl:text-[5.125rem]"
        />

        {/* The copy trails the headline rather than moving with it: the stagger
            is what makes the block read as one gesture. */}
        <Reveal
          as="p"
          delay={180}
          className="mx-auto mt-8 max-w-[600px] text-center text-lg leading-[2.1] text-black/65 md:mt-10 md:text-xl"
        >
          The goal isn&apos;t to showcase visuals. It&apos;s to show how
          strategic thinking shapes an effective brand.
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-[1240px] gap-x-5 gap-y-11 sm:grid-cols-2 md:mt-16 lg:mt-20">
          {visible.map((study, index) => (
            // The whole card rolls up into place (3D tip on its own bottom
            // edge) before the image's own wipe plays inside it — the two
            // reveals nest without conflict since they sit on different
            // elements. Gives the grid a modern feel on every breakpoint,
            // rather than the cards simply appearing.
            <Reveal as="article" variant="roll" delay={index * 90} key={study.id}>
              <Link href={`/case-studies/${study.slug}`} className="group block">
                {/* The notch and the rounding are cut here rather than baked into
                    the photo, so any replacement crop picks up the same shape.
                    Both clips apply at once — the visible area is their overlap —
                    and they sit outside the Reveal on purpose: the wipe animates
                    clip-path on its own child, which would overwrite the notch.
                    See the wipe rules in globals.css. */}
                <div className="clip-notch overflow-hidden rounded-[16px]">
                  <Reveal variant="wipe" delay={index % 2 ? 140 : 0}>
                    {/* The inner div is the clipped frame the image eases out of
                        its zoom behind — it can't be the Reveal wrapper itself. */}
                    <div>
                      {/* 580×360 — same card size as the "Other Case Studies"
                          slider on the detail pages. */}
                      <div className="relative aspect-[580/360] w-full bg-black/[.05]">
                        {/* mediaUrl resolves the stored path: an upload lives on
                            the API's origin, an original launch image in this
                            site's own public folder. */}
                        <Image
                          src={study.src ?? mediaUrl(study.imageUrl)}
                          alt={study.imageAlt || study.title || ""}
                          fill
                          loading="lazy"
                          decoding="async"
                          sizes="(min-width: 1600px) 620px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        {RIBBONS[study.title] && (
                          <div className="absolute top-4 left-4 inline-flex max-w-[calc(100%-2rem)] items-stretch sm:top-5 sm:left-5">
                            <div className="h-auto w-3 shrink-0 self-stretch bg-[#a9c6da] [clip-path:polygon(0_0,100%_0,0_100%)] sm:w-4" />
                            <div className="bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                              <p className="font-nav text-[9px] font-semibold tracking-[0.16em] text-black/60 uppercase sm:text-[10px]">
                                {RIBBONS[study.title].kicker}
                              </p>
                              <p className="font-headline mt-0.5 text-base tracking-[-0.01em] text-foreground uppercase sm:text-lg">
                                {RIBBONS[study.title].label}
                              </p>
                            </div>
                            <div className="h-auto w-3 shrink-0 self-stretch bg-white [clip-path:polygon(0_0,100%_0,100%_100%)] sm:w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Reveal>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {study.title}
                </h3>

                <p className="mt-2 max-w-[540px] text-base leading-[1.9] text-black/70">
                  {study.summary}
                </p>

                {/* A cue that the card opens the full study. A span, not a
                    nested link: the whole card is already the link. */}
                <div className="mt-4 flex justify-start">
                  <span className="font-nav inline-flex items-center gap-2.5 bg-accent px-6 py-3 text-sm font-bold tracking-[0.02em] text-black uppercase transition-colors group-hover:bg-accent-hover">
                    View case study
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
