"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "./admin-sidebar";
import AdminTopbar from "./admin-topbar";
import { EnquiryNotificationsProvider } from "./enquiry-notifications";

/**
 * The frame every signed-in admin page sits in.
 *
 * Two columns on desktop: a sidebar fixed to the viewport, and everything else
 * to the right of it. The sidebar being `fixed` rather than a flex sibling is
 * what lets the navigation and the account block hold their own scroll while
 * the page scrolls behind them; the matching `lg:pl-72` on the content column
 * is what stops them overlapping.
 *
 * Below `lg` the same sidebar becomes a drawer over the content, opened from
 * the top bar. It stays mounted so it can slide rather than appear, and is
 * marked `inert` while closed — that takes its links out of the tab order and
 * out of hit-testing, which `pointer-events-none` alone would not do.
 *
 * It is mounted only by pages that have already had their session verified on
 * the server, which is why the notifications provider lives here rather than
 * in app/admin/layout.js. The login and password-reset screens are under
 * /admin too, and a provider in the layout would have them opening a socket
 * and asking for enquiry counts while nobody is logged in.
 */

function CloseIcon() {
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
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function AdminShell({
  admin,
  stats,
  title,
  description,
  breadcrumb,
  actions,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // While the drawer is over the page, Escape closes it and the page behind
  // it stops scrolling — otherwise a flick on the backdrop moves the content
  // the drawer is covering.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const hasPageHeader = Boolean(title || description || breadcrumb || actions);

  return (
    <EnquiryNotificationsProvider initialStats={stats}>
      <div className="min-h-screen bg-footer">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-black/10 lg:flex">
          <AdminSidebar admin={admin} />
        </aside>

        <div
          className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
          inert={!menuOpen}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close admin menu"
            onClick={() => setMenuOpen(false)}
            className={`absolute inset-0 h-full w-full bg-navy/50 transition-opacity duration-300 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            id="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className={`absolute inset-y-0 left-0 w-[85%] max-w-[19rem] border-r border-black/10 shadow-2xl transition-transform duration-300 ease-out ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <AdminSidebar admin={admin} onNavigate={() => setMenuOpen(false)} />

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close admin menu"
              className="absolute top-5 right-4 inline-flex h-9 w-9 items-center justify-center text-navy transition-colors hover:bg-navy/10"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="lg:pl-72">
          <AdminTopbar admin={admin} onOpenMenu={() => setMenuOpen(true)} />

          <main className="px-5 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
            <div className="mx-auto w-full max-w-[1240px]">
              {hasPageHeader ? (
                <div className="mb-8 md:mb-10">
                  {breadcrumb}

                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                      {title ? (
                        <h1 className="font-headline text-4xl leading-none tracking-tight text-navy uppercase md:text-5xl">
                          {title}
                        </h1>
                      ) : null}

                      {description ? (
                        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-black/60">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    {actions ? <div className="shrink-0">{actions}</div> : null}
                  </div>
                </div>
              ) : null}

              {children}
            </div>
          </main>
        </div>
      </div>
    </EnquiryNotificationsProvider>
  );
}
