import Image from "next/image";
import Link from "next/link";

// The rail deliberately runs past the right edge of the page — the third tile
// is meant to be cut off, signalling there is more to scroll to.
const WORK = [
  { src: "/work/produce.jpg", alt: "Grocery retail brand rollout" },
  { src: "/work/acg.jpg", alt: "ACG identity applied to haulage livery" },
  { src: "/work/cap.jpg", alt: "Embroidered brand merchandise" },
];

export default function HomeHero() {
  return (
    <section className="overflow-hidden bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 pt-12 md:px-10 md:pt-16 lg:px-20 lg:pt-20">
        {/* Fixed two-line break: the accent phrase has to sit on the second
            line beside "GOOD." rather than wrap on its own. */}
        <h1 className="font-headline text-[2rem] leading-[1.05] tracking-[-0.01em] text-foreground uppercase sm:text-[3.25rem] md:text-[4rem] lg:text-[5rem]">
          <span className="block">Your brand looks</span>
          <span className="block">
            Good. <span className="text-accent">Is it working?</span>
          </span>
        </h1>

        <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-black/70 md:mt-8 md:text-xl">
          Looking good is the minimum. Working is the goal.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
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
        </div>
      </div>

      {/* Full-bleed rail: the padding lives on the row itself so the first tile
          lines up with the headline while the last one runs off-screen. */}
      <div className="no-scrollbar mt-12 overflow-x-auto pb-14 md:mt-14 md:pb-20 lg:pb-24">
        <div className="flex w-max gap-6 px-5 md:px-10 lg:px-20">
          {WORK.map((item) => (
            <div
              key={item.src}
              className="relative aspect-[588/570] w-[280px] shrink-0 overflow-hidden rounded-lg bg-black/[.06] sm:w-[380px] lg:w-[588px]"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority
                sizes="(min-width: 1024px) 588px, (min-width: 640px) 380px, 280px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
