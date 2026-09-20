"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { mediaUrl } from "@/lib/api";
import {
  PAIR_GAP,
  frameFor,
  groupIntoRows,
} from "@/app/case-studies/_components/case-study-layout";

/**
 * The case study as the website will lay it out, with every piece of it
 * editable in place.
 *
 * This is the first thing an admin sees when they add a study: the page
 * shape is already there — hero, title, paragraphs, image rows — so they
 * drop images into the slots and type over the placeholder text rather than
 * filling in a column of boxes and imagining the result. The fields below
 * this preview stay as the detailed view of the same values; both edit one
 * piece of state, so whichever one is used the other keeps up.
 *
 * Deliberately not the public components: those animate on reveal, which
 * would replay on every keystroke here, and they render `next/image`, which
 * has nothing to optimise for a page only the admin ever loads. The shapes
 * come from the same `case-study-layout` module the public page uses, so
 * what is drawn here is the real layout rather than an impression of it.
 */

// The page's own gutter, mirrored from the public detail page so the text
// column starts where it really will. Images are outside it — they run to
// the preview's edges the same way they run to the screen's.
const GUTTER = "px-5 md:px-10 lg:px-16";

// A textarea dressed as the text it stands in for: no chrome until it is
// pointed at, so the preview reads as a page rather than as a form.
const EDITABLE =
  "block w-full resize-none overflow-hidden rounded-[4px] border border-transparent bg-transparent outline-none transition-colors placeholder:text-black/25 hover:border-navy/25 hover:bg-navy/[0.03] focus:border-navy/50 focus:bg-navy/[0.04]";

// The admin page is server-rendered before it hydrates, and useLayoutEffect
// has nothing to measure there.
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function EditableText({
  value,
  onChange,
  placeholder,
  className = "",
  ariaLabel,
  disabled = false,
  rows = 1,
}) {
  const ref = useRef(null);

  // Grown to fit its content on every change, so a paragraph occupies
  // exactly the height the real page would give it and nothing below it
  // shifts as the admin types.
  useMeasureEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      spellCheck={false}
      className={`${EDITABLE} ${className}`}
    />
  );
}

const TOOL_BUTTON =
  "font-nav rounded-md bg-navy/90 px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy disabled:opacity-40";

/**
 * An image's place on the page, at the exact shape the website will crop it
 * to. Empty it is a dashed target; filled it is the image with its controls
 * held back until the pointer is over it.
 */
