"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminName, adminRole } from "@/lib/admin-config";
import AdminAvatar from "./admin-avatar";
import AdminClock from "./admin-clock";
import { currentNavLabel } from "./admin-nav";
import NotificationBell from "./notification-bell";

/**
 * The bar across the top of every admin page.
 *
 * Left is where you are — a menu button and the logo on small screens, the
 * section name on large ones. Right is the standing information an admin
 * glances at rather than navigates to: Canadian time and date, the enquiry
 * bell, and the account's own photo.
 *
 * It is sticky, so the clock and the bell stay in view down a long table of
 * enquiries.
 */

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function AdminTopbar({ admin, onOpenMenu }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 md:gap-5 md:px-8 md:py-4 lg:px-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open admin menu"
          aria-controls="admin-drawer"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-black/10 text-navy transition-colors hover:bg-navy hover:text-white lg:hidden"
        >
          <MenuIcon />
        </button>

        <Link href="/admin/dashboard" className="shrink-0 lg:hidden" aria-label="Dashboard">
          <Image src="/logo.png" alt="" width={40} height={40} className="h-9 w-9" />
        </Link>

        {/* One line, not a second title: the page's own heading is right
            below it, and this only has to say where in the panel you are once
            the header is sticky over a long table. */}
        <p className="font-nav hidden min-w-0 truncate text-[0.7rem] font-bold tracking-[0.2em] uppercase lg:block">
          <span className="text-muted">Admin Panel</span>
          <span aria-hidden="true" className="px-2 text-black/20">/</span>
          <span className="text-navy">{currentNavLabel(pathname)}</span>
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-5">
          <AdminClock />

          <span aria-hidden="true" className="hidden h-9 w-px bg-black/10 md:block" />

          <NotificationBell />

          <Link
            href="/admin/profile"
            className="flex items-center gap-3"
            title={`${adminName(admin)} — ${adminRole(admin)}`}
          >
            <span className="hidden text-right leading-tight xl:block">
              <span className="block text-sm font-semibold text-foreground">
                {adminName(admin)}
              </span>
              <span className="font-nav block text-[0.6rem] font-bold tracking-[0.18em] text-muted uppercase">
                {adminRole(admin)}
              </span>
            </span>
            <AdminAvatar
              admin={admin}
              className="h-10 w-10 md:h-11 md:w-11"
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
