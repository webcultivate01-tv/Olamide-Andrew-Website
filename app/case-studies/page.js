import CaseStudyGrid from "./_components/case-study-grid";
import BrandWorkCta from "../components/brand-work-cta";

export const metadata = {
  title: "Case Studies — Olamide",
  description:
    "Every concept starts with a business problem, not a design brief. Selected brand strategy, identity and activation work.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <CaseStudyGrid />
      <BrandWorkCta />
    </>
  );
}
