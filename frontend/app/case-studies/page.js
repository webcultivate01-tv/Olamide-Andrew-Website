import { publicFetch } from "@/lib/server-api";
import CaseStudyGrid from "./_components/case-study-grid";
import BrandWorkCta from "../components/brand-work-cta";

export const metadata = {
  title: "Case Studies — Olamide",
  description:
    "Every concept starts with a business problem, not a design brief. Selected brand strategy, identity and activation work.",
};

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
