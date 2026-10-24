import { caseStudyStatusLabel } from "@/lib/api";

// Two states, and the difference between them matters more than usual: one of
// them is on the public website. Published is the site's own green, draft is
// deliberately quiet.
//
// Both pairs clear 4.5:1 against their own background, and the label always
// spells the state out, so colour is never the only thing carrying it.
const STYLES = {
  PUBLISHED: "border-green-700/25 bg-green-50 text-green-800",
  DRAFT: "border-black/15 bg-black/[0.04] text-black/55",
};

export default function CaseStudyStatusBadge({ status }) {
  return (
    <span
      className={`font-nav inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-[0.08em] whitespace-nowrap uppercase ${
        STYLES[status] || STYLES.DRAFT
      }`}
    >
      {caseStudyStatusLabel(status)}
    </span>
  );
}
