"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminName, adminRole } from "@/lib/admin-config";
import AdminAvatar from "./admin-avatar";
import { NAV_SECTIONS, isCurrentNav } from "./admin-nav";
import { useEnquiryNotifications } from "./enquiry-notifications";
import LogoutButton from "./logout-button";

/**
 * The admin panel's left column: brand, navigation, and the signed-in account.
 *
 * One component serves both the fixed desktop rail and the mobile drawer — the
 * shell decides where it is mounted and how it is revealed, this decides what
 * is in it. `onNavigate` is how the drawer closes itself after a link is
 * followed; on desktop nothing passes it and nothing happens.
 *
 * The three rows are a flex column: brand and profile keep their natural
 * height, and the navigation between them takes the rest and scrolls. That is
 * what keeps the account block pinned to the bottom of the screen however long
 * the menu grows.
 */

function NavBadge({ count }) {
  if (!count) return null;

  return (
    <span className="font-nav ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.7rem] leading-none font-bold text-black">
      {/* Past 99 the badge would push the label out of shape. */}
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLink({ item, isCurrent, unread, onNavigate }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isCurrent ? "page" : undefined}
      className={`font-nav relative flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-[0.06em] uppercase transition-colors ${
        isCurrent
          ? "bg-navy text-white"
          : "text-navy/70 hover:bg-navy/[0.06] hover:text-navy"
      }`}
    >
      {/* An accent rule down the selected row: the site marks emphasis with
          this yellow everywhere else, and it reads at a glance from the
          corner of the eye. */}
      {isCurrent ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
      ) : null}

      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge === "enquiries" ? <NavBadge count={unread} /> : null}
    </Link>
  );
}

export default function AdminSidebar({ admin, onNavigate }) {
  const pathname = usePathname();
  const { unread } = useEnquiryNotifications();

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="shrink-0 border-b border-black/10 px-6 py-6">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
          aria-label="Olamide Admin Panel — dashboard"
        >
          <Image src="/logo.png" alt="" width={48} height={48} className="h-10 w-10" />
          <span className="min-w-0">
            <span className="font-headline block truncate text-xl leading-none tracking-tight text-navy uppercase">
              Olamide
            </span>
            <span className="font-nav mt-1 block text-[0.62rem] font-bold tracking-[0.22em] text-muted uppercase">
              Admin Panel
            </span>
          </span>
        </Link>
      </div>

      {/* The rail scrolls once the menu outgrows the screen, but never shows a
          bar for it — .no-scrollbar hides the track while the wheel, trackpad
          and keyboard all still work. overscroll-contain stops a flick at the
          end of the list from scrolling the page behind it. */}
      <nav
        aria-label="Admin"
        className="no-scrollbar flex-1 overflow-y-auto overscroll-contain py-6"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <p className="font-nav px-6 pb-2 text-[0.6rem] font-bold tracking-[0.22em] text-muted uppercase">
              {section.label}
            </p>

            <div className="flex flex-col">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isCurrent={isCurrentNav(pathname, item.href)}
                  unread={unread}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-black/10 bg-footer/60 px-5 py-5">
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className="group flex items-center gap-3"
        >
          <AdminAvatar admin={admin} className="h-12 w-12" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground group-hover:text-navy">
              {adminName(admin)}
            </span>
            <span className="font-nav mt-0.5 block truncate text-[0.62rem] font-bold tracking-[0.18em] text-muted uppercase">
              {adminRole(admin)}
            </span>
          </span>
        </Link>

        <p className="mt-3 truncate text-xs text-black/45" title={admin?.email}>
          {admin?.email}
        </p>

        <LogoutButton variant="danger" className="mt-4" />
      </div>
    </div>
  );
}
