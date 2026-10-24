"use client";

import { useEffect, useRef, useState } from "react";
import { watchReveal } from "@/components/shared/reveal-observer";

// Word-by-word entrance for headline copy: each word rises out of its own
// masked line on a short stagger, instead of the whole block moving as one
// piece. Mirrors the scroll-trigger pattern in reveal.js, but needs its own
// DOM shape (one clipped wrapper per word) so it isn't folded into that
// component's single-child model.
export default function RevealWords({
  as: Tag = "span",
  text,
  className = "",
  delay = 0,
  step = 45,
  accent = "",
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return watchReveal(el, () => setShown(true));
  }, []);

  const words = text.split(" ");

  // `accent` is a phrase inside `text` to tint with the accent colour. Work
  // out which word indexes it covers so the per-word spans can carry it.
  const accentStart = accent ? text.indexOf(accent) : -1;
  const accented = new Set();
  if (accentStart >= 0) {
    const first = text.slice(0, accentStart).split(" ").length - 1;
    accent.split(" ").forEach((_, i) => accented.add(first + i));
  }

  return (
    <Tag ref={ref} className={className} {...rest}>
      {words.map((word, index) => (
        <span key={index} data-reveal-word data-shown={shown ? "" : undefined}>
          <span
            className={accented.has(index) ? "text-accent" : undefined}
            style={{ "--word-delay": `${delay + index * step}ms` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
