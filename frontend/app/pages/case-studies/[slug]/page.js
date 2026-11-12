import { notFound } from "next/navigation";
import { publicFetch, publicFetchResult } from "@/lib/server-api";
import { mediaUrl } from "@/lib/api";
import { pageMetadata } from "@/lib/site";
import CaseStudyDetail from "@/components/case-studies/case-study-detail";

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

// The client's exact meta descriptions (all under 160 characters). Keyed by
// the study's name rather than one fixed slug, because slugs are set in the
// admin panel and can differ from the seed data (e.g. "atlas-civil-group").
// A study is matched when its slug or title contains the key; any other study
// falls back to its own summary.
const SEO_DESCRIPTIONS = [
  [
    "skyline",
    "Skyline Finance brand identity case study — a modern credit union concept built on community trust and clear digital experiences. By Olamide Andrew.",
  ],
  [
    "atlas",
    "Atlas Civil Group brand case study — repositioning an infrastructure firm as a dependable partner through strategy, identity and real-world brand applications.",
  ],
  [
    "greenspark",
    "GreenSpark Energy brand case study — a renewable energy concept making clean energy easier to understand through brand strategy, identity and advertising.",
  ],
  [
    "northgate",
    "Northgate Advisory brand case study — strategy, identity and activation for an operations consulting firm whose advisors have done the job. By Olamide Andrew.",
  ],
];

function seoDescription(study) {
  const haystack = `${study.slug} ${study.title}`.toLowerCase().replace(/[\s-]+/g, "");
  const match = SEO_DESCRIPTIONS.find(([key]) => haystack.includes(key));
  return match ? match[1] : study.summary;
}

export async function generateMetadata({ params }) {
  // params is a promise in this version of Next.js.
  const { slug } = await params;
  const data = await publicFetch(`/api/case-studies/${encodeURIComponent(slug)}`);
  const study = data?.caseStudy;

  if (!study) {
    return { title: "Case Study | Olamide Andrew" };
  }

  const image = mediaUrl(study.imageUrl);

  return pageMetadata({
    title: `${study.title} — Brand Identity Design Case Study | Olamide Andrew`,
    description: seoDescription(study),
    path: `/case-studies/${encodeURIComponent(study.slug)}`,
    type: "article",
    image: image
      ? { url: image, alt: study.imageAlt || study.title }
      : undefined,
    extra: {
      publishedTime: study.publishedAt ?? undefined,
      modifiedTime: study.updatedAt ?? undefined,
    },
  });
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
