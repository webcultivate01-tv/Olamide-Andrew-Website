"use client";

import { useEffect, useRef, useState } from "react";
import { deleteSubscriber, exportSubscribers, getSubscribers } from "@/lib/api";
import LocalTime from "../../_components/local-time";

/**
 * The subscribers list: search, table and paging, plus a delete on each row.
 *
 * The server renders the first page and hands it over as `initial`, so there
 * is a full table in the HTML before any JavaScript runs. From then on this
 * component owns the query, the same way the enquiries and case studies
 * tables do.
 */

const PER_PAGE = 20;

// The last 12 calendar months, newest first, as "2026-03" values with a
// human label - the filter and the export both send the value straight to
// the API.
function monthOptions() {
  const now = new Date();
  const options = [];

  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }) });
  }

  return options;
}

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

export default function SubscribersTable({ initial }) {
  const [subscribers, setSubscribers] = useState(initial.subscribers);
  const [pagination, setPagination] = useState(initial.pagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");

  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const isFirstRun = useRef(true);

  // Wait for a pause in typing before asking the API. The page reset rides
  // along: page 4 of the old results is rarely page 4 of the new ones.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);

    getSubscribers({ page, perPage: PER_PAGE, search, month })
      .then((payload) => {
        if (cancelled) return;
        setSubscribers(payload.data.subscribers);
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

    return () => {
      cancelled = true;
    };
  }, [page, search, month, version]);

  const reload = () => setVersion((current) => current + 1);

  const handleMonthChange = (value) => {
    setMonth(value);
    setPage(1);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");

    try {
      const blob = await exportSubscribers({ search, month });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (subscriber) => {
    setBusyId(subscriber.id);
    setError("");

    try {
      await deleteSubscriber(subscriber.id);
      setConfirmingDelete(null);

      // Deleting the last row on a page leaves it empty, so step back one.
      if (subscribers.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        reload();
      }
    } catch (requestError) {
      setError(requestError.message);
      setConfirmingDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  const isFiltered = search !== "" || month !== "";

  return (
    <div>
      {/* Stats ---------------------------------------------------------------- */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 sm:w-64">
        <span className="font-nav block text-[0.7rem] font-bold tracking-[0.16em] text-muted uppercase">
          Total subscribers
        </span>
        <span className="font-headline mt-1.5 block text-3xl leading-none tracking-tight">
          {pagination.total}
        </span>
      </div>

      {/* Controls ------------------------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="subscriber-search" className="sr-only">
            Search subscribers
          </label>
          <SearchIcon />
          <input
            id="subscriber-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by email…"
            className="w-full rounded-xl border border-black/15 bg-white py-3 pr-4 pl-11 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none sm:max-w-md"
          />
        </div>

        <div>
          <label htmlFor="subscriber-month" className="sr-only">
            Filter by month
          </label>
          <select
            id="subscriber-month"
            value={month}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="font-nav rounded-xl border border-black/15 bg-white py-3 pr-9 pl-4 text-sm font-semibold text-foreground transition-colors focus:border-navy focus:outline-none"
          >
            <option value="">All months</option>
            {monthOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || pagination.total === 0}
          className="font-nav ml-auto border border-black/15 px-4 py-3 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy"
        >
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {/* Results --------------------------------------------------------------- */}
      <div
        className={`mt-6 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
        aria-busy={loading}
      >
        {subscribers.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
            <p className="font-headline text-xl tracking-tight text-navy uppercase">
              {isFiltered ? "Nothing matches" : "No subscribers yet"}
            </p>
            <p className="mt-3 text-sm text-black/55">
              {isFiltered
                ? "Try a different search term or month."
                : "Email addresses collected from the blog page's newsletter form will appear here."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: a real table. */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Newsletter subscribers, newest first</caption>
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    {["Email", "Subscribed", ""].map((heading, index) => (
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
                  {subscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="border-b border-black/[0.06] last:border-0 hover:bg-footer/60"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-foreground">
                        <a
                          href={`mailto:${subscriber.email}`}
                          className="hover:text-navy hover:underline"
                        >
                          {subscriber.email}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap text-black/60">
                        <LocalTime value={subscriber.createdAt} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <RowActions
                            subscriber={subscriber}
                            busy={busyId === subscriber.id}
                            confirming={confirmingDelete === subscriber.id}
                            onAskDelete={() => setConfirmingDelete(subscriber.id)}
                            onCancelDelete={() => setConfirmingDelete(null)}
                            onDelete={() => handleDelete(subscriber)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards. */}
            <ul className="space-y-3 md:hidden">
              {subscribers.map((subscriber) => (
                <li key={subscriber.id} className="rounded-2xl border border-black/10 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold text-foreground">
                      {subscriber.email}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-black/50">
                      <LocalTime value={subscriber.createdAt} />
                    </span>
                    <div className="flex items-center gap-2">
                      <RowActions
                        subscriber={subscriber}
                        busy={busyId === subscriber.id}
                        confirming={confirmingDelete === subscriber.id}
                        onAskDelete={() => setConfirmingDelete(subscriber.id)}
                        onCancelDelete={() => setConfirmingDelete(null)}
                        onDelete={() => handleDelete(subscriber)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Paging --------------------------------------------------------------- */}
      {pagination.totalPages > 1 ? (
        <nav
          aria-label="Subscriber pages"
          className="mt-6 flex flex-wrap items-center justify-between gap-4"
        >
          <p className="text-sm text-black/55">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            {pagination.total === 1 ? "subscriber" : "subscribers"}
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
          {pagination.total} {pagination.total === 1 ? "subscriber" : "subscribers"}
        </p>
      )}
    </div>
  );
}

/**
 * Delete for one row. The confirmation replaces the button in place rather
 * than opening a window.confirm(), same as the case studies and categories
 * lists.
 */
function RowActions({ subscriber, busy, confirming, onAskDelete, onCancelDelete, onDelete }) {
  if (confirming) {
    return (
      <>
        <span className="text-sm font-semibold text-foreground">Remove?</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="font-nav bg-red-600 px-3 py-2 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Removing…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          disabled={busy}
          className="font-nav border border-black/15 px-3 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
        >
          No
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onAskDelete}
      disabled={busy}
      className="font-nav px-2 py-2 text-xs font-bold tracking-[0.08em] text-red-600 uppercase transition-colors hover:underline disabled:opacity-50"
    >
      Remove
      <span className="sr-only"> {subscriber.email}</span>
    </button>
  );
}
