"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CASE_STUDY_STATUSES,
  caseStudyStatusLabel,
  deleteCaseStudy,
  getCaseStudies,
  getCaseStudyStats,
  mediaUrl,
  updateCaseStudyStatus,
} from "@/lib/api";
import LocalTime from "../../_components/local-time";
import CaseStudyStatusBadge from "./case-study-status-badge";

/**
 * The case studies list: stats, search, status filter, table and paging.
 *
 * The server renders the first page and hands it over as `initial`, so there
 * is a full table in the HTML before any JavaScript runs. From then on this
 * component owns the query — a filter, a search or a page change refetches.
 *
 * Unlike enquiries, nothing arrives here on its own: a case study only changes
 * because an admin changed it. So there is no socket and no polling, just a
 * `reload` after every action that alters a row.
 */

const PER_PAGE = 20;

// `status: null` is the Total card, which clears the filter rather than
// setting one.
const STAT_CARDS = [
  { key: "total", label: "Total", status: null },
  { key: "PUBLISHED", label: "Published", status: "PUBLISHED" },
  { key: "DRAFT", label: "Drafts", status: "DRAFT" },
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

// The cover image, at the size the list shows it. A plain <img> rather than
// next/image: these are 56px thumbnails of an already-small file, and the two
// possible origins (this site's public folder, and the API's uploads folder)
// would both need configuring for the optimiser to earn its keep here.
function Thumbnail({ study }) {
  const src = mediaUrl(study.imageUrl);

  if (!src) {
    return (
      <span
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/15 bg-black/[0.02] text-[0.6rem] font-bold tracking-[0.1em] text-black/30 uppercase"
      >
        None
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      // The alt is on the record and is what the website will announce. An
      // empty one here is right anyway: the title sits next to it and the
      // thumbnail adds nothing a screen reader needs twice.
      alt=""
      className="h-14 w-14 shrink-0 rounded-lg border border-black/10 object-cover"
    />
  );
}

export default function CaseStudiesTable({ initial, initialStats }) {
  const router = useRouter();

  const [studies, setStudies] = useState(initial.caseStudies);
  const [pagination, setPagination] = useState(initial.pagination);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  // Two pieces of state for one box: what has been typed, and what has been
  // searched for. They differ for as long as the debounce below is waiting.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Bumped after a publish, unpublish or delete, which re-runs the fetch
  // effect below rather than trying to patch the row in place.
  const [version, setVersion] = useState(0);

  // Which row is mid-request, so only that row's buttons go quiet.
  const [busyId, setBusyId] = useState(null);
  // Deleting is not undoable, so the row asks first, in place.
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // The server already fetched exactly this query, so the first run of the
  // fetch effect would be a duplicate request for data on screen.
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

    // The counts move whenever a study is published or deleted, so they are
    // refetched with the list rather than left to go stale.
    Promise.all([
      getCaseStudies({ page, perPage: PER_PAGE, status, search }),
      getCaseStudyStats(),
    ])
      .then(([list, counts]) => {
        if (cancelled) return;
        setStudies(list.data.caseStudies);
        setPagination(list.data.pagination);
        setStats(counts.data);
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

  const reload = () => setVersion((current) => current + 1);

  const togglePublished = async (study) => {
    const next = study.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    setBusyId(study.id);
    setError("");

    try {
      await updateCaseStudyStatus(study.id, next);
      reload();
      // The public /case-studies page is server-rendered from this same data,
      // so its cached render has to go too.
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (study) => {
    setBusyId(study.id);
    setError("");

    try {
      await deleteCaseStudy(study.id);
      setConfirmingDelete(null);

      // Deleting the last row on a page leaves it empty, so step back one.
      if (studies.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        reload();
      }

      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setConfirmingDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  const isFiltered = status !== "ALL" || search !== "";

  return (
    <div>
      {/* Stats -------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-3">
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

      {/* Controls ----------------------------------------------------------- */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="case-study-search" className="sr-only">
            Search case studies
          </label>
          <SearchIcon />
          <input
            id="case-study-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title, client, service or summary…"
            className="w-full rounded-xl border border-black/15 bg-white py-3 pr-4 pl-11 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="case-study-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="case-study-status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors focus:border-navy focus:outline-none sm:w-56"
          >
            <option value="ALL">All statuses</option>
            {CASE_STUDY_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {/* Results ------------------------------------------------------------ */}
      <div
        className={`mt-6 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
        aria-busy={loading}
      >
        {studies.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
            <p className="font-headline text-xl tracking-tight text-navy uppercase">
              {isFiltered ? "Nothing matches" : "No case studies yet"}
            </p>
            <p className="mt-3 text-sm text-black/55">
              {isFiltered
                ? "Try a different search term or status."
                : "Add your first one and it will appear on the website as soon as you publish it."}
            </p>
            {isFiltered ? null : (
              <Link
                href="/admin/case-studies/new"
                className="font-nav mt-6 inline-block bg-navy px-6 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
              >
                New case study
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: a real table, because these rows are genuinely tabular
                and screen readers should be able to announce them that way. */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Case studies, in the order they appear on the website
                </caption>
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    {["Order", "Case study", "Client", "Status", "Updated", ""].map(
                      (heading, index) => (
                        <th
                          key={heading || index}
                          scope="col"
                          className="font-nav px-5 py-3.5 text-xs font-bold tracking-[0.14em] text-muted uppercase"
                        >
                          {heading || <span className="sr-only">Actions</span>}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {studies.map((study) => (
                    <tr
                      key={study.id}
                      className="border-b border-black/[0.06] last:border-0 align-middle hover:bg-footer/60"
                    >
                      <td className="px-5 py-4 text-sm tabular-nums text-black/45">
                        {study.sortOrder}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Thumbnail study={study} />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{study.title}</p>
                            <p className="mt-0.5 line-clamp-1 max-w-[38ch] text-sm text-black/50">
                              {study.summary}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-black/60">{study.client || "—"}</td>
                      <td className="px-5 py-4">
                        <CaseStudyStatusBadge status={study.status} />
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap text-black/60">
                        <LocalTime value={study.updatedAt} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <RowActions
                            study={study}
                            busy={busyId === study.id}
                            confirming={confirmingDelete === study.id}
                            onToggle={() => togglePublished(study)}
                            onAskDelete={() => setConfirmingDelete(study.id)}
                            onCancelDelete={() => setConfirmingDelete(null)}
                            onDelete={() => handleDelete(study)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards. A six-column table on a phone is
                either unreadably small or a sideways scroll. */}
            <ul className="space-y-3 md:hidden">
              {studies.map((study) => (
                <li key={study.id} className="rounded-2xl border border-black/10 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <Thumbnail study={study} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold break-words text-foreground">{study.title}</p>
                      <p className="mt-0.5 text-sm text-black/50">{study.client || "—"}</p>
                    </div>
                    <CaseStudyStatusBadge status={study.status} />
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-black/70">{study.summary}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-black/50">
                      Order {study.sortOrder} · <LocalTime value={study.updatedAt} />
                    </span>
                    <div className="flex items-center gap-2">
                      <RowActions
                        study={study}
                        busy={busyId === study.id}
                        confirming={confirmingDelete === study.id}
                        onToggle={() => togglePublished(study)}
                        onAskDelete={() => setConfirmingDelete(study.id)}
                        onCancelDelete={() => setConfirmingDelete(null)}
                        onDelete={() => handleDelete(study)}
                      />
                    </div>
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
          aria-label="Case study pages"
          className="mt-6 flex flex-wrap items-center justify-between gap-4"
        >
          <p className="text-sm text-black/55">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            {pagination.total === 1 ? "case study" : "case studies"}
            {status !== "ALL" ? ` · ${caseStudyStatusLabel(status)}` : ""}
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
          {pagination.total} {pagination.total === 1 ? "case study" : "case studies"}
          {status !== "ALL" ? ` · ${caseStudyStatusLabel(status)}` : ""}
        </p>
      )}
    </div>
  );
}

/**
 * Edit, publish/unpublish and delete for one row.
 *
 * The delete confirmation replaces the buttons in place rather than opening a
 * window.confirm(), which is unstyled, easy to dismiss by reflex, and blocks
 * the whole page. Same reasoning as the enquiry detail page.
 */
function RowActions({
  study,
  busy,
  confirming,
  onToggle,
  onAskDelete,
  onCancelDelete,
  onDelete,
}) {
  if (confirming) {
    return (
      <>
        <span className="text-sm font-semibold text-foreground">Delete?</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="font-nav bg-red-600 px-3 py-2 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Yes"}
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

  const isPublished = study.status === "PUBLISHED";

  return (
    <>
      <Link
        href={`/admin/case-studies/${study.id}`}
        className="font-nav border border-black/15 px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
      >
        Edit
        <span className="sr-only"> {study.title}</span>
      </Link>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className={`font-nav px-3.5 py-2 text-xs font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50 ${
          isPublished
            ? "border border-black/15 text-navy hover:bg-navy hover:text-white"
            : "bg-navy text-white hover:bg-navy/90"
        }`}
      >
        {busy ? "…" : isPublished ? "Unpublish" : "Publish"}
        <span className="sr-only"> {study.title}</span>
      </button>

      <button
        type="button"
        onClick={onAskDelete}
        disabled={busy}
        className="font-nav px-2 py-2 text-xs font-bold tracking-[0.08em] text-red-600 uppercase transition-colors hover:underline disabled:opacity-50"
      >
        Delete
        <span className="sr-only"> {study.title}</span>
      </button>
    </>
  );
}
