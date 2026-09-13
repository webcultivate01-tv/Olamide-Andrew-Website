"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
];

const CTA = { label: "Get in touch", href: "/contact" };

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white">
      <div className="relative mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 md:h-28 md:px-10 lg:px-20">
        <Link
          href="/"
          aria-label="Olamide — home"
          className="relative z-10 shrink-0"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="Olamide"
            width={64}
            height={64}
            loading="eager"
            className="h-11 w-11 md:h-14 md:w-14"
          />
        </Link>

        {/* Desktop nav — absolutely centred so it stays put regardless of logo/CTA width */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:gap-9 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={`font-nav text-base font-bold uppercase tracking-[0.02em] transition-colors hover:text-navy lg:text-lg ${
                isActive(pathname, link.href) ? "text-navy" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={CTA.href}
          className="font-nav relative z-10 hidden bg-accent px-6 py-3 text-base font-bold uppercase tracking-[0.02em] text-black transition-colors hover:bg-accent-hover md:inline-block lg:text-lg"
        >
          {CTA.label}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="relative z-10 flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
        >
          <span
            className={`block h-[2px] w-6 bg-navy transition-transform ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-navy transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-navy transition-transform ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Primary mobile"
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full border-t border-black/10 bg-white px-5 py-6 shadow-lg transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-6 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                tabIndex={open ? undefined : -1}
                onClick={() => setOpen(false)}
                aria-current={
                  isActive(pathname, link.href) ? "page" : undefined
                }
                className={`font-nav text-xl font-bold uppercase tracking-[0.02em] ${
                  isActive(pathname, link.href) ? "text-navy" : "text-muted"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link
              href={CTA.href}
              tabIndex={open ? undefined : -1}
              onClick={() => setOpen(false)}
              className="font-nav inline-block bg-accent px-6 py-3 text-lg font-bold uppercase tracking-[0.02em] text-black"
            >
              {CTA.label}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