function ImageSlot({
  src,
  alt,
  frame,
  label,
  onFile,
  onClear,
  uploading = false,
  disabled = false,
  // A block image's own controls drop to the bottom so they do not land
  // under the block toolbar sitting in the same corner above them.
  controlsAt = "top",
}) {
  const input = useRef(null);
  const resolved = mediaUrl(src);

  const choose = () => input.current?.click();

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    // Cleared so picking the same file twice in a row still fires a change.
    event.target.value = "";
    if (file) onFile(file);
  };

  return (
    <div className={`group relative ${frame} overflow-hidden bg-black/[0.04]`}>
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={alt || ""}
          className="h-full w-full object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={choose}
          disabled={disabled}
          className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-black/20 text-center transition-colors hover:border-navy/50 hover:bg-navy/[0.03] disabled:opacity-50"
        >
          <span className="font-nav text-[11px] font-bold tracking-[0.14em] text-black/45 uppercase">
            {uploading ? "Uploading…" : label}
          </span>
          <span className="px-4 text-[11px] text-black/35">
            Click to choose a JPEG, PNG, WebP or AVIF
          </span>
        </button>
      )}

      {resolved ? (
        <div
          className={`pointer-events-none absolute inset-0 flex justify-end p-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 ${
            controlsAt === "bottom" ? "items-end" : "items-start"
          }`}
        >
          <div className="pointer-events-auto flex gap-1.5">
            <button
              type="button"
              onClick={choose}
              disabled={disabled}
              className={TOOL_BUTTON}
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            {onClear ? (
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className={TOOL_BUTTON}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label={label}
      />
    </div>
  );
}

/** The move / width / remove controls that hover over one block. */
function BlockTools({
  index,
  total,
  layout,
  onLayout,
  onMove,
  onRemove,
  disabled,
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end p-3 opacity-0 transition-opacity group-hover/block:opacity-100 focus-within:opacity-100">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-black/10">
        <select
          value={layout}
          onChange={(event) => onLayout(event.target.value)}
          disabled={disabled}
          aria-label="Block width"
          className="rounded-md border border-black/15 bg-white px-2 py-1 text-[11px] text-foreground"
        >
          <option value="FULL">Full width</option>
          <option value="HALF">Half width</option>
        </select>
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={disabled || index === 0}
          aria-label="Move block up"
          className={TOOL_BUTTON}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={disabled || index === total - 1}
          aria-label="Move block down"
          className={TOOL_BUTTON}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove block"
          className="font-nav rounded-md bg-red-600/90 px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-red-700 disabled:opacity-40"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function PreviewBlock({
  block,
  index,
  total,
  disabled,
  uploading,
  onField,
  onFile,
  onLayout,
  onMove,
  onRemove,
}) {
  const frame = frameFor(block.layout);

  const tools = (
    <BlockTools
      index={index}
      total={total}
      layout={block.layout}
      onLayout={onLayout}
      onMove={onMove}
      onRemove={onRemove}
      disabled={disabled}
    />
  );

  if (block.type === "IMAGE") {
    return (
      <div className="group/block relative">
        {tools}
        <ImageSlot
          src={block.imageUrl}
          alt={block.imageAlt}
          frame={frame}
          label="Add image"
          uploading={uploading}
          disabled={disabled}
          controlsAt="bottom"
          onFile={onFile}
          onClear={() => onField("imageUrl", "")}
        />
      </div>
    );
  }

  if (block.type === "COLOR") {
    const hex = /^#[0-9a-fA-F]{6}$/.test(block.colorHex)
      ? block.colorHex
      : "#2f6f4c";
    return (
      <div className="group/block relative">
        {tools}
        <div className={frame} style={{ backgroundColor: hex }} />
        <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-3 opacity-0 transition-opacity group-hover/block:opacity-100 focus-within:opacity-100">
          <input
            type="color"
            value={hex}
            onChange={(event) => onField("colorHex", event.target.value)}
            disabled={disabled}
            aria-label="Panel colour"
            className="pointer-events-auto h-9 w-9 cursor-pointer rounded-lg border border-white/60 bg-white p-1"
          />
        </div>
      </div>
    );
  }

  const isPromise = block.variant === "PROMISE";

  return (
    <div className={`group/block relative ${GUTTER}`}>
      {tools}
      <div className={`mx-auto max-w-[880px] py-12 md:py-16 ${isPromise ? "text-left" : ""}`}>
        {isPromise ? (
          <>
            <EditableText
              value={block.heading}
              onChange={(next) => onField("heading", next)}
              placeholder="Our brand promise"
              ariaLabel="Block heading"
              disabled={disabled}
              className="font-headline text-2xl leading-[1.2] tracking-[-0.01em] text-foreground uppercase sm:text-3xl md:text-4xl"
            />
            <EditableText
              value={block.body}
              onChange={(next) => onField("body", next)}
              placeholder="The one line this project is remembered for."
              ariaLabel="Block text"
              disabled={disabled}
              className="mt-5 max-w-2xl text-base leading-[1.9] text-black/70 md:text-lg"
            />
          </>
        ) : (
          <>
            <EditableText
              value={block.heading}
              onChange={(next) => onField("heading", next)}
              placeholder="Bridging the gap between banking and belonging"
              ariaLabel="Block heading"
              disabled={disabled}
              className="font-headline text-center text-2xl leading-[1.2] tracking-[-0.01em] text-foreground uppercase sm:text-3xl md:text-4xl"
            />
            <EditableText
              value={block.body}
              onChange={(next) => onField("body", next)}
              placeholder="The body copy for this section."
              ariaLabel="Block text"
              disabled={disabled}
              className="mt-5 text-center text-base leading-[1.9] text-black/70 md:text-lg"
            />
          </>
        )}
      </div>
    </div>
  );
}

const ADD_BUTTON =
  "font-nav border border-black/15 bg-white px-4 py-2 text-[11px] font-bold tracking-[0.1em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50";

export default function CaseStudyPreview({
  values,
  blocks,
  disabled = false,
  uploadingCover = false,
  uploadingBlockKey = null,
  onValue,
  onCoverFile,
  onBlockField,
  onBlockFile,
  onAddBlock,
  onMoveBlock,
  onRemoveBlock,
}) {
  // Kept as the stored string rather than an array in state: the textareas
  // below write back into it, so there is one copy of the intro and the
  // fields under the preview stay in step with it.
  const paragraphs = (values.intro || "").split(/\n{2,}/);
  if (!paragraphs.length) paragraphs.push("");

  const setParagraph = (index, next) => {
    const updated = [...paragraphs];
    updated[index] = next;
    onValue("intro", updated.join("\n\n"));
  };

  const removeParagraph = (index) => {
    onValue("intro", paragraphs.filter((_, i) => i !== index).join("\n\n"));
  };

  const categories = (values.categories || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const rows = groupIntoRows(blocks);

  const blockProps = (block, index) => ({
    block,
    index,
    total: blocks.length,
    disabled,
    uploading: uploadingBlockKey === block.key,
    onField: (field, value) => onBlockField(block.key, field, value),
    onFile: (file) => onBlockFile(block.key, file),
    onLayout: (layout) => onBlockField(block.key, "layout", layout),
    onMove: (direction) => onMoveBlock(block.key, direction),
    onRemove: () => onRemoveBlock(block.key),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-5 py-3">
        <p className="font-nav text-xs font-bold tracking-[0.14em] text-navy uppercase">
          The page
        </p>
        <p className="text-xs text-black/45">
          Click any image to upload, click any line to type over it.
        </p>
      </div>

      {/* Hero — the shape every full-width image below repeats. */}
      <ImageSlot
        src={values.imageUrl}
        alt={values.imageAlt || values.title}
        frame={frameFor("FULL")}
        label="Add cover image"
        uploading={uploadingCover}
        disabled={disabled}
        onFile={onCoverFile}
        onClear={() => onValue("imageUrl", "")}
      />

      <div className={`${GUTTER} py-12 md:py-16`}>
        <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
          <div>
            <p className="font-nav text-xs font-bold tracking-[0.2em] text-black/45 uppercase">
              Categories
            </p>
            {categories.length ? (
              <ul className="mt-4 space-y-2">
                {categories.map((category) => (
                  <li key={category} className="text-sm text-black/65">
                    {category}
                  </li>
                ))}
              </ul>
            ) : null}
            {/* Stored as one comma-separated line, so that is what is typed
                here; the list above is how it comes out on the page. */}
            <EditableText
              value={values.categories}
              onChange={(next) => onValue("categories", next)}
              placeholder="Finance, Investment, Digital Banking"
              ariaLabel="Categories, comma separated"
              disabled={disabled}
              className="mt-4 text-sm text-black/40 italic"
            />
          </div>

          <div>
            <EditableText
              value={values.title}
              onChange={(next) => onValue("title", next)}
              placeholder="Case study title"
              ariaLabel="Title"
              disabled={disabled}
              className="font-headline text-4xl leading-[1.05] tracking-[-0.01em] text-foreground uppercase sm:text-5xl md:text-6xl lg:text-[4.25rem]"
            />

            <EditableText
              value={values.tagline}
              onChange={(next) => onValue("tagline", next)}
              placeholder="The line under the title."
              ariaLabel="Tagline"
              disabled={disabled}
              className="mt-4 max-w-[640px] text-lg text-black/70 md:mt-5 md:text-xl"
            />

            <div className="mt-10 max-w-[640px] space-y-4 md:mt-12">
              {paragraphs.map((paragraph, index) => (
                <div key={index} className="group/para relative">
                  <EditableText
                    value={paragraph}
                    onChange={(next) => setParagraph(index, next)}
                    placeholder={
                      index === 0
                        ? "The opening paragraph of the story."
                        : "Another paragraph."
                    }
                    ariaLabel={`Introduction paragraph ${index + 1}`}
                    disabled={disabled}
                    className={
                      index === 0
                        ? "text-xl leading-[1.6] text-foreground md:text-2xl"
                        : "text-base leading-[1.9] text-black/70 md:text-lg"
                    }
                  />
                  {paragraphs.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeParagraph(index)}
                      disabled={disabled}
                      aria-label={`Remove paragraph ${index + 1}`}
                      className="absolute top-1 -right-2 translate-x-full rounded-md px-2 py-1 text-xs font-semibold text-red-600 opacity-0 transition-opacity group-hover/para:opacity-100 focus:opacity-100 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              ))}

              <button
                type="button"
                onClick={() => onValue("intro", `${values.intro || ""}\n\n`)}
                disabled={disabled}
                className="font-nav text-[11px] font-bold tracking-[0.1em] text-navy uppercase hover:underline disabled:opacity-50"
              >
                + Paragraph
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body blocks, in the rows the public page groups them into. */}
      <div className="space-y-3 md:space-y-4">
        {rows.map((row) => {
          if (row.kind === "pair") {
            return (
              <div key={row.index} className={`grid grid-cols-2 ${PAIR_GAP}`}>
                <PreviewBlock {...blockProps(row.blocks[0], row.index)} />
                <PreviewBlock {...blockProps(row.blocks[1], row.index + 1)} />
              </div>
            );
          }

          if (row.block.type !== "TEXT" && row.block.layout === "HALF") {
            return (
              <div key={row.index} className={`grid grid-cols-2 ${PAIR_GAP}`}>
                <PreviewBlock {...blockProps(row.block, row.index)} />
              </div>
            );
          }

          return (
            <PreviewBlock
              key={row.index}
              {...blockProps(row.block, row.index)}
            />
          );
        })}
      </div>

      <div className={`${GUTTER} flex flex-wrap items-center gap-3 py-8`}>
        <span className="font-nav text-[11px] font-bold tracking-[0.1em] text-black/40 uppercase">
          Add to the page
        </span>
        <button
          type="button"
          onClick={() => onAddBlock("IMAGE", "FULL")}
          disabled={disabled}
          className={ADD_BUTTON}
        >
          + Full image
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("IMAGE", "HALF", 2)}
          disabled={disabled}
          className={ADD_BUTTON}
        >
          + Two half images
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("COLOR", "HALF")}
          disabled={disabled}
          className={ADD_BUTTON}
        >
          + Colour panel
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("TEXT", "FULL")}
          disabled={disabled}
          className={ADD_BUTTON}
        >
          + Heading &amp; text
        </button>
      </div>
    </div>
  );
}
