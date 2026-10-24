"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The pixel width of the element the returned ref is put on, or 0 until it has
 * been measured.
 *
 * The charts here are drawn at real pixel sizes rather than in a scaled
 * viewBox. A viewBox with `preserveAspectRatio="none"` would stretch a 2px
 * line into a 5px one on a wide screen and squash the date labels on a narrow
 * one; measuring instead means a stroke is the width it says it is at every
 * size.
 *
 * The zero is the important part. The obvious version of this hook starts at a
 * plausible guess so the server has something to draw with — and that quietly
 * breaks hydration: the server writes a chart at 680px, the browser measures
 * 658 before React has finished hydrating, and every coordinate in the SVG
 * disagrees. React cannot patch mismatched attributes and warns about the
 * whole subtree.
 *
 * So nothing is drawn until there is a real measurement. The server and the
 * browser's first render both see 0 and both render the placeholder, which is
 * the one thing they can agree on; the chart appears on the frame after. The
 * caller reserves the height in the meantime, so nothing on the page moves.
 */
export default function useChartWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      // Rounded, because a fractional width puts every gridline on a half
      // pixel and the whole chart renders soft.
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
