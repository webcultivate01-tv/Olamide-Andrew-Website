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
      <div className="mx-auto max-w-[1600px] px-5 pt-14 pb-5 md:px-10 md:pt-20 lg:px-20 lg:pt-24 lg:pb-6">
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

        {/* Legal row. From sm up it is one line: copyright left, credit
            centre, policies right. On phones it wraps into two: copyright and
            policies on the first, the credit alone on the second. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-3 border-t border-black/15 pt-5 text-[10px] leading-none whitespace-nowrap text-foreground sm:flex-nowrap sm:gap-6 sm:text-xs md:mt-8 md:text-sm">
          <p>
            &copy; {new Date().getFullYear()} Olamide Andrew
            <span className="hidden sm:inline">. All rights reserved.</span>
          </p>
          <p className="order-3 w-full text-center sm:order-none sm:w-auto">
            Developed and managed by{" "}
            <a
              href="https://www.linkedin.com/in/tejasmehar/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-60"
            >
              Tejas Mehar
            </a>
          </p>
          <nav aria-label="Legal" className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/privacy-policy"
              className="transition-opacity hover:opacity-60"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className="transition-opacity hover:opacity-60"
            >
              Terms &amp; Conditions
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
