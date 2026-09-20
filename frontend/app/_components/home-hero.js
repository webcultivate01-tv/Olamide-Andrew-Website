import Image from "next/image";
import Link from "next/link";
import Reveal from "../components/reveal";

// The rail deliberately runs past the right edge of the page — the third tile
// is meant to be cut off, signalling there is more to scroll to.
const WORK = [
  { src: "/case-studies/hero1.png", alt: "Grocery retail brand rollout" },
  { src: "/case-studies/Skyline.png", alt: "ACG identity applied to haulage livery" },
  { src: "/case-studies/Patches.png", alt: "Embroidered brand merchandise" },
];

export default function HomeHero() {
  return (
    <section className="overflow-hidden bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 pt-12 md:px-10 md:pt-16 lg:px-20 lg:pt-20">
        {/* Fixed two-line break: the accent phrase has to sit on the second
            line beside "GOOD." rather than wrap on its own. Each line flies
            in from its own edge — wide-left/wide-right — so they converge
            into place on load instead of just fading up. */}
        <h1 className="font-headline text-[2rem] leading-[1.2] tracking-[-0.01em] text-foreground uppercase sm:text-[3.25rem] md:text-[4rem] lg:text-[5rem]">
          <Reveal as="span" variant="wide-left" className="block">
            Your brand looks
          </Reveal>
          <Reveal as="span" variant="wide-right" delay={150} className="block">
            Good. <span className="text-accent">Is it working?</span>
          </Reveal>
        </h1>

        <Reveal
          as="p"
          variant="up"
          delay={120}
          className="mt-6 max-w-[560px] text-lg leading-relaxed text-black/70 md:mt-8 md:text-xl"
        >
          Looking good is the minimum. Working is the goal.
        </Reveal>

        <Reveal as="div" variant="up" delay={240} className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/about"
            className="font-nav inline-block bg-accent px-7 py-3.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover lg:text-lg"
          >
            Find out
          </Link>
          <Link
            href="/contact"
            className="font-nav inline-block border border-foreground px-7 py-3.5 text-base font-bold tracking-[0.02em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-white lg:text-lg"
          >
            Start a project
          </Link>
        </Reveal>
      </div>

      {/* Full-bleed rail: the padding lives on the row itself so the first tile
          lines up with the headline while the last one runs off-screen. On
          mobile the tile fills the viewport exactly (no peek of the next
          one) and snaps into place; larger breakpoints keep the deliberate
          cut-off tile as a "more to scroll" affordance. */}
      <div className="no-scrollbar mt-12 snap-x snap-mandatory overflow-x-auto scroll-pl-5 pb-14 md:mt-14 md:scroll-pl-10 md:pb-20 lg:scroll-pl-20 lg:pb-24">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex w-max gap-6 px-5 md:px-10 lg:px-20">
            {WORK.map((item, index) => (
              <Reveal
                key={item.src}
                variant="wipe"
                delay={index * 100}
                className="w-[calc(100vw-2.5rem)] shrink-0 snap-start sm:w-[380px] lg:w-[588px]"
              >
                {/* The inner div is the clipped frame the image eases out of
                    its zoom behind — see the wipe rules in globals.css for why
                    it can't be the Reveal wrapper itself. */}
                <div className="relative aspect-[588/570] w-full overflow-hidden rounded-lg bg-black/[.06]">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 588px, (min-width: 640px) 380px, 100vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}