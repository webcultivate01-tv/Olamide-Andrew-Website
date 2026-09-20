import { notFound } from "next/navigation";
import { publicFetch, publicFetchResult } from "@/lib/server-api";
import CaseStudyDetail from "../_components/case-study-detail";

// Every other study to point to at the foot of the page, in the portfolio's
// own order starting right after this one and wrapping back to the start —
// the detail page's carousel handles however many come back.
function pickOtherStudies(studies, currentSlug) {
  const others = studies.filter((study) => study.slug !== currentSlug);
  const index = studies.findIndex((study) => study.slug === currentSlug);
  if (index === -1) return others;

  const ordered = [];
  for (let offset = 1; offset <= studies.length; offset++) {
    const candidate = studies[(index + offset) % studies.length];
    if (candidate.slug !== currentSlug) ordered.push(candidate);
  }
  return ordered;
}

export async function generateMetadata({ params }) {
  // params is a promise in this version of Next.js.
  const { slug } = await params;
  const data = await publicFetch(`/api/case-studies/${encodeURIComponent(slug)}`);
  const study = data?.caseStudy;

  if (!study) {
    return { title: "Case Study — Olamide" };
  }

  return {
    title: `${study.title} — Olamide`,
    description: study.summary,
  };
}

export default async function CaseStudyDetailPage({ params }) {
  const { slug } = await params;

  const [detail, listData] = await Promise.all([
    publicFetchResult(`/api/case-studies/${encodeURIComponent(slug)}`),
    publicFetch("/api/case-studies"),
  ]);

  // An API that cannot be reached is not the same as a study that isn't there.
  // Answering 404 to an outage would tell a crawler this URL is gone and leave
  // whoever runs the site looking for a deleted case study, when what is down
  // is the backend. Throwing gives the error page — and a retryable 500 —
  // instead, and says which it was in the server log.
  if (!detail.reachable) {
    throw new Error(
      `Case study "${slug}": the API at ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"} could not be reached. Is the backend running?`,
    );
  }

  // Reachable and still nothing: this study really is missing.
  if (!detail.data?.caseStudy) {
    notFound();
  }

  const otherStudies = pickOtherStudies(listData?.caseStudies ?? [], slug);

  return (
    <CaseStudyDetail study={detail.data.caseStudy} otherStudies={otherStudies} />
  );
}
