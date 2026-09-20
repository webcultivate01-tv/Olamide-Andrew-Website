import Link from "next/link";
import Reveal from "../components/reveal";

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
  "font-headline text-[3rem] leading-[48px] tracking-[-0.01em] text-foreground uppercase sm:text-[2.75rem] sm:leading-[96px] md:text-[3.5rem] lg:text-[4.25rem]";

// The narrow measure is doing layout work: it holds each sub-line to the
// two-line break the design calls for.
const SUBLINE =
  "mx-auto mt-6 max-w-[360px] text-lg leading-[24px] md:leading-relaxed text-black/65 md:mt-10 md:text-xl";

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
      <h2
        className={`mx-auto max-w-[980px] lg:flex lg:h-[163px] lg:w-[1280px] lg:max-w-none lg:flex-col lg:items-center lg:justify-center ${HEADLINE}`}
      >
        <Reveal as="span" variant="wide-left" className="max-md:contents md:block">
          Every brand sends a<br className="md:hidden" /> message. Is
        </Reveal>{" "}
        <Reveal
          as="span"
          variant="wide-right"
          delay={150}
          className="max-md:contents md:block"
        >
          yours<br className="md:hidden" /> sending the right one?
        </Reveal>
      </h2>
      <Reveal as="p" variant="up" delay={120} className={SUBLINE}>
        Your brand shapes perception before you ever have the chance to.
      </Reveal>

      <div className="mt-28 md:mt-48">
        <Reveal variant="mask">
          <h2
            className={`mx-auto max-w-[820px] lg:flex lg:h-[163px] lg:w-[860px] lg:max-w-none lg:items-center lg:justify-center lg:leading-[96px] ${HEADLINE}`}
          >
            Good design does not{" "}
            <br className="sm:hidden" />
            build great brands
          </h2>
        </Reveal>
        {/* The burst is positioned in em units off this line, so it tracks the
            headline as the type scales instead of drifting. The top margin
            is set to HEADLINE's leading (96px) minus its own font size at
            each breakpoint, so the gap here matches the gap the headline's
            own leading creates between its two lines. The extra delay lets
            the mask above land first, so the punchline reads as a reply. */}
        <Reveal
          as="p"
          variant="roll"
          delay={320}
          className="font-headline relative mx-auto mt-[48px] inline-block text-[3rem] leading-[1.1] tracking-[0.12em] text-outline-navy uppercase sm:mt-[3.25rem] sm:text-[2.25rem] md:mt-[2.5rem] md:text-[3rem] lg:mt-[1.75rem] lg:text-[3.75rem] lg:leading-[110px]"
        >
          Strategy does!
          <Burst />
        </Reveal>
      </div>

      <div className="mt-28 md:mt-48">
        <Reveal variant="mask">
          <h2 className={`mx-auto max-w-[760px] ${HEADLINE}`}>
            Your brand should
            <br className="md:hidden" /> communicate your value
            <br className="md:hidden" /> before you do.
          </h2>
        </Reveal>
        <Reveal
          as="p"
          variant="up"
          delay={120}
          className={SUBLINE.replace("leading-relaxed", "leading-[40px]")}
        >
          Build trust before the first conversation begins.
        </Reveal>

        <Reveal as="div" variant="up" delay={240} className="mt-8">
          <Link
            href="/case-studies"
            className="font-nav inline-block bg-accent px-5 py-3 text-sm font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover md:text-base"
          >
            See what that looks like
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
