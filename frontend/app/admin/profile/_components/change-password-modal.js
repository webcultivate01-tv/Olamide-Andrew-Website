"use client";

import { useEffect, useState } from "react";
import { changePassword, ApiError } from "@/lib/api";
import FormField from "../../_components/form-field";
import FormAlert from "../../_components/form-alert";
import SubmitButton from "../../_components/submit-button";

const emptyForm = { newPassword: "", confirmPassword: "" };

/**
 * The "Change password" button on the profile page, and the popup it opens.
 *
 * Unlike the forgot-password flow this needs no OTP - the admin is already
 * signed in, which is proof enough of who they are.
 */
export default function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setMessage("");
    setDone(false);
    setLoading(false);
  };

  const close = () => {
    if (loading) return;
    setOpen(false);
    reset();
  };

  // Escape closes the popup, same as clicking the backdrop.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading]);

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setLoading(true);

    try {
      await changePassword(form);
      setDone(true);
    } catch (error) {
      setMessage(error.message);
      if (error instanceof ApiError && error.errors) {
        setFieldErrors(error.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-nav inline-block shrink-0 border border-black/15 px-5 py-2.5 text-sm font-bold tracking-[0.02em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
      >
        Change password
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl md:p-8"
          >
            {done ? (
              <>
                <h2 id="change-password-title" className="font-headline text-xl tracking-tight text-navy uppercase">
                  Password updated
                </h2>
                <FormAlert type="success" message="Your password has been changed." />
                <button
                  type="button"
                  onClick={close}
                  className="font-nav mt-2 w-full bg-navy px-6 py-3 text-sm font-bold tracking-[0.04em] text-white uppercase transition-colors hover:bg-navy/90"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 id="change-password-title" className="font-headline text-xl tracking-tight text-navy uppercase">
                  Change password
                </h2>
                <p className="mt-1 text-sm text-black/60">
                  Enter a new password for your account.
                </p>

                <FormAlert message={message} />

                <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
                  <FormField
                    id="modal-new-password"
                    name="newPassword"
                    type="password"
                    label="New password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                    value={form.newPassword}
                    onChange={updateField("newPassword")}
                    disabled={loading}
                    error={fieldErrors.newPassword}
                    hint="At least 8 characters, with an uppercase letter, a number and a symbol."
                  />

                  <FormField
                    id="modal-confirm-password"
                    name="confirmPassword"
                    type="password"
                    label="Confirm new password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={updateField("confirmPassword")}
                    disabled={loading}
                    error={fieldErrors.confirmPassword}
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <SubmitButton loading={loading} loadingLabel="Setting…">
                      Set password
                    </SubmitButton>
                    <button
                      type="button"
                      onClick={close}
                      disabled={loading}
                      className="font-nav shrink-0 border border-black/15 px-5 py-4 text-sm font-bold tracking-[0.02em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
