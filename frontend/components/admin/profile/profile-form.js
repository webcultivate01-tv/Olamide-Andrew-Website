"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mediaUrl, updateProfile, uploadAvatar } from "@/lib/api";
import { adminAvatar, adminInitials } from "@/lib/admin-config";

/**
 * Lets the signed-in admin change their own name, email and photo.
 *
 * There is only ever one admin account, so this is the whole account
 * settings surface - nothing here touches role or status. Password is
 * deliberately left out: it has its own "Change password" popup on the
 * profile page instead.
 */

const inputClass =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40";

function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-sm text-black/45">{hint}</p>
      ) : null}
    </div>
  );
}

export default function ProfileForm({ admin }) {
  const router = useRouter();

  const [values, setValues] = useState({
    name: admin.name || "",
    email: admin.email || "",
    avatarUrl: admin.avatarUrl || "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const setField = (name) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  // Uploaded the moment it is chosen, so the preview shows the real photo
  // rather than a local blob that might never reach the server.
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const payload = await uploadAvatar(file);
      setValues((current) => ({ ...current, avatarUrl: payload.data.avatarUrl }));
      setMessage("Photo uploaded. It is saved when you press save.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setValues((current) => ({ ...current, avatarUrl: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setErrors({});
    setMessage("");

    try {
      await updateProfile({
        name: values.name,
        email: values.email,
        avatarUrl: values.avatarUrl || null,
      });

      // The header, sidebar and the profile page are all rendered from the
      // session fetched on the server, so they only pick up the change once
      // it is refetched there.
      router.refresh();
      router.push("/admin/profile");
      // Deliberately left saving: the redirect is in flight, and re-enabling
      // the button first invites a second submit.
      return;
    } catch (requestError) {
      setError(requestError.message);
      setErrors(requestError.errors || {});
    }

    setSaving(false);
  };

  const busy = saving || uploading;
  const previewAdmin = { ...admin, name: values.name, avatarUrl: values.avatarUrl };
  const previewSrc = mediaUrl(adminAvatar(previewAdmin));

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="Profile photo preview"
              className="h-28 w-28 rounded-full border border-black/10 object-cover"
            />
          ) : (
            <span className="font-nav flex h-28 w-28 items-center justify-center rounded-full border border-black/10 bg-footer text-lg font-bold tracking-[0.06em] text-navy uppercase">
              {adminInitials(previewAdmin)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <label htmlFor="avatar" className="block text-sm font-semibold text-foreground">
            Profile photo
          </label>
          <input
            id="avatar"
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFile}
            disabled={busy}
            className="font-nav block w-full text-sm text-black/60 file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2.5 file:text-xs file:font-bold file:tracking-[0.08em] file:text-white file:uppercase hover:file:bg-navy/90 disabled:opacity-50"
          />
          {uploading ? (
            <p role="status" className="text-sm text-black/55">
              Uploading…
            </p>
          ) : null}
          {values.avatarUrl ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={busy}
              className="text-sm font-semibold text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={setField("name")}
            disabled={busy}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="Your name"
            className={inputClass}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={setField("email")}
            disabled={busy}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>
      </div>

      {message ? (
        <p
          role="status"
          className="mt-5 rounded-xl border border-green-600/25 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="font-nav bg-navy px-6 py-3 text-sm font-bold tracking-[0.04em] text-white uppercase transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        <Link
          href="/admin/profile"
          className="font-nav border border-black/15 px-5 py-3 text-sm font-bold tracking-[0.04em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
