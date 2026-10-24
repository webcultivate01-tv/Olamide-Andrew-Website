"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A small popup that announces itself, sits on screen for a few seconds,
 * then dismisses itself. Used to confirm an action - the newsletter
 * signup, so far - on pages that have nothing else to show the result in.
 *
 * `useToast()` hands back the current toast (or null) and a function to
 * raise one; `<Toast toast={toast} />` renders it. Split apart so the caller
 * owns the state and can clear it early (typing again in the same field,
 * say) without this file knowing why.
 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(timerRef.current);
    setToast({ message, key: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return [toast, showToast];
}

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {/* Keyed so a second toast while the first is still fading restarts
          the animation instead of the browser deduping the identical node. */}
      <p
        key={toast.key}
        className="font-nav animate-toast-in pointer-events-auto rounded-full bg-navy px-6 py-3 text-center text-sm font-semibold tracking-[0.02em] text-white shadow-lg"
      >
        {toast.message}
      </p>
    </div>
  );
}
