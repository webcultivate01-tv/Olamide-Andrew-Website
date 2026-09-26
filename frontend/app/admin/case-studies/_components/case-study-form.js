"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CASE_STUDY_STATUSES,
  createCaseStudy,
  deleteCaseStudy,
  getCategories,
  mediaUrl,
  updateCaseStudy,
  uploadCaseStudyImage,
  uploadBlockImage,
} from "@/lib/api";
import CaseStudyPreview from "./case-study-preview";

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
  tagline: "",
  categories: "",
  intro: "",
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
        tagline: study.tagline ?? "",
        categories: (study.categories ?? []).join(", "),
        intro: study.intro ?? "",
      }
    : EMPTY;

// Mirrors the backend's slugify (case-study.validator.js) closely enough for
// a folder name - it does not need to match the final saved slug exactly,
// only to be a stable, filesystem-safe stand-in for "this case study" while
// it is still being created.
const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

// A block as the form edits it, with a local `key` for React's benefit — the
// only thing the API's block ids are used for is telling one row from
// another before it has ever been saved.
let blockKeySeed = 0;
const nextBlockKey = () => `block-${Date.now()}-${blockKeySeed++}`;

const BLOCK_TYPES = [
  { value: "IMAGE", label: "Image" },
  { value: "COLOR", label: "Colour panel" },
  { value: "TEXT", label: "Heading & text" },
];

const BLOCK_LAYOUTS = [
  { value: "FULL", label: "Full width" },
  { value: "HALF", label: "Half width" },
];

const BLOCK_VARIANTS = [
  { value: "DEFAULT", label: "Section" },
  { value: "PROMISE", label: "Brand promise (large statement)" },
];

const emptyBlock = (type, layout = "FULL") => ({
  key: nextBlockKey(),
  type,
  layout,
  category: "",
  variant: "DEFAULT",
  heading: "",
  body: "",
  imageUrl: "",
  imageAlt: "",
  colorHex: type === "COLOR" ? "#2f6f4c" : "",
});

const toFormBlocks = (blocks) =>
  (blocks ?? []).map((block) => ({
    key: nextBlockKey(),
    type: block.type,
    layout: block.layout ?? "FULL",
    category: block.category ?? "",
    variant: block.variant ?? "DEFAULT",
    heading: block.heading ?? "",
    body: block.body ?? "",
    imageUrl: block.imageUrl ?? "",
    imageAlt: block.imageAlt ?? "",
    colorHex: block.colorHex ?? "",
  }));

