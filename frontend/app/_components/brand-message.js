import Link from "next/link";

// 16-spike burst, drawn once at module scope so the geometry is not recomputed
// per render. Alternating outer/inner radius around a 100×100 box.
const BURST_POINTS = Array.from({ length: 32 }, (_, i) => {
  const radius = i % 2 === 0 ? 50 : 14;
  const angle = (Math.PI * i) / 16 - Math.PI / 2;
  return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(
    50 +
    radius * Math.sin(angle)
  ).toFixed(2)}`;
}).join(" ");

const HEADLINE =
  "font-headline text-[1.75rem] leading-[1.1] tracking-[-0.01em] text-foreground uppercase sm:text-[2.75rem] md:text-[3.5rem] lg:text-[4.25rem]";

// The narrow measure is doing layout work: it holds each sub-line to the
// two-line break the design calls for.
const SUBLINE =
  "mx-auto mt-6 max-w-[360px] text-lg leading-relaxed text-black/65 md:mt-10 md:text-xl";

function Burst() {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="absolute -top-[0.75em] -right-[1.15em] h-[1.35em] w-[1.35em] text-accent"
    >
      <polygon points={BURST_POINTS} fill="currentColor" />
    </svg>
  );
}

export default function BrandMessage() {
  // overflow-hidden: the burst is allowed to hang past the headline's box, and
  // without clipping it pushes the page sideways on narrow screens.
  return (
    <section className="mx-auto max-w-[1600px] overflow-hidden px-5 py-20 text-center md:px-10 md:py-28 lg:px-20">
      <h2 className={`mx-auto max-w-[980px] ${HEADLINE}`}>
        Every brand sends a message. Is yours sending the right one?
      </h2>
      <p className={SUBLINE}>
        Your brand shapes perception before you ever have the chance to.
      </p>

      <div className="mt-28 md:mt-48">
        <h2 className={`mx-auto max-w-[820px] ${HEADLINE}`}>
          Good design does not build great brands
        </h2>
        {/* The burst is positioned in em units off this line, so it tracks the
            headline as the type scales instead of drifting. */}
        <p className="font-headline relative mx-auto mt-3 inline-block text-[1.5rem] leading-none tracking-[0.12em] text-outline-navy uppercase sm:text-[2.25rem] md:text-[3rem] lg:text-[3.75rem]">
          Strategy does!
          <Burst />
        </p>
      </div>

      <div className="mt-28 md:mt-48">
        <h2 className={`mx-auto max-w-[760px] ${HEADLINE}`}>
          Your brand should communicate your value before you do.
        </h2>
        <p className={SUBLINE}>
          Build trust before the first conversation begins.
        </p>

        <Link
          href="/case-studies"
          className="font-nav mt-8 inline-block bg-accent px-5 py-3 text-sm font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover md:text-base"
        >
          See what that looks like
        </Link>
      </div>
    </section>
  );
}
