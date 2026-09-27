import Link from "next/link";
import Wordmark from "./wordmark";

const FOOTER_LINKS = [
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/#services" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-footer text-foreground">
      <div className="mx-auto max-w-[1600px] px-5 pt-14 pb-10 md:px-10 md:pt-20 lg:px-20 lg:pt-24 lg:pb-16">
        {/* One row at every width. Five labels can't hold the full size
            inside a phone's gutters, so the type steps down rather than the
            row wrapping — nowrap keeps "Case Studies" from splitting. */}
        <nav
          aria-label="Footer"
          className="flex items-center justify-between gap-x-2 sm:gap-x-6"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs leading-none whitespace-nowrap tracking-[-0.01em] text-foreground transition-opacity hover:opacity-60 sm:text-lg lg:text-xl"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* The wordmark's viewBox carries its own top headroom, so the
            margin here is trimmed to keep the optical gap unchanged. */}
        <Wordmark className="mt-12 md:mt-16 lg:mt-20" />
      </div>
    </footer>
  );
}
