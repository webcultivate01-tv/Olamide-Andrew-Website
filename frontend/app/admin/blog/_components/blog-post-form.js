"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  POST_STATUSES,
  createPost,
  deletePost,
  mediaUrl,
  updatePost,
  uploadPostImage,
} from "@/lib/api";

/**
 * One form for both writing and editing a post.
 *
 * `post` is null when writing a new one. Everything else about the two is the
 * same — the same fields, the same rules, the same image handling — so they
 * are one component rather than two that would have to be kept in step.
 *
 * Field-level errors come back from the API in `error.errors`, keyed by field
 * name, and are shown under the input they belong to. The browser's own
 * `required` is deliberately not used: the backend is the authority on what is
 * valid, and letting it answer means there is only one set of rules.
 */

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "",
  coverImageUrl: "",
  coverImageAlt: "",
  status: "DRAFT",
};

// The API stores null for an empty optional field; a text input needs "".
// `tags` is kept out of this object because it is a list, not a text value —
// it has its own state below.
const toFormValues = (post) =>
  post
    ? {
        title: post.title ?? "",
        slug: post.slug ?? "",
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        author: post.author ?? "",
        coverImageUrl: post.coverImageUrl ?? "",
        coverImageAlt: post.coverImageAlt ?? "",
        status: post.status ?? "DRAFT",
      }
    : EMPTY;

// The same arithmetic the API does on save, so the figure under the editor
// matches the one that ends up stored. It is only an estimate either way.
const WORDS_PER_MINUTE = 200;

const readingStats = (content) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) };
};

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

/**
 * The tag editor: existing tags as removable chips, plus a box to add one.
 *
 * Enter and comma both commit, because both are what people reflexively press
 * in a field like this. Enter is intercepted rather than left alone for a
 * second reason: inside a form, a bare Enter in a text input submits the whole
 * thing, and typing a tag should never save the post.
 */
function TagEditor({ tags, onChange, disabled, error }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;

    // The API slugifies and de-duplicates anyway; doing it here too means the
    // chip that appears is the tag that gets stored, rather than something
    // that changes shape on save.
    const slug = tag
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (slug && !tags.includes(slug)) {
      onChange([...tags, slug]);
    }
    setDraft("");
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
      return;
    }

    // Backspace on an empty box removes the last chip — the usual behaviour
    // for this control, and quicker than reaching for its × .
    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <label htmlFor="tag-input" className="block text-sm font-semibold text-foreground">
        Tags
      </label>

      {tags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.03] py-1 pr-1 pl-3 text-sm text-black/70"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((other) => other !== tag))}
                disabled={disabled}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove tag {tag}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id="tag-input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        // Committed on blur too, so a tag typed and then clicked away from is
        // not silently thrown away when the post saves.
        onBlur={() => add(draft)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "tag-input-error" : undefined}
        placeholder="branding, process…"
        className={inputClass}
      />

      {error ? (
        <p id="tag-input-error" role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-sm text-black/45">
          Press Enter or comma after each one. Up to 8.
        </p>
      )}
    </div>
  );
}

