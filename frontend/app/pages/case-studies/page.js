import { pageMetadata } from "@/lib/site";
import { publicFetch } from "@/lib/server-api";
import CaseStudyGrid from "@/components/case-studies/case-study-grid";
import BrandWorkCta from "@/components/shared/brand-work-cta";

export const metadata = pageMetadata({
  title: "Brand Identity Design Case Studies | Olamide Andrew",
  description:
    "Brand case studies by Olamide Andrew — brand strategy, visual identity and activation projects, each starting from a business problem, not a design brief.",
  path: "/case-studies",
});

export default async function CaseStudiesPage() {
  // Published studies only — that filter is in the API's query, not here.
  // Null when the API cannot be reached, which the grid renders as an empty
  // portfolio rather than an error page.
  const data = await publicFetch("/api/case-studies");

  return (
    <>
      <CaseStudyGrid studies={data?.caseStudies ?? []} />
      <BrandWorkCta />
    </>
  );
}
