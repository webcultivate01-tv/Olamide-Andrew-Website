"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ENQUIRY_STATUSES, deleteEnquiry, updateEnquiryStatus } from "@/lib/api";
import { useEnquiryNotifications } from "../../_components/enquiry-notifications";
import StatusBadge from "./status-badge";

/**
 * The two things an admin can do to an enquiry: move it along the pipeline,
 * or delete it.
 *
 * The status shown is whatever the API last confirmed, never what was clicked.
 * Guessing optimistically would be a small lie in the one place the panel is
 * supposed to be authoritative — this is the record of who has been contacted.
 */
export default function EnquiryActions({ enquiry }) {
  const router = useRouter();
  const { refresh } = useEnquiryNotifications();

  const [status, setStatus] = useState(enquiry.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Deleting is not undoable, so it takes two deliberate clicks. A second
  // button that appears in place is used rather than window.confirm(), which
  // is unstyled, easy to dismiss by reflex, and blocks the whole page.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (event) => {
    const next = event.target.value;
    if (next === status) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = await updateEnquiryStatus(enquiry.id, next);
      setStatus(payload.data.enquiry.status);
      setMessage(`Status updated to ${payload.data.enquiry.status.replace("_", " ").toLowerCase()}.`);

      // The unread count is the number of enquiries still at NEW, so moving
      // this one off NEW changes the badge in the header.
      refresh();
      // And re-render the server component, so going back to the list does not
      // show the status this enquiry had a moment ago.
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      await deleteEnquiry(enquiry.id);
      refresh();
      router.replace("/admin/enquiries");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
      <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Manage</h2>

      <div className="mt-5 flex items-center gap-3">
        <span className="font-nav text-xs font-bold tracking-[0.18em] text-muted uppercase">
          Current
        </span>
        <StatusBadge status={status} />
      </div>

      <div className="mt-5">
        <label htmlFor="enquiry-status" className="block text-sm font-semibold text-foreground">
          Change status
        </label>
        <select
          id="enquiry-status"
          value={status}
          onChange={handleStatusChange}
          disabled={saving || deleting}
          className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors focus:border-navy focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40"
        >
          {ENQUIRY_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-black/45">
          An enquiry counts as unread on the notification bell until it moves
          off <strong className="font-semibold">New</strong>.
        </p>
      </div>

      {message ? (
        <p role="status" className="mt-4 rounded-xl border border-green-600/25 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-7 border-t border-black/10 pt-6">
        {confirmingDelete ? (
          <div>
            <p className="text-sm font-semibold text-foreground">
              Delete this enquiry permanently?
            </p>
            <p className="mt-1 text-sm text-black/55">
              The message from {enquiry.name} cannot be recovered afterwards.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="font-nav bg-red-600 px-5 py-2.5 text-sm font-bold tracking-[0.04em] text-white uppercase transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="font-nav border border-black/15 px-5 py-2.5 text-sm font-bold tracking-[0.04em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={saving}
            className="text-sm font-semibold text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Delete this enquiry
          </button>
        )}
      </div>
    </div>
  );
}
