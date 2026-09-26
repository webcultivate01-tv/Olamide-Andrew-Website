import Link from "next/link";
import ArrowUpRight from "../../components/arrow-up-right";
import Reveal from "../../components/reveal";

const EMAIL = "ishola826@gmail.com";

// TODO: swap the placeholder hrefs for the real profile URLs.
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Instagram", href: "#" },
];

/**
 * "Lets work together" block shown under the discovery CTA on phones only
 * (hidden from md up, where the desktop layout takes over).
 */
export default function BlogMobileContact() {
  return (
    <section className="bg-white px-4 pt-[34px] pb-[59px] text-center md:hidden">
      <h2 className="font-headline text-[48px] leading-[47px] uppercase">
        <Reveal as="span" variant="left" className="block text-foreground">
          Lets Work
        </Reveal>
        <Reveal as="span" variant="right" delay={120} className="text-outline-navy block">
          Together
        </Reveal>
      </h2>

      <p className="mt-2 text-base leading-6 text-foreground">
        <a
          href={`mailto:${EMAIL}`}
          className="relative inline-block transition-opacity hover:opacity-60"
        >
          {EMAIL}
          <svg
            aria-hidden="true"
            viewBox="0 0 160 6"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-full h-1.5 w-full"
          >
            <path
              d="M0 4 Q80 0.5 160 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </a>
      </p>

      <div className="mt-11 flex items-center justify-center gap-3.5">
        <Link
          href="/contact"
          className="font-headline flex h-[49px] w-[140px] items-center justify-center bg-accent text-[13px] text-black uppercase transition-colors hover:bg-accent-hover"
        >
          Start a project
        </Link>
        <Link
          href="/contact"
          className="font-headline flex h-[49px] w-[144px] items-center justify-center border-2 border-foreground text-[13px] text-foreground uppercase transition-colors hover:bg-foreground hover:text-white"
        >
          See availability
        </Link>
      </div>

      <nav
        aria-label="Social"
        className="mt-[30px] flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
      >
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-base leading-6 text-foreground/80 transition-colors hover:text-navy"
          >
            {link.label}
            <ArrowUpRight />
          </a>
        ))}
      </nav>
    </section>
  );
}
