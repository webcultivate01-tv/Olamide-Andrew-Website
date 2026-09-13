import ArrowUpRight from "../../components/arrow-up-right";
import Reveal from "../../components/reveal";

const EMAIL = "ishola826@gmail.com";

// TODO: swap the placeholder hrefs for the real profile URLs.
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Instagram", href: "#" },
];

export default function LetsWorkCta() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-20 text-center md:px-10 md:py-28 lg:px-20 lg:py-32">
      {/* Anton's caps fill ~0.71em of the line box, so the visible gap between
          the two lines is roughly (leading - 0.71)em. 1.08 leaves a clear band
          of white between LETS WORK and TOGETHER. */}
      <h1 className="font-headline text-[3.25rem] leading-[1.08] tracking-[-0.01em] uppercase sm:text-[5rem] md:text-[6rem] lg:text-[7.5rem]">
        <Reveal as="span" variant="left" className="block text-foreground">
          Lets Work
        </Reveal>
        <Reveal as="span" variant="right" delay={120} className="text-outline-navy block">
          Together
        </Reveal>
      </h1>

      <p className="mt-8 text-lg text-foreground md:mt-10 md:text-xl">
        <a
          href={`mailto:${EMAIL}`}
          className="transition-opacity hover:opacity-60"
        >
          {EMAIL}
        </a>
      </p>

      <a
        href={`mailto:${EMAIL}`}
        className="font-nav mt-12 inline-block bg-accent px-7 py-3.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover md:mt-16 lg:text-lg"
      >
        Send a message
      </a>

      <nav
        aria-label="Social"
        className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:mt-24"
      >
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-base text-foreground/80 transition-colors hover:text-navy"
          >
            {link.label}
            <ArrowUpRight />
          </a>
        ))}
      </nav>
    </section>
  );
}
