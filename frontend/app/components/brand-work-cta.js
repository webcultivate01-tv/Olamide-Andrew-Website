import Link from "next/link";
import ArrowUpRight from "./arrow-up-right";
import Reveal from "./reveal";

const EMAIL = "ishola826@gmail.com";

// TODO: swap the placeholder hrefs for the real profile URLs.
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Instagram", href: "#" },
];

export default function BrandWorkCta() {
  return (
    <section className="relative mx-auto max-w-[1600px] overflow-hidden px-5 py-20 text-center md:px-10 md:py-28 lg:px-20 lg:py-32">
      {/* Soft ambient glow behind the headline — purely decorative, so it's
          hidden from assistive tech and never intercepts pointer events. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-[120px] md:h-[560px] md:w-[860px]"
      />

      {/* On md+ each span is its own block, so lines break exactly at the
          three phrase boundaries and converge from alternating sides,
          mirroring the split entrance BrandMessage uses higher up the page.
          Below md the spans collapse to display:contents so the words flow
          and wrap naturally at the smaller size instead of forcing those
          same three breaks into a narrow column. */}
      <h2 className="font-headline relative text-[3rem] leading-[52px] tracking-[-0.01em] text-foreground uppercase sm:text-[3.25rem] md:text-[4.5rem] lg:text-[5.5rem] lg:leading-[120px] xl:text-[6rem]">
        <Reveal
          as="span"
          variant="wide-left"
          className="max-md:contents md:block"
        >
          Lets make your brand
        </Reveal>{" "}
        <Reveal
          as="span"
          variant="wide-right"
          delay={150}
          className="max-md:contents md:block"
        >
          Work as hard
        </Reveal>{" "}
        <Reveal
          as="span"
          variant="wide-left"
          delay={300}
          className="max-md:contents md:block"
        >
          as you do
        </Reveal>
      </h2>

      <Reveal
        as="p"
        variant="up"
        delay={280}
        className="relative mt-5 text-xl text-foreground md:mt-6 md:text-[1.625rem]"
      >
        <a
          href={`mailto:${EMAIL}`}
          className="transition-opacity hover:opacity-60"
        >
          {EMAIL}
        </a>
      </Reveal>

      <Reveal as="div" variant="roll" delay={400} className="relative">
        <Link
          href="/contact"
          className="font-nav mt-16 inline-block bg-accent px-7 py-2.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] md:mt-20 lg:text-lg"
        >
          Book a free brand clarity audit
        </Link>
      </Reveal>

      <nav
        aria-label="Social"
        className="relative mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:mt-20"
      >
        {SOCIAL_LINKS.map((link, index) => (
          <Reveal
            key={link.label}
            as="a"
            variant="up"
            delay={520 + index * 80}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-base text-foreground/80 transition-colors hover:text-navy"
          >
            {link.label}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight />
            </span>
          </Reveal>
        ))}
      </nav>
    </section>
  );
}
