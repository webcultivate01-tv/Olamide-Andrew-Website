"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CASE_STUDY_STATUSES,
  createCaseStudy,
  deleteCaseStudy,
  mediaUrl,
  updateCaseStudy,
  uploadCaseStudyImage,
} from "@/lib/api";

/**
 * One form for both adding and editing a case study.
 *
 * `study` is null when adding. Everything else about the two is the same — the
 * same fields, the same rules, the same image handling — so they are one
 * component rather than two that would have to be kept in step.
 *
 * Field-level errors come back from the API in `error.errors`, keyed by field
 * name, and are shown under the input they belong to. The browser's own
 * `required` is deliberately not used: the backend is the authority on what is
 * valid, and letting it answer means there is only one set of rules.
 */

const EMPTY = {
  title: "",
  slug: "",
  client: "",
  service: "",
  summary: "",
  imageUrl: "",
  imageAlt: "",
  status: "DRAFT",
  sortOrder: "",
};

// The API stores null for an empty optional field; a text input needs "".
const toFormValues = (study) =>
  study
    ? {
        title: study.title ?? "",
        slug: study.slug ?? "",
        client: study.client ?? "",
        service: study.service ?? "",
        summary: study.summary ?? "",
        imageUrl: study.imageUrl ?? "",
        imageAlt: study.imageAlt ?? "",
        status: study.status ?? "DRAFT",
        sortOrder: study.sortOrder ?? "",
      }
    : EMPTY;

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

const inputClass =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40";