export default function BlogPostForm({ post = null }) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [values, setValues] = useState(() => toFormValues(post));
  const [tags, setTags] = useState(() => post?.tags ?? []);
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
    setErrors((current) => ({ ...current, coverImageUrl: undefined }));

    try {
      const payload = await uploadPostImage(file);
      setValues((current) => ({ ...current, coverImageUrl: payload.data.imageUrl }));
      setMessage("Image uploaded. It is saved with the post when you press save.");
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
    // told to clear one. Tags go as an array; the API joins them for storage.
    const body = {
      title: values.title,
      slug: values.slug || null,
      excerpt: values.excerpt,
      content: values.content,
      author: values.author || null,
      tags,
      coverImageUrl: values.coverImageUrl || null,
      coverImageAlt: values.coverImageAlt || null,
      status: values.status,
    };

    try {
      if (isEdit) {
        const payload = await updatePost(post.id, body);
        setValues(toFormValues(payload.data.post));
        setTags(payload.data.post.tags);
        setMessage(payload.message);
        // The public blog is server-rendered from this data, and so is the
        // list behind this form.
        router.refresh();
      } else {
        const payload = await createPost(body);
        router.replace(`/admin/blog/${payload.data.post.id}`);
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
      await deletePost(post.id);
      router.replace("/admin/blog");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const busy = saving || uploading || deleting;
  const previewSrc = mediaUrl(values.coverImageUrl);
  const { words, minutes } = readingStats(values.content);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start"
    >
      {/* Content ------------------------------------------------------------ */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Content</h2>
          <p className="mt-2 text-sm text-black/50">
            The title and excerpt are what the blog index shows on each card.
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
                placeholder="Why most rebrands fail"
                className={inputClass}
              />
            </Field>

            <Field
              label="Excerpt"
              htmlFor="excerpt"
              error={errors.excerpt}
              hint="A sentence or two — this is the paragraph under the title on the index, and what search engines quote."
            >
              <textarea
                id="excerpt"
                rows={3}
                value={values.excerpt}
                onChange={setField("excerpt")}
                disabled={busy}
                aria-invalid={errors.excerpt ? true : undefined}
                aria-describedby={errors.excerpt ? "excerpt-error" : undefined}
                placeholder="A new logo is not a strategy. Here is what actually moves a brand."
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field
              label="Post"
              htmlFor="content"
              error={errors.content}
              hint="Markdown: ## for a heading, ** ** for bold, - for a list."
            >
              <textarea
                id="content"
                rows={20}
                value={values.content}
                onChange={setField("content")}
                disabled={busy}
                aria-invalid={errors.content ? true : undefined}
                aria-describedby={errors.content ? "content-error" : undefined}
                placeholder={"## The short version\n\nStart with the promise, not the logo."}
                className={`${inputClass} resize-y font-mono text-sm leading-relaxed`}
              />
            </Field>

            {/* Not a form field — a live count of what is in the box above,
                using the same arithmetic the API will use on save. An empty
                editor shows the count alone: the API floors the stored figure
                at one minute, but announcing a one-minute read for a post with
                nothing in it would just look broken. */}
            <p className="text-sm text-black/45">
              {words} {words === 1 ? "word" : "words"}
              {words > 0 ? ` · about ${minutes} min read` : ""}
            </p>
          </div>
        </div>

        {/* Cover image ------------------------------------------------------ */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">
            Cover image
          </h2>
          <p className="mt-2 text-sm text-black/50">
            JPEG, PNG, WebP or AVIF, up to 4 MB. It sits at the top of the post
            and on the index card, so a wide, uncluttered image works best.
          </p>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={values.coverImageAlt || "Selected cover image"}
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
                <label htmlFor="image" className="block text-sm font-semibold text-foreground">
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
                htmlFor="coverImageUrl"
                error={errors.coverImageUrl}
                hint="Filled in by the upload. It can also be typed, for a file already in the website's public folder."
              >
                <input
                  id="coverImageUrl"
                  type="text"
                  value={values.coverImageUrl}
                  onChange={setField("coverImageUrl")}
                  disabled={busy}
                  aria-invalid={errors.coverImageUrl ? true : undefined}
                  aria-describedby={errors.coverImageUrl ? "coverImageUrl-error" : undefined}
                  placeholder="/blog/rebrands.png"
                  className={`${inputClass} font-mono text-sm`}
                />
              </Field>

              <Field
                label="Image description"
                htmlFor="coverImageAlt"
                error={errors.coverImageAlt}
                hint="Read aloud in place of the image. Describe what is in it, not that it is a photo."
              >
                <input
                  id="coverImageAlt"
                  type="text"
                  value={values.coverImageAlt}
                  onChange={setField("coverImageAlt")}
                  disabled={busy}
                  placeholder="A logo sketch pinned to a studio wall beside its final mark"
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
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">
            Publishing
          </h2>

          <div className="mt-6 space-y-5">
            <Field
              label="Status"
              htmlFor="status"
              error={errors.status}
              hint="Only published posts appear on the website."
            >
              <select
                id="status"
                value={values.status}
                onChange={setField("status")}
                disabled={busy}
                className={inputClass}
              >
                {POST_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Author"
              htmlFor="author"
              error={errors.author}
              hint="Shown as the byline. Leave blank for none."
            >
              <input
                id="author"
                type="text"
                value={values.author}
                onChange={setField("author")}
                disabled={busy}
                placeholder="Olamide"
                className={inputClass}
              />
            </Field>

            <TagEditor
              tags={tags}
              onChange={(next) => {
                setTags(next);
                setErrors((current) => (current.tags ? { ...current, tags: undefined } : current));
              }}
              disabled={busy}
              error={errors.tags}
            />

            <Field
              label="Address (slug)"
              htmlFor="slug"
              error={errors.slug}
              hint={
                isEdit
                  ? "Changing this changes the post's address, and breaks any link to the old one. A published post keeps its slug when the title changes."
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
                placeholder="why-most-rebrands-fail"
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
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create post"}
            </button>

            <Link
              href="/admin/blog"
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
                  Delete this post permanently?
                </p>
                <p className="mt-1 text-sm text-black/55">
                  {post.title} and its uploaded cover cannot be recovered afterwards.
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
                Delete this post
              </button>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
