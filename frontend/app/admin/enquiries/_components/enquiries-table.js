"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ENQUIRY_STATUSES, getEnquiries, statusLabel } from "@/lib/api";
import { useEnquiryNotifications } from "../../_components/enquiry-notifications";
import LocalTime from "../../_components/local-time";
import StatusBadge from "./status-badge";

/**
 * The enquiries list: stats, search, status filter, table and paging.
 *
 * The server renders the first page and hands it over as `initial`, so there
 * is a full table in the HTML before any JavaScript runs. From then on this
 * component owns the query — a filter, a search or a page change refetches,
 * and so does a bump of `version`, which the notifications provider raises
 * whenever the server says something changed.
 */

const PER_PAGE = 20;

// Which stat cards to show, in pipeline order. `status: null` is the Total
// card, which clears the filter rather than setting one.
const STAT_CARDS = [
  { key: "total", label: "Total", status: null },
  { key: "NEW", label: "New", status: "NEW" },
  { key: "CONTACTED", label: "Contacted", status: "CONTACTED" },
  { key: "IN_PROGRESS", label: "In Progress", status: "IN_PROGRESS" },
  { key: "CONVERTED", label: "Converted", status: "CONVERTED" },
  { key: "CLOSED", label: "Closed", status: "CLOSED" },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-black/35"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" />
    </svg>
  );
}

