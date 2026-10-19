"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mediaUrl, updatePost, uploadPostImage } from "@/lib/api";
import { SITE_URL, SITE_NAME } from "@/lib/site";

/**
 * The form on /admin/blog/<id>/seo: how one post appears in search results
 * and link previews.
 *
 * It saves the SEO fields alone — the API merges a partial update over the
 * stored post — so nothing on the main post form can be overwritten from
 * here. Every field is optional: a blank one falls back to what the public
 * page would use anyway (the post's title, excerpt and cover), and the
 * preview and checklist show that fallback, so the admin sees what Google
 * will actually get rather than an empty box.
 */

// Roughly what Google shows before cutting a result off with "…".
const SEO_TITLE_IDEAL = 60;
const SEO_DESCRIPTION_IDEAL = 160;

// The column sizes; the validator enforces the same ceilings.
const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 320;

const defaultSeoTitle = (title) => (title ? `${title} | ${SITE_NAME}` : "");

/**
 * The checklist, worked out from a post's values (saved or being edited).
 * Exported so the badge on the SEO button and this page score the same way.
 */
export function seoChecks(values, keywords) {
  const title = (values.seoTitle ?? "").trim() || defaultSeoTitle((values.title ?? "").trim());
  const description = (values.seoDescription ?? "").trim() || (values.excerpt ?? "").trim();
  const image = values.seoImageUrl || values.coverImageUrl;
  const focus = keywords[0]?.toLowerCase();

  const checks = [
    {
      ok: title.length >= 30 && title.length <= SEO_TITLE_IDEAL,
      label: `Title is 30–${SEO_TITLE_IDEAL} characters (now ${title.length})`,
    },
    {
      ok: description.length >= 70 && description.length <= SEO_DESCRIPTION_IDEAL,
      label: `Description is 70–${SEO_DESCRIPTION_IDEAL} characters (now ${description.length})`,
    },
    { ok: keywords.length > 0, label: "At least one keyword" },
    {
      ok: Boolean(focus && title.toLowerCase().includes(focus)),
      label: "First keyword appears in the title",
    },
    {
      ok: Boolean(focus && description.toLowerCase().includes(focus)),
      label: "First keyword appears in the description",
    },
    { ok: Boolean(image), label: "Has a share image" },
    { ok: !values.seoNoIndex, label: "Visible to search engines" },
  ];

  return { title, description, image, checks, passed: checks.filter((c) => c.ok).length };
}

const toFormValues = (post) => ({
  seoTitle: post.seoTitle ?? "",
  seoDescription: post.seoDescription ?? "",
  seoImageUrl: post.seoImageUrl ?? "",
  seoNoIndex: Boolean(post.seoNoIndex),
});

const inputClass =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40";

const cardClass = "rounded-2xl border border-black/10 bg-white p-6 md:p-8";

const sectionHeading = "font-headline text-2xl tracking-tight text-navy uppercase";

// "42 / 60" beside a label, amber once it passes what search results show and
// red once it passes what can be saved.
function Counter({ length, ideal, max }) {
  const tone =
    length > max ? "text-red-700" : length > ideal ? "text-amber-700" : "text-black/45";
  return (
    <span className={`text-xs tabular-nums ${tone}`}>
      {length} / {ideal}
    </span>
  );
}

function FieldError({ id, error }) {
  return error ? (
    <p id={id} role="alert" className="mt-2 text-sm text-red-700">
      {error}
    </p>
  ) : null;
}

/**
 * Keyword chips. Unlike tags these are phrases, so a space is part of the
 * keyword — only Enter and comma commit one. Enter is intercepted for the
 * same reason as on the tag editor: a bare Enter would submit the form.
 */
