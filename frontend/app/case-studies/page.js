import { pageMetadata } from "@/lib/site";
import { publicFetch } from "@/lib/server-api";
import CaseStudyGrid from "./_components/case-study-grid";
import BrandWorkCta from "../components/brand-work-cta";

export const metadata = pageMetadata({
  title: "Brand Design Case Studies — Strategy, Identity & Activation | Olamide Andrew",
  description:
    "Every concept starts with a business problem, not a design brief. Explore selected brand strategy, visual identity and brand activation case studies by Olamide Andrew.",
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