export default function EnquiriesTable({ initial }) {
  const { stats, version, arrivals, clearArrivals } = useEnquiryNotifications();

  const [enquiries, setEnquiries] = useState(initial.enquiries);
  const [pagination, setPagination] = useState(initial.pagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  // Two pieces of state for one box: what has been typed, and what has been
  // searched for. They differ for as long as the debounce below is waiting.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // The server already fetched exactly this query, so the first run of the
  // fetch effect would be a duplicate request for data on screen.
  const isFirstRun = useRef(true);

  // Wait for a pause in typing before asking the API. Without this, "rebrand"
  // is seven requests and the answers can arrive out of order.
  //
  // The page reset rides along in the same callback: a new search term makes
  // the current page number meaningless, since page 4 of the old results is
  // rarely page 4 of the new ones.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Same reasoning as above, for the filter rather than the search box. Both
  // the dropdown and the stat cards go through here.
  const changeStatus = (next) => {
    setStatus(next);
    setPage(1);
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);

    getEnquiries({ page, perPage: PER_PAGE, status, search })
      .then((payload) => {
        if (cancelled) return;
        setEnquiries(payload.data.enquiries);
        setPagination(payload.data.pagination);
        setError("");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Set when the filters change again before this answer arrives, so a slow
    // response for an old query cannot overwrite a newer one.
    return () => {
      cancelled = true;
    };
  }, [page, status, search, version]);

  const showNewest = () => {
    clearArrivals();
    setStatus("ALL");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const isFiltered = status !== "ALL" || search !== "";

  return (
    <div>
      {/* Stats -------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map((card) => {
          const count = card.status ? (stats?.byStatus?.[card.status] ?? 0) : (stats?.total ?? 0);
          const isActive = card.status ? status === card.status : status === "ALL";

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => changeStatus(card.status ?? "ALL")}
              aria-pressed={isActive}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                isActive
                  ? "border-navy bg-navy text-white"
                  : "border-black/10 bg-white hover:border-navy/40"
              }`}
            >
              <span
                className={`font-nav block text-[0.7rem] font-bold tracking-[0.16em] uppercase ${
                  isActive ? "text-white/70" : "text-muted"
                }`}
              >
                {card.label}
              </span>
              <span className="font-headline mt-1.5 block text-3xl leading-none tracking-tight">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* New arrivals ------------------------------------------------------- */}
      {arrivals.length > 0 ? (
        <div
          role="status"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/15 px-5 py-4"
        >
          <p className="text-sm font-semibold text-foreground">
            {arrivals.length === 1
              ? `New enquiry from ${arrivals[0].name}.`
              : `${arrivals.length} new enquiries just arrived.`}
          </p>
          <div className="flex items-center gap-4">
            {isFiltered ? (
              <button
                type="button"
                onClick={showNewest}
                className="font-nav bg-navy px-4 py-2 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
              >
                Show newest
              </button>
            ) : null}
            <button
              type="button"
              onClick={clearArrivals}
              className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {/* Controls ----------------------------------------------------------- */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="enquiry-search" className="sr-only">
            Search enquiries
          </label>
          <SearchIcon />
          <input
            id="enquiry-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, subject or message…"
            className="w-full rounded-xl border border-black/15 bg-white py-3 pr-4 pl-11 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="enquiry-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="enquiry-status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors focus:border-navy focus:outline-none sm:w-56"
          >
            <option value="ALL">All statuses</option>
            {ENQUIRY_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* Results ------------------------------------------------------------ */}
      <div
        className={`mt-6 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
        aria-busy={loading}
      >
        {enquiries.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
            <p className="font-headline text-xl tracking-tight text-navy uppercase">
              {isFiltered ? "Nothing matches" : "No enquiries yet"}
            </p>
            <p className="mt-3 text-sm text-black/55">
              {isFiltered
                ? "Try a different search term or status."
                : "New enquiries from the website will appear here the moment they arrive."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: a real table, because these rows are genuinely tabular
                and screen readers should be able to announce them that way. */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Enquiries submitted from the website, newest first
                </caption>
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    {["Name", "Email", "Subject", "Status", "Date", ""].map((heading, index) => (
                      <th
                        key={heading || index}
                        scope="col"
                        className="font-nav px-5 py-3.5 text-xs font-bold tracking-[0.14em] text-muted uppercase"
                      >
                        {heading || <span className="sr-only">Action</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      className="border-b border-black/[0.06] last:border-0 hover:bg-footer/60"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-foreground">
                        {enquiry.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-black/60">
                        <a href={`mailto:${enquiry.email}`} className="hover:text-navy hover:underline">
                          {enquiry.email}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-sm text-black/60">
                        {enquiry.subject || enquiry.service || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={enquiry.status} />
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap text-black/60">
                        <LocalTime value={enquiry.createdAt} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/enquiries/${enquiry.id}`}
                          className="font-nav border border-black/15 px-4 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
                        >
                          View
                          <span className="sr-only"> enquiry from {enquiry.name}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards. A six-column table on a phone is
                either unreadably small or a sideways scroll. */}
            <ul className="space-y-3 md:hidden">
              {enquiries.map((enquiry) => (
                <li key={enquiry.id} className="rounded-2xl border border-black/10 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold break-words text-foreground">{enquiry.name}</p>
                      <p className="mt-0.5 text-sm break-all text-black/55">{enquiry.email}</p>
                    </div>
                    <StatusBadge status={enquiry.status} />
                  </div>

                  <p className="mt-3 text-sm text-black/70">
                    {enquiry.subject || enquiry.service || "—"}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-black/50">
                      <LocalTime value={enquiry.createdAt} />
                    </span>
                    <Link
                      href={`/admin/enquiries/${enquiry.id}`}
                      className="font-nav border border-black/15 px-4 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
                    >
                      View
                      <span className="sr-only"> enquiry from {enquiry.name}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Paging ------------------------------------------------------------- */}
      {pagination.totalPages > 1 ? (
        <nav
          aria-label="Enquiry pages"
          className="mt-6 flex flex-wrap items-center justify-between gap-4"
        >
          <p className="text-sm text-black/55">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            {pagination.total === 1 ? "enquiry" : "enquiries"}
            {status !== "ALL" ? ` · ${statusLabel(status)}` : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.page <= 1 || loading}
              className="font-nav border border-black/15 px-4 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="font-nav border border-black/15 px-4 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy"
            >
              Next
            </button>
          </div>
        </nav>
      ) : (
        <p className="mt-6 text-sm text-black/55">
          {pagination.total} {pagination.total === 1 ? "enquiry" : "enquiries"}
          {status !== "ALL" ? ` · ${statusLabel(status)}` : ""}
        </p>
      )}
    </div>
  );
}