function KeywordEditor({ keywords, onChange, disabled, error }) {
  const [draft, setDraft] = useState("");

  const merge = (list, raw) => {
    const keyword = raw.replace(/\s+/g, " ").trim();
    if (!keyword || list.some((other) => other.toLowerCase() === keyword.toLowerCase())) {
      return list;
    }
    return [...list, keyword];
  };

  const add = (raw) => {
    setDraft("");
    const next = merge(keywords, raw);
    if (next !== keywords) onChange(next);
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  // Pasting "a, b, c" adds all three rather than one keyword with commas in it.
  const onPaste = (event) => {
    const text = event.clipboardData.getData("text");
    if (!text.includes(",")) return;
    event.preventDefault();
    onChange(text.split(",").reduce(merge, keywords));
  };

  return (
    <div>
      <label htmlFor="seo-keyword-input" className="block text-sm font-semibold text-foreground">
        Focus keywords
      </label>

      {keywords.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <li
              key={keyword}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pr-1 pl-3 text-sm ${
                index === 0
                  ? "border-navy/30 bg-navy/[0.06] text-navy"
                  : "border-black/10 bg-black/[0.03] text-black/70"
              }`}
            >
              {keyword}
              <button
                type="button"
                onClick={() => onChange(keywords.filter((other) => other !== keyword))}
                disabled={disabled}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove keyword {keyword}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id="seo-keyword-input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        // Committed on blur too, so a keyword typed and then clicked away
        // from is not silently thrown away on save.
        onBlur={() => add(draft)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "seo-keyword-input-error" : undefined}
        placeholder="brand strategy, rebranding for startups…"
        className={inputClass}
      />

      {error ? (
        <FieldError id="seo-keyword-input-error" error={error} />
      ) : (
        <p className="mt-2 text-sm text-black/45">
          Press Enter or comma after each one. The first is the focus keyword
          the checklist looks for — put the phrase people would search first.
          Up to 20.
        </p>
      )}
    </div>
  );
}

export default function SeoForm({ post }) {
  const router = useRouter();

  const [values, setValues] = useState(() => toFormValues(post));
  const [keywords, setKeywords] = useState(() => post.seoKeywords ?? []);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    setMessage("");
  };

  const uploadImage = async (file) => {
    setUploading(true);
    setError("");
    setErrors((current) => ({ ...current, seoImageUrl: undefined }));

    try {
      const payload = await uploadPostImage(file);
      setValue("seoImageUrl", payload.data.imageUrl);
      setMessage("Image uploaded. It is saved when you press save.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    // Cleared so picking the same file twice in a row still fires a change.
    event.target.value = "";
    if (file) uploadImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setErrors({});
    setMessage("");

    try {
      // Only the SEO fields: the API leaves everything not sent untouched.
      const payload = await updatePost(post.id, {
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        seoKeywords: keywords,
        seoImageUrl: values.seoImageUrl || null,
        seoNoIndex: values.seoNoIndex,
      });
      setValues(toFormValues(payload.data.post));
      setKeywords(payload.data.post.seoKeywords ?? []);
      setMessage("SEO settings saved.");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setErrors(requestError.errors || {});
    }

    setSaving(false);
  };

  const busy = saving || uploading;
  const { title, description, image, checks, passed } = seoChecks(
    { ...post, ...values },
    keywords
  );
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const imageSrc = mediaUrl(image);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start"
    >
      {/* Fields ------------------------------------------------------------- */}
      <div className="space-y-6">
        <div className={cardClass}>
          <h2 className={sectionHeading}>Search result</h2>
          <p className="mt-2 text-sm text-black/50">
            What Google shows for this post. Anything left blank uses the
            post&apos;s own title and excerpt.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="seoTitle" className="block text-sm font-semibold text-foreground">
                  SEO title
                </label>
                <Counter length={title.length} ideal={SEO_TITLE_IDEAL} max={SEO_TITLE_MAX} />
              </div>
              <input
                id="seoTitle"
                type="text"
                value={values.seoTitle}
                onChange={(event) => setValue("seoTitle", event.target.value)}
                disabled={busy}
                maxLength={SEO_TITLE_MAX}
                aria-invalid={errors.seoTitle ? true : undefined}
                aria-describedby={errors.seoTitle ? "seoTitle-error" : undefined}
                placeholder={defaultSeoTitle(post.title)}
                className={inputClass}
              />
              {errors.seoTitle ? (
                <FieldError id="seoTitle-error" error={errors.seoTitle} />
              ) : (
                <p className="mt-2 text-sm text-black/45">
                  The blue link in search results and the browser tab. Used
                  exactly as typed. Blank uses the post title plus &ldquo;|{" "}
                  {SITE_NAME}&rdquo;.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label
                  htmlFor="seoDescription"
                  className="block text-sm font-semibold text-foreground"
                >
                  Meta description
                </label>
                <Counter
                  length={description.length}
                  ideal={SEO_DESCRIPTION_IDEAL}
                  max={SEO_DESCRIPTION_MAX}
                />
              </div>
              <textarea
                id="seoDescription"
                rows={4}
                value={values.seoDescription}
                onChange={(event) => setValue("seoDescription", event.target.value)}
                disabled={busy}
                maxLength={SEO_DESCRIPTION_MAX}
                aria-invalid={errors.seoDescription ? true : undefined}
                aria-describedby={errors.seoDescription ? "seoDescription-error" : undefined}
                placeholder={post.excerpt}
                className={`${inputClass} resize-y`}
              />
              {errors.seoDescription ? (
                <FieldError id="seoDescription-error" error={errors.seoDescription} />
              ) : (
                <p className="mt-2 text-sm text-black/45">
                  The grey text under the link — write it to make someone
                  click. Blank uses the excerpt.
                </p>
              )}
            </div>

            <KeywordEditor
              keywords={keywords}
              onChange={(next) => {
                setKeywords(next);
                setMessage("");
                setErrors((current) =>
                  current.seoKeywords ? { ...current, seoKeywords: undefined } : current
                );
              }}
              disabled={busy}
              error={errors.seoKeywords}
            />
          </div>
        </div>

        {/* Share image ------------------------------------------------------ */}
        <div className={cardClass}>
          <h2 className={sectionHeading}>Share image</h2>
          <p className="mt-2 text-sm text-black/50">
            The picture on LinkedIn, WhatsApp, X and other link previews.
            1200 × 630 works best. Blank uses the cover image.
          </p>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt=""
                  className="aspect-[1.91/1] w-56 rounded-xl border border-black/10 object-cover"
                />
              ) : (
                <div className="flex aspect-[1.91/1] w-56 items-center justify-center rounded-xl border border-dashed border-black/20 bg-black/[0.02] text-xs text-black/35">
                  No image
                </div>
              )}
              <p className="mt-2 text-xs text-black/45">
                {values.seoImageUrl ? "Custom share image" : "Using the cover image"}
              </p>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <label htmlFor="seo-image" className="block text-sm font-semibold text-foreground">
                Upload a share image
              </label>
              <input
                id="seo-image"
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
              <FieldError id="seoImageUrl-error" error={errors.seoImageUrl} />
              {values.seoImageUrl ? (
                <button
                  type="button"
                  onClick={() => setValue("seoImageUrl", "")}
                  disabled={busy}
                  className="text-sm font-semibold text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Use the cover image instead
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Indexing --------------------------------------------------------- */}
        <div className={cardClass}>
          <h2 className={sectionHeading}>Indexing</h2>
          <label className="mt-5 flex items-start gap-3">
            <input
              type="checkbox"
              checked={values.seoNoIndex}
              onChange={(event) => setValue("seoNoIndex", event.target.checked)}
              disabled={busy}
              className="mt-1 h-4 w-4 accent-navy"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Hide this post from search engines
              </span>
              <span className="mt-1 block text-sm text-black/50">
                Adds &ldquo;noindex&rdquo; and leaves it out of the sitemap.
                The post stays live for anyone with the link. Leave this off
                unless you have a reason.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Preview, checklist, save -------------------------------------------- */}
      <div className="space-y-6 lg:sticky lg:top-6">
        <div className={cardClass}>
          <h2 className={sectionHeading}>Google preview</h2>
          <div className="mt-5 rounded-xl border border-black/10 p-5">
            <p className="truncate text-sm text-black/60">
              {host} › blog › {post.slug}
            </p>
            <p className="mt-1 line-clamp-2 text-xl leading-snug text-[#1a0dab]">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-black/70">{description}</p>
          </div>
          {values.seoNoIndex ? (
            <p className="mt-3 text-sm text-amber-700">
              Hidden from search engines — this result will not appear.
            </p>
          ) : null}
        </div>

        <div className={cardClass}>
          <h2 className={sectionHeading}>
            Checklist{" "}
            <span className="text-base text-black/45 normal-case">
              {passed} of {checks.length}
            </span>
          </h2>
          <ul className="mt-5 space-y-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    check.ok ? "bg-green-600" : "bg-amber-500"
                  }`}
                >
                  {check.ok ? "✓" : "!"}
                </span>
                <span className={check.ok ? "text-black/60" : "text-black/90"}>
                  <span className="sr-only">{check.ok ? "Done: " : "To do: "}</span>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>

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
              {saving ? "Saving…" : "Save SEO"}
            </button>
            <Link
              href={`/admin/blog/${post.id}`}
              className="font-nav border border-black/15 px-5 py-3 text-sm font-bold tracking-[0.04em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
            >
              Back to post
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