// The study's own "Finance, Investment, ..." field, parsed the same way the
// preview reads it - the list a block's category picker offers is exactly
// the list the sidebar above it will show.
const parseCategories = (value) =>
  (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

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
  const [blocks, setBlocks] = useState(() => toFormBlocks(study?.blocks));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  // Which block's image is uploading, if any — blocks upload one at a time,
  // the same as the cover image, so a single key is enough to track it.
  const [uploadingBlockKey, setUploadingBlockKey] = useState(null);

  // The subfolder every image for this case study is uploaded into, so its
  // cover and every block image end up together on disk.
  //
  // Editing an existing study uses its real slug - stable no matter what the
  // title field is changed to before the next save. A new study has no slug
  // yet, so the first image picks one from whatever title is typed at that
  // moment and every image after it, on this page, reuses that same folder -
  // otherwise a title edited between two uploads would split them apart.
  const uploadFolderRef = useRef(isEdit ? study.slug : null);
  const uploadFolder = () => {
    if (!uploadFolderRef.current) {
      uploadFolderRef.current = slugify(values.title) || "untitled-case-study";
    }
    return uploadFolderRef.current;
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // The case study categories managed under Admin → Categories. An empty
  // list is fine - a failed load just leaves the picker with nothing to offer
  // rather than blocking the form.
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getCategories({ type: "case_study" })
      .then((payload) => {
        if (!cancelled) setAvailableCategories(payload.data.categories);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Both the live preview and the fields below it write through here, so
  // the two can never disagree about what the case study currently says.
  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Clear the message for this field as soon as it is edited — leaving it
    // under a box the admin has already fixed just reads as broken.
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  const setField = (name) => (event) => setValue(name, event.target.value);

  // The file is uploaded the moment it is chosen, and what comes back is a
  // path stored in the form like any other value. Waiting for submit would
  // mean the preview showed a local blob that might never reach the server.
  const uploadCover = async (file) => {
    setUploading(true);
    setError("");
    setErrors((current) => ({ ...current, imageUrl: undefined }));

    try {
      const payload = await uploadCaseStudyImage(file, uploadFolder());
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

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file) uploadCover(file);
  };

  // `count` is what the preview's "two half images" button uses: a pair is
  // the thing being added, not two blocks that happen to end up adjacent.
  const addBlock = (type, layout = "FULL", count = 1) => {
    setBlocks((current) => [
      ...current,
      ...Array.from({ length: count }, () => emptyBlock(type, layout)),
    ]);
  };

  const removeBlock = (key) => {
    setBlocks((current) => current.filter((block) => block.key !== key));
  };

  const moveBlock = (key, direction) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const setBlockValue = (key, field, value) => {
    setBlocks((current) =>
      current.map((block) => (block.key === key ? { ...block, [field]: value } : block))
    );
  };

  const setBlockField = (key, field) => (event) =>
    setBlockValue(key, field, event.target.value);

  // Same reasoning as the cover image: uploaded the moment it is chosen, so
  // the preview in the block shows the real file rather than a blob that
  // might never reach the server.
  const uploadBlockFile = async (key, file) => {
    setUploadingBlockKey(key);
    setError("");

    try {
      // uploads/blocks/<category>/<block title>/ - either part falls back to
      // a placeholder so choosing a file before naming the block still works.
      const block = blocks.find((candidate) => candidate.key === key);
      const folder = `${slugify(block?.category || "") || "uncategorised"}/${
        slugify(block?.heading || "") || "block"
      }`;
      const payload = await uploadBlockImage(file, folder);
      setBlocks((current) =>
        current.map((block) =>
          block.key === key ? { ...block, imageUrl: payload.data.imageUrl } : block
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploadingBlockKey(null);
    }
  };

  const handleBlockFile = (key) => (event) => {
    const file = event.target.files?.[0];
    // Cleared so picking the same file twice in a row still fires a change.
    event.target.value = "";
    if (file) uploadBlockFile(key, file);
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
      tagline: values.tagline || null,
      categories: values.categories,
      intro: values.intro || null,
      blocks: blocks.map(({ key, ...block }) => ({
        ...block,
        category: block.category || null,
        heading: block.heading || null,
        body: block.body || null,
        imageUrl: block.imageUrl || null,
        imageAlt: block.imageAlt || null,
        colorHex: block.colorHex || null,
      })),
    };

    if (values.sortOrder !== "") {
      body.sortOrder = Number(values.sortOrder);
    }

    try {
      if (isEdit) {
        const payload = await updateCaseStudy(study.id, body);
        setValues(toFormValues(payload.data.caseStudy));
        setBlocks(toFormBlocks(payload.data.caseStudy.blocks));
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

  const busy = saving || uploading || deleting || uploadingBlockKey !== null;
  const previewSrc = mediaUrl(values.imageUrl);
  const categoryOptions = parseCategories(values.categories);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      {/* The page itself ---------------------------------------------------- */}
      {/* First, and across the whole width: a new case study opens on the
          shape of the page rather than on a column of empty boxes, so images
          go straight into their slots and copy is typed where it will be
          read. The fields below it are the same values in detail. */}
      <div className="lg:col-span-2">
        <CaseStudyPreview
          values={values}
          blocks={blocks}
          disabled={busy}
          uploadingCover={uploading}
          uploadingBlockKey={uploadingBlockKey}
          onValue={setValue}
          onCoverFile={uploadCover}
          onBlockField={setBlockValue}
          onBlockFile={uploadBlockFile}
          onAddBlock={addBlock}
          onMoveBlock={moveBlock}
          onRemoveBlock={removeBlock}
        />
      </div>

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
              label="Tagline"
              htmlFor="tagline"
              error={errors.tagline}
              hint="The line under the title on the detail page."
            >
              <input
                id="tagline"
                type="text"
                value={values.tagline}
                onChange={setField("tagline")}
                disabled={busy}
                placeholder="Building a financial brand that grows with a new generation."
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

            <Field
              label="Categories"
              htmlFor="categories"
              error={errors.categories}
              hint="Pick from the case study categories. Shown as a plain list on the detail page's sidebar."
            >
              {(() => {
                const selected = parseCategories(values.categories);
                const names = availableCategories.map((category) => category.name);
                // A label the study already has that is no longer in the
                // managed list stays visible, so saving does not drop it
                // without the admin noticing.
                const options = [...names, ...selected.filter((name) => !names.includes(name))];

                const toggle = (name) => {
                  const next = selected.includes(name)
                    ? selected.filter((entry) => entry !== name)
                    : [...selected, name];
                  setValue("categories", next.join(", "));
                };

                if (options.length === 0) {
                  return (
                    <p id="categories" className="mt-2 text-sm text-black/55">
                      No case study categories yet. Add some under{" "}
                      <Link href="/admin/categories" className="font-semibold text-navy underline">
                        Categories
                      </Link>
                      .
                    </p>
                  );
                }

                return (
                  <div id="categories" className="mt-2 flex flex-wrap gap-2">
                    {options.map((name) => {
                      const checked = selected.includes(name);

                      return (
                        <label
                          key={name}
                          className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                            checked
                              ? "border-navy bg-navy text-white"
                              : "border-black/15 bg-white text-foreground hover:border-navy"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggle(name)}
                            disabled={busy}
                          />
                          {name}
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
            </Field>

            <Field
              label="Introduction"
              htmlFor="intro"
              error={errors.intro}
              hint="The opening paragraphs on the detail page, above the images. Leave a blank line between paragraphs."
            >
              <textarea
                id="intro"
                rows={7}
                value={values.intro}
                onChange={setField("intro")}
                disabled={busy}
                placeholder={
                  "The future of banking isn't about holding money. It's about building confidence.\n\nSkyline Finance was envisioned as a modern, digital-first credit union..."
                }
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>
        </div>

        {/* Image ------------------------------------------------------------ */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Cover image</h2>
          <p className="mt-2 text-sm text-black/50">
            JPEG, PNG, WebP or AVIF, up to 4 MB. It is cropped twice — wide
            across the top of the detail page, square-ish on the grid — so a
            centred subject survives best.
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

        {/* Content blocks ----------------------------------------------------- */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">
            Content blocks
          </h2>
          <p className="mt-2 text-sm text-black/50">
            The same blocks as the preview above, with the details it has no
            room for. A full-width block runs edge to edge at the same shape
            as the cover image; two half-width blocks next to each other
            split that width between them, their outer edges flush with the
            screen.
          </p>
          <p className="mt-2 text-sm text-black/50">
            Give a block one of the categories above and it only shows on the
            detail page when a visitor selects that category in the sidebar.
            Left as &quot;No category&quot;, a block always shows.
          </p>

          {errors.blocks ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {errors.blocks}
            </p>
          ) : null}

          <div className="mt-6 space-y-5">
            {blocks.map((block, index) => (
              <div
                key={block.key}
                className="rounded-xl border border-black/10 bg-black/[0.015] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-nav text-xs font-bold tracking-[0.12em] text-black/45 uppercase">
                      {index + 1}. {BLOCK_TYPES.find((t) => t.value === block.type)?.label}
                    </span>

                    <select
                      value={block.layout}
                      onChange={setBlockField(block.key, "layout")}
                      disabled={busy}
                      aria-label="Block width"
                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-foreground"
                    >
                      {BLOCK_LAYOUTS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {block.type === "TEXT" ? (
                      <select
                        value={block.variant}
                        onChange={setBlockField(block.key, "variant")}
                        disabled={busy}
                        aria-label="Text style"
                        className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-foreground"
                      >
                        {BLOCK_VARIANTS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    <select
                      value={block.category}
                      onChange={setBlockField(block.key, "category")}
                      disabled={busy}
                      aria-label="Block category"
                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-foreground"
                    >
                      <option value="">No category</option>
                      {/* A category the block already has but that was since
                          removed from the field above still shows here, so
                          saving the form does not silently drop it. */}
                      {(categoryOptions.includes(block.category) || !block.category
                        ? categoryOptions
                        : [block.category, ...categoryOptions]
                      ).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(block.key, -1)}
                      disabled={busy || index === 0}
                      aria-label="Move block up"
                      className="rounded-lg px-2 py-1 text-sm text-black/55 hover:bg-black/5 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(block.key, 1)}
                      disabled={busy || index === blocks.length - 1}
                      aria-label="Move block down"
                      className="rounded-lg px-2 py-1 text-sm text-black/55 hover:bg-black/5 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.key)}
                      disabled={busy}
                      className="rounded-lg px-2 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {block.type === "IMAGE" ? (
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="shrink-0">
                      {mediaUrl(block.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(block.imageUrl)}
                          alt={block.imageAlt || "Selected block image"}
                          className="h-28 w-28 rounded-lg border border-black/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-black/20 bg-white text-center text-[11px] text-black/35">
                          No image yet
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={handleBlockFile(block.key)}
                        disabled={busy}
                        aria-label="Upload block image"
                        className="font-nav block w-full text-sm text-black/60 file:mr-4 file:border-0 file:bg-navy file:px-3 file:py-2 file:text-xs file:font-bold file:tracking-[0.08em] file:text-white file:uppercase hover:file:bg-navy/90 disabled:opacity-50"
                      />
                      {uploadingBlockKey === block.key ? (
                        <p role="status" className="text-sm text-black/55">
                          Uploading…
                        </p>
                      ) : null}
                      <input
                        type="text"
                        value={block.imageAlt}
                        onChange={setBlockField(block.key, "imageAlt")}
                        disabled={busy}
                        placeholder="Describe what is in the photo"
                        aria-label="Image description"
                        className={`${inputClass} mt-0 text-sm`}
                      />
                    </div>
                  </div>
                ) : null}

                {block.type === "COLOR" ? (
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(block.colorHex) ? block.colorHex : "#2f6f4c"}
                      onChange={setBlockField(block.key, "colorHex")}
                      disabled={busy}
                      aria-label="Panel colour"
                      className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-black/15 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={block.colorHex}
                      onChange={setBlockField(block.key, "colorHex")}
                      disabled={busy}
                      placeholder="#2f6f4c"
                      aria-label="Panel colour hex value"
                      className={`${inputClass} mt-0 max-w-[160px] font-mono text-sm`}
                    />
                  </div>
                ) : null}

                {block.type === "TEXT" ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={block.heading}
                      onChange={setBlockField(block.key, "heading")}
                      disabled={busy}
                      placeholder={
                        block.variant === "PROMISE"
                          ? "Our brand promise"
                          : "Bridging the gap between banking and belonging"
                      }
                      aria-label="Block heading"
                      className={`${inputClass} mt-0`}
                    />
                    <textarea
                      rows={4}
                      value={block.body}
                      onChange={setBlockField(block.key, "body")}
                      disabled={busy}
                      placeholder="The body copy for this section."
                      aria-label="Block text"
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                ) : null}
              </div>
            ))}

            {!blocks.length ? (
              <p className="text-sm text-black/45">
                No content blocks yet — the detail page will show just the
                title, categories and introduction above.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {BLOCK_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => addBlock(option.value)}
                disabled={busy}
                className="font-nav border border-black/15 px-4 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
              >
                + {option.label}
              </button>
            ))}
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
