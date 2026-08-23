import Link from "next/link";
import ArrowUpRight from "./arrow-up-right";

const EMAIL = "ishola826@gmail.com";

// TODO: swap the placeholder hrefs for the real profile URLs.
const SOCIAL_LINKS = [
  { label: "X", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Instagram", href: "#" },
];

export default function BrandWorkCta() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-20 text-center md:px-10 md:py-28 lg:px-20 lg:py-32">
      {/* Fixed two-line break. The steps below lg keep the longer second line
          inside the gutters at every width — Anton caps run wide fast. */}
      <h2 className="font-headline text-[2rem] leading-[1.08] tracking-[-0.01em] text-foreground uppercase sm:text-[3.25rem] md:text-[4.5rem] lg:text-[5.5rem] xl:text-[6rem]">
        <span className="block">Lets make your brand</span>
        <span className="block">Work as hard as you do</span>
      </h2>

      <p className="mt-5 text-xl text-foreground md:mt-6 md:text-[1.625rem]">
        <a
          href={`mailto:${EMAIL}`}
          className="transition-opacity hover:opacity-60"
        >
          {EMAIL}
        </a>
      </p>

      <Link
        href="/contact"
        className="font-nav mt-16 inline-block bg-accent px-7 py-2.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover md:mt-20 lg:text-lg"
      >
        Book a free brand clarity audit
      </Link>

      <nav
        aria-label="Social"
        className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:mt-20"
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