export default function CaseStudyForm({ study = null }) {
  const router = useRouter();
  const isEdit = Boolean(study);

  const [values, setValues] = useState(() => toFormValues(study));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setField = (name) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Clear the message for this field as soon as it is edited — leaving it
    // under a box the admin has already fixed just reads as broken.
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  // The file is uploaded the moment it is chosen, and what comes back is a
  // path stored in the form like any other value. Waiting for submit would
  // mean the preview showed a local blob that might never reach the server.
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setErrors((current) => ({ ...current, imageUrl: undefined }));

    try {
      const payload = await uploadCaseStudyImage(file);
      setValues((current) => ({ ...current, imageUrl: payload.data.imageUrl }));
      setMessage("Image uploaded. It is saved with the case study when you press save.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
      // Cleared so choosing the same file again still fires a change event.
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setErrors({});
    setMessage("");

    // Optional fields go up as null rather than "", which is how the API is
    // told to clear one. sortOrder left blank means "decide for me" on a new
    // study, so it is left out of the request entirely.
    const body = {
      title: values.title,
      slug: values.slug || null,
      client: values.client || null,
      service: values.service || null,
      summary: values.summary,
      imageUrl: values.imageUrl || null,
      imageAlt: values.imageAlt || null,
      status: values.status,
    };

    if (values.sortOrder !== "") {
      body.sortOrder = Number(values.sortOrder);
    }

    try {
      if (isEdit) {
        const payload = await updateCaseStudy(study.id, body);
        setValues(toFormValues(payload.data.caseStudy));
        setMessage(payload.message);
        // The public page is server-rendered from this data, and so is the
        // list behind this form.
        router.refresh();
      } else {
        const payload = await createCaseStudy(body);
        router.replace(`/admin/case-studies/${payload.data.caseStudy.id}`);
        router.refresh();
        // Deliberately left saving: the redirect is in flight, and re-enabling
        // the button first invites a second submit that would create a
        // duplicate.
        return;
      }
    } catch (requestError) {
      setError(requestError.message);
      setErrors(requestError.errors || {});
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      await deleteCaseStudy(study.id);
      router.replace("/admin/case-studies");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const busy = saving || uploading || deleting;
  const previewSrc = mediaUrl(values.imageUrl);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      {/* Content ------------------------------------------------------------ */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Content</h2>
          <p className="mt-2 text-sm text-black/50">
            The title and summary are what the website shows under each image.
          </p>

          <div className="mt-6 space-y-5">
            <Field label="Title" htmlFor="title" error={errors.title}>
              <input
                id="title"
                type="text"
                value={values.title}
                onChange={setField("title")}
                disabled={busy}
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={errors.title ? "title-error" : undefined}
                placeholder="Skyline Finance"
                className={inputClass}
              />
            </Field>

            <Field
              label="Summary"
              htmlFor="summary"
              error={errors.summary}
              hint="A sentence or two — this is the paragraph under the title on the grid."
            >
              <textarea
                id="summary"
                rows={4}
                value={values.summary}
                onChange={setField("summary")}
                disabled={busy}
                aria-invalid={errors.summary ? true : undefined}
                aria-describedby={errors.summary ? "summary-error" : undefined}
                placeholder="Launch campaign for a fintech platform making investing accessible to everyone."
                className={`${inputClass} resize-y`}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Client" htmlFor="client" error={errors.client}>
                <input
                  id="client"
                  type="text"
                  value={values.client}
                  onChange={setField("client")}
                  disabled={busy}
                  placeholder="Skyline Finance"
                  className={inputClass}
                />
              </Field>

              <Field label="Service" htmlFor="service" error={errors.service}>
                <input
                  id="service"
                  type="text"
                  value={values.service}
                  onChange={setField("service")}
                  disabled={busy}
                  placeholder="Brand identity"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Image ------------------------------------------------------------ */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Cover image</h2>
          <p className="mt-2 text-sm text-black/50">
            JPEG, PNG, WebP or AVIF, up to 4 MB. The grid crops to a square-ish
            21:20, so a centred subject survives best.
          </p>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={values.imageAlt || "Selected cover image"}
                  className="h-40 w-40 rounded-xl border border-black/10 object-cover"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-black/20 bg-black/[0.02] text-center text-xs text-black/35">
                  No image yet
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-5">
              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-semibold text-foreground"
                >
                  Upload an image
                </label>
                <input
                  id="image"
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFile}
                  disabled={busy}
                  className="font-nav mt-2 block w-full text-sm text-black/60 file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2.5 file:text-xs file:font-bold file:tracking-[0.08em] file:text-white file:uppercase hover:file:bg-navy/90 disabled:opacity-50"
                />
                {uploading ? (
                  <p role="status" className="mt-2 text-sm text-black/55">
                    Uploading…
                  </p>
                ) : null}
              </div>

              <Field
                label="Image path"
                htmlFor="imageUrl"
                error={errors.imageUrl}
                hint="Filled in by the upload. It can also be typed, for a file already in the website's public folder."
              >
                <input
                  id="imageUrl"
                  type="text"
                  value={values.imageUrl}
                  onChange={setField("imageUrl")}
                  disabled={busy}
                  aria-invalid={errors.imageUrl ? true : undefined}
                  aria-describedby={errors.imageUrl ? "imageUrl-error" : undefined}
                  placeholder="/case-studies/skyline.png"
                  className={`${inputClass} font-mono text-sm`}
                />
              </Field>

              <Field
                label="Image description"
                htmlFor="imageAlt"
                error={errors.imageAlt}
                hint="Read aloud in place of the image. Describe what is in it, not that it is a photo."
              >
                <input
                  id="imageAlt"
                  type="text"
                  value={values.imageAlt}
                  onChange={setField("imageAlt")}
                  disabled={busy}
                  placeholder="Skyline Finance campaign wrapped around a corner billboard"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Publishing --------------------------------------------------------- */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Publishing</h2>

          <div className="mt-6 space-y-5">
            <Field
              label="Status"
              htmlFor="status"
              error={errors.status}
              hint="Only published case studies appear on the website."
            >
              <select
                id="status"
                value={values.status}
                onChange={setField("status")}
                disabled={busy}
                className={inputClass}
              >
                {CASE_STUDY_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Display order"
              htmlFor="sortOrder"
              error={errors.sortOrder}
              hint={
                isEdit
                  ? "Lowest number first on the website."
                  : "Leave blank to add it to the end of the list."
              }
            >
              <input
                id="sortOrder"
                type="number"
                min="0"
                max="9999"
                value={values.sortOrder}
                onChange={setField("sortOrder")}
                disabled={busy}
                aria-invalid={errors.sortOrder ? true : undefined}
                aria-describedby={errors.sortOrder ? "sortOrder-error" : undefined}
                placeholder="0"
                className={inputClass}
              />
            </Field>

            <Field
              label="Address (slug)"
              htmlFor="slug"
              error={errors.slug}
              hint={
                isEdit
                  ? "Changing this changes the case study's address. A published study keeps its slug when the title changes."
                  : "Leave blank and it is made from the title."
              }
            >
              <input
                id="slug"
                type="text"
                value={values.slug}
                onChange={setField("slug")}
                disabled={busy}
                aria-invalid={errors.slug ? true : undefined}
                aria-describedby={errors.slug ? "slug-error" : undefined}
                placeholder="skyline-finance"
                className={`${inputClass} font-mono text-sm`}
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
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create case study"}
            </button>

            <Link
              href="/admin/case-studies"
              className="font-nav border border-black/15 px-5 py-3 text-sm font-bold tracking-[0.04em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </div>

        {isEdit ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
            {confirmingDelete ? (
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Delete this case study permanently?
                </p>
                <p className="mt-1 text-sm text-black/55">
                  {study.title} and its uploaded image cannot be recovered afterwards.
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
                disabled={busy}
                className="text-sm font-semibold text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
              >
                Delete this case study
              </button>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
