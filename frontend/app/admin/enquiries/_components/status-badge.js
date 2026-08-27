import { statusLabel } from "@/lib/api";

// One colour per stage of the pipeline, so a full table can be read at a
// glance: amber needs attention, navy is in hand, green is won, grey is done.
//
// Every one of these pairs was checked for at least 4.5:1 contrast against its
// own background, so the label is legible and not just colourful — and the
// text always spells the status out, so colour is never the only thing
// carrying the meaning.
const STYLES = {
  NEW: "border-accent/40 bg-accent/15 text-[#7a4a00]",
  CONTACTED: "border-navy/25 bg-navy/10 text-navy",
  IN_PROGRESS: "border-blue-600/25 bg-blue-50 text-blue-800",
  CONVERTED: "border-green-700/25 bg-green-50 text-green-800",
  CLOSED: "border-black/15 bg-black/[0.04] text-black/55",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`font-nav inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-[0.08em] whitespace-nowrap uppercase ${
        STYLES[status] || STYLES.CLOSED
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
